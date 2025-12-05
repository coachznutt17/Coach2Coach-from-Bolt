// Admin routes for Quality & Trust features

import { Router } from 'express';
import { stripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { logAuditEvent } from '../lib/api';

const router = Router();

// Middleware to verify admin access
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    // Get userId from body (POST/PUT) or query (GET)
    const userId = req.body.userId || req.query.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUserId = userId;
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Failed to verify admin access' });
  }
};

// GET /api/admin/moderation - Get moderation queue
router.get('/moderation', requireAdmin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const { data: queue, error } = await supabase
      .from('moderation_queue')
      .select(`
        *,
        resources!inner(
          id,
          title,
          description,
          category,
          price_cents,
          sports,
          levels,
          created_at
        ),
        profiles!uploader_id(
          first_name,
          last_name,
          email
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: true })
      .range(offset, offset + parseInt(limit as string) - 1);

    if (error) throw error;

    res.json({ success: true, queue: queue || [] });
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    res.status(500).json({ error: 'Failed to fetch moderation queue' });
  }
});

// POST /api/admin/moderation/:resourceId/approve
router.post('/moderation/:resourceId/approve', requireAdmin, async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { notes = '' } = req.body;
    const adminUserId = req.adminUserId;

    // Update moderation queue
    const { error: queueError } = await supabase
      .from('moderation_queue')
      .update({
        status: 'approved',
        notes,
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString()
      })
      .eq('resource_id', resourceId);

    if (queueError) throw queueError;

    // Update resource
    const { error: resourceError } = await supabase
      .from('resources')
      .update({
        moderation_status: 'approved',
        is_listed: true,
        moderation_notes: notes
      })
      .eq('id', resourceId);

    if (resourceError) throw resourceError;

    // Log audit event
    await logAuditEvent(adminUserId, 'resource_approved', 'resource', resourceId, { notes });

    res.json({ success: true });
  } catch (error) {
    console.error('Error approving resource:', error);
    res.status(500).json({ error: 'Failed to approve resource' });
  }
});

// POST /api/admin/moderation/:resourceId/reject
router.post('/moderation/:resourceId/reject', requireAdmin, async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { notes } = req.body;
    const adminUserId = req.adminUserId;

    if (!notes || notes.trim() === '') {
      return res.status(400).json({ error: 'Rejection notes are required' });
    }

    // Update moderation queue
    const { error: queueError } = await supabase
      .from('moderation_queue')
      .update({
        status: 'rejected',
        notes,
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString()
      })
      .eq('resource_id', resourceId);

    if (queueError) throw queueError;

    // Update resource
    const { error: resourceError } = await supabase
      .from('resources')
      .update({
        moderation_status: 'rejected',
        is_listed: false,
        moderation_notes: notes
      })
      .eq('id', resourceId);

    if (resourceError) throw resourceError;

    // Log audit event
    await logAuditEvent(adminUserId, 'resource_rejected', 'resource', resourceId, { notes });

    // TODO: Send email notification to uploader

    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting resource:', error);
    res.status(500).json({ error: 'Failed to reject resource' });
  }
});

// GET /api/admin/disputes - Get dispute queue
router.get('/disputes', requireAdmin, async (req, res) => {
  try {
    const { status = 'open', page = 1, limit = 20 } = req.query;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const { data: disputes, error } = await supabase
      .from('disputes')
      .select(`
        *,
        purchases!inner(
          amount_cents,
          stripe_payment_intent_id,
          created_at
        ),
        profiles!buyer_id(
          first_name,
          last_name,
          email
        ),
        resources!inner(
          title,
          description,
          price_cents
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: true })
      .range(offset, offset + parseInt(limit as string) - 1);

    if (error) throw error;

    res.json({ success: true, disputes: disputes || [] });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

// POST /api/admin/disputes/:disputeId/approve-refund
router.post('/disputes/:disputeId/approve-refund', requireAdmin, async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { notes, refundAmount } = req.body;
    const adminUserId = req.adminUserId;

    // Get dispute details
    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .select(`
        *,
        purchases!inner(
          amount_cents,
          stripe_payment_intent_id
        )
      `)
      .eq('id', disputeId)
      .maybeSingle();

    if (disputeError || !dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const refundAmountCents = refundAmount || dispute.purchases.amount_cents;

    // Process Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: dispute.purchases.stripe_payment_intent_id,
      amount: refundAmountCents,
      reason: 'requested_by_customer',
      metadata: {
        dispute_id: disputeId,
        admin_user_id: adminUserId
      }
    });

    // Update dispute
    const { error: updateError } = await supabase
      .from('disputes')
      .update({
        status: 'refund_approved',
        refund_amount_cents: refundAmountCents,
        stripe_refund_id: refund.id,
        decision_notes: notes,
        resolved_by: adminUserId,
        resolved_at: new Date().toISOString()
      })
      .eq('id', disputeId);

    if (updateError) throw updateError;

    // Log audit event
    await logAuditEvent(adminUserId, 'dispute_refund_approved', 'dispute', disputeId, {
      refund_amount_cents: refundAmountCents,
      stripe_refund_id: refund.id,
      notes
    });

    // TODO: Send email notifications to buyer and seller

    res.json({ success: true, refundId: refund.id });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// POST /api/admin/disputes/:disputeId/deny
router.post('/disputes/:disputeId/deny', requireAdmin, async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { notes } = req.body;
    const adminUserId = req.adminUserId;

    if (!notes || notes.trim() === '') {
      return res.status(400).json({ error: 'Decision notes are required' });
    }

    // Update dispute
    const { error } = await supabase
      .from('disputes')
      .update({
        status: 'refund_denied',
        decision_notes: notes,
        resolved_by: adminUserId,
        resolved_at: new Date().toISOString()
      })
      .eq('id', disputeId);

    if (error) throw error;

    // Log audit event
    await logAuditEvent(adminUserId, 'dispute_refund_denied', 'dispute', disputeId, { notes });

    // TODO: Send email notification to buyer

    res.json({ success: true });
  } catch (error) {
    console.error('Error denying dispute:', error);
    res.status(500).json({ error: 'Failed to deny dispute' });
  }
});

