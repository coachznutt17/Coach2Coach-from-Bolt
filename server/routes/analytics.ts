// Analytics API routes for tracking and reporting
import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { logAuditEvent } from '../lib/api';

const router = Router();

// Track analytics event
router.post('/track', async (req, res) => {
  try {
    const {
      eventName,
      userId,
      anonId,
      sessionId,
      path,
      referrer,
      userAgent,
      country,
      properties,
      experimentExposures
    } = req.body;

    if (!eventName || !anonId || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Rate limiting check (simple in-memory, use Redis in production)
    const rateLimitKey = `analytics:${anonId}`;
    // In production, implement proper rate limiting

    // Insert analytics event
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_name: eventName,
        user_id: userId || null,
        anon_id: anonId,
        session_id: sessionId,
        path: path || '',
        referrer: referrer || '',
        user_agent: userAgent || '',
        country: country || '',
        properties: properties || {},
        experiment_exposures: experimentExposures || {}
      });

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Get daily metrics (admin only)
router.get('/metrics/daily', async (req, res) => {
  try {
    const { userId } = req.query;
    const { from, to } = req.query;

    // Verify admin access
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get metrics for date range
    let query = supabase
      .from('metrics_daily')
      .select('*')
      .order('date', { ascending: true });

    if (from) {
      query = query.gte('date', from);
    }
    if (to) {
      query = query.lte('date', to);
    }

    const { data: metrics, error } = await query;

    if (error) throw error;

    res.json({ success: true, metrics: metrics || [] });
  } catch (error) {
    console.error('Error getting daily metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Get conversion funnel (admin only)
router.get('/funnel', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get funnel data
    const { data: funnelData, error } = await supabase
      .rpc('get_conversion_funnel', {
        start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: endDate || new Date().toISOString().split('T')[0]
      });

    if (error) throw error;

    res.json({ success: true, funnel: funnelData || [] });
  } catch (error) {
    console.error('Error getting funnel data:', error);
    res.status(500).json({ error: 'Failed to get funnel data' });
  }
});

// Get top resources by performance (admin only)
router.get('/top-resources', async (req, res) => {
  try {
    const { userId, metric = 'revenue', limit = 10 } = req.query;

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get top resources
    let orderBy = 'purchase_count';
    if (metric === 'views') orderBy = 'view_count';
    if (metric === 'rating') orderBy = 'rating';

    const { data: resources, error } = await supabase
      .from('resources')
      .select(`
        id,
        title,
        price_cents,
        purchase_count,
        view_count,
        rating,
        profiles!inner(first_name, last_name)
      `)
      .eq('status', 'active')
      .eq('is_listed', true)
      .order(orderBy, { ascending: false })
      .limit(parseInt(limit as string));

    if (error) throw error;

    const topResources = (resources || []).map(resource => ({
      id: resource.id,
      title: resource.title,
      revenue: (resource.price_cents / 100) * resource.purchase_count,
      conversions: resource.purchase_count,
      views: resource.view_count,
      rating: resource.rating,
      coach: `${resource.profiles.first_name} ${resource.profiles.last_name}`
    }));

    res.json({ success: true, resources: topResources });
  } catch (error) {
    console.error('Error getting top resources:', error);
    res.status(500).json({ error: 'Failed to get top resources' });
  }
});

// Compute daily metrics rollup (cron job endpoint)
router.post('/compute-daily', async (req, res) => {
  try {
    const { date, adminKey } = req.body;

    // Verify admin key for cron jobs
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Invalid admin key' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Call the database function
    const { error } = await supabase
      .rpc('compute_daily_metrics', { target_date: targetDate });

    if (error) throw error;

    res.json({ success: true, date: targetDate });
  } catch (error) {
    console.error('Error computing daily metrics:', error);
    res.status(500).json({ error: 'Failed to compute daily metrics' });
  }
});

export default router;