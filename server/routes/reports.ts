// User reporting routes

import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requireActiveMember, logAuditEvent } from '../lib/api';

const router = Router();

// POST /api/reports - Create a new report
router.post('/', async (req, res) => {
  try {
    const { userId, resourceId, reason, details } = req.body;

    if (!userId || !resourceId || !reason || !details) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Verify resource exists
    const { data: resource } = await supabase
      .from('resources')
      .select('id, title')
      .eq('id', resourceId)
      .single();

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Check if user already reported this resource
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', profile.id)
      .eq('resource_id', resourceId)
      .single();

    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this resource' });
    }

    // Create report
    const { data: newReport, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: profile.id,
        resource_id: resourceId,
        reason,
        details
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await logAuditEvent(userId, 'report_created', 'resource', resourceId, {
      reason,
      report_id: newReport.id
    });

    res.json({ success: true, reportId: newReport.id });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// POST /api/disputes - Create a new dispute
router.post('/disputes', async (req, res) => {
  try {
    const { userId, purchaseId, reason, details } = req.body;

    if (!userId || !purchaseId || !reason || !details) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Verify purchase belongs to user
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id, resource_id, buyer_id, amount_cents, created_at')
      .eq('id', purchaseId)
      .eq('buyer_id', profile.id)
      .single();

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found or not owned by user' });
    }

    // Check if dispute already exists
    const { data: existingDispute } = await supabase
      .from('disputes')
      .select('id')
      .eq('purchase_id', purchaseId)
      .single();

    if (existingDispute) {
      return res.status(400).json({ error: 'Dispute already exists for this purchase' });
    }

    // Check if purchase is recent enough for dispute (e.g., within 30 days)
    const purchaseDate = new Date(purchase.created_at);
    const daysSincePurchase = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSincePurchase > 30) {
      return res.status(400).json({ error: 'Disputes must be opened within 30 days of purchase' });
    }

    // Create dispute
    const { data: newDispute, error } = await supabase
      .from('disputes')
      .insert({
        purchase_id: purchaseId,
        buyer_id: profile.id,
        resource_id: purchase.resource_id,
        reason,
        details
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await logAuditEvent(userId, 'dispute_created', 'purchase', purchaseId, {
      reason,
      dispute_id: newDispute.id
    });

    res.json({ success: true, disputeId: newDispute.id });
  } catch (error) {
    console.error('Error creating dispute:', error);
    res.status(500).json({ error: 'Failed to create dispute' });
  }
});

// POST /api/verification/request - Request coach verification
router.post('/verification/request', async (req, res) => {
  try {
    const { userId, credentials, proofDocuments } = req.body;

    if (!userId || !credentials) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, verification_status')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Check if already verified or pending
    if (profile.verification_status === 'approved') {
      return res.status(400).json({ error: 'Coach is already verified' });
    }

    if (profile.verification_status === 'pending') {
      return res.status(400).json({ error: 'Verification request already pending' });
    }

    // Create or update verification request
    const { data: request, error } = await supabase
      .from('verification_requests')
      .upsert({
        profile_id: profile.id,
        credentials_text: credentials,
        proof_documents: proofDocuments || [],
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Update profile status
    await supabase
      .from('profiles')
      .update({ verification_status: 'pending' })
      .eq('id', profile.id);

    // Log audit event
    await logAuditEvent(userId, 'verification_requested', 'profile', profile.id);

    res.json({ success: true, requestId: request.id });
  } catch (error) {
    console.error('Error creating verification request:', error);
    res.status(500).json({ error: 'Failed to create verification request' });
  }
});

export default router;