// GET /api/admin/verification - Get verification queue
router.get('/verification', requireAdmin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const { data: requests, error } = await supabase
      .from('verification_requests')
      .select(`
        *,
        profiles!inner(
          first_name,
          last_name,
          email,
          title,
          bio,
          location,
          years_experience
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: true })
      .range(offset, offset + parseInt(limit as string) - 1);

    if (error) throw error;

    res.json({ success: true, requests: requests || [] });
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    res.status(500).json({ error: 'Failed to fetch verification requests' });
  }
});

// POST /api/admin/verification/:profileId/approve
router.post('/verification/:profileId/approve', requireAdmin, async (req, res) => {
  try {
    const { profileId } = req.params;
    const { notes = '' } = req.body;
    const adminUserId = req.adminUserId;

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        is_verified_coach: true,
        verification_status: 'approved',
        verification_notes: notes
      })
      .eq('id', profileId);

    if (profileError) throw profileError;

    // Update verification request
    const { error: requestError } = await supabase
      .from('verification_requests')
      .update({
        status: 'approved',
        admin_notes: notes,
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString()
      })
      .eq('profile_id', profileId);

    if (requestError) throw requestError;

    // Log audit event
    await logAuditEvent(adminUserId, 'coach_verified', 'profile', profileId, { notes });

    // TODO: Send congratulations email to coach

    res.json({ success: true });
  } catch (error) {
    console.error('Error approving verification:', error);
    res.status(500).json({ error: 'Failed to approve verification' });
  }
});

// POST /api/admin/verification/:profileId/reject
router.post('/verification/:profileId/reject', requireAdmin, async (req, res) => {
  try {
    const { profileId } = req.params;
    const { notes } = req.body;
    const adminUserId = req.adminUserId;

    if (!notes || notes.trim() === '') {
      return res.status(400).json({ error: 'Rejection notes are required' });
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        verification_status: 'rejected',
        verification_notes: notes
      })
      .eq('id', profileId);

    if (profileError) throw profileError;

    // Update verification request
    const { error: requestError } = await supabase
      .from('verification_requests')
      .update({
        status: 'rejected',
        admin_notes: notes,
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString()
      })
      .eq('profile_id', profileId);

    if (requestError) throw requestError;

    // Log audit event
    await logAuditEvent(adminUserId, 'coach_verification_rejected', 'profile', profileId, { notes });

    // TODO: Send email with feedback to coach

    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting verification:', error);
    res.status(500).json({ error: 'Failed to reject verification' });
  }
});

// GET /api/admin/reports - Get user reports
router.get('/reports', requireAdmin, async (req, res) => {
  try {
    const { status = 'open', page = 1, limit = 20 } = req.query;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        *,
        profiles!reporter_id(
          first_name,
          last_name,
          email
        ),
        resources!inner(
          title,
          description,
          category,
          price_cents
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: true })
      .range(offset, offset + parseInt(limit as string) - 1);

    if (error) throw error;

    res.json({ success: true, reports: reports || [] });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/admin/reports/:reportId/resolve
router.post('/reports/:reportId/resolve', requireAdmin, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, notes } = req.body; // action: 'dismiss' | 'remove_resource' | 'warn_user'
    const adminUserId = req.adminUserId;

    // Update report
    const { error: reportError } = await supabase
      .from('reports')
      .update({
        status: 'resolved',
        admin_notes: notes,
        resolved_by: adminUserId,
        resolved_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (reportError) throw reportError;

    // Take action based on admin decision
    if (action === 'remove_resource') {
      const { data: report } = await supabase
        .from('reports')
        .select('resource_id')
        .eq('id', reportId)
        .maybeSingle();

      if (report) {
        await supabase
          .from('resources')
          .update({
            is_listed: false,
            moderation_status: 'rejected',
            moderation_notes: `Removed due to user report: ${notes}`
          })
          .eq('id', report.resource_id);
      }
    }

    // Log audit event
    await logAuditEvent(adminUserId, 'report_resolved', 'report', reportId, { action, notes });

    res.json({ success: true });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
});

// GET /api/admin/stats - Get admin dashboard stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      { count: pendingModeration },
      { count: openDisputes },
      { count: pendingVerification },
      { count: openReports }
    ] = await Promise.all([
      supabase.from('moderation_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('verification_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open')
    ]);

    res.json({
      success: true,
      stats: {
        pendingModeration: pendingModeration || 0,
        openDisputes: openDisputes || 0,
        pendingVerification: pendingVerification || 0,
        openReports: openReports || 0
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;