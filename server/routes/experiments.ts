// A/B testing experiments API routes
import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { logAuditEvent } from '../lib/api';

const router = Router();

// Get experiment variant assignment
router.post('/assign', async (req, res) => {
  try {
    const { experimentKey, subjectId } = req.body;

    if (!experimentKey || !subjectId) {
      return res.status(400).json({ error: 'Experiment key and subject ID required' });
    }

    // Get variant using database function
    const { data, error } = await supabase
      .rpc('get_experiment_variant', {
        p_experiment_key: experimentKey,
        p_subject_id: subjectId
      });

    if (error) throw error;

    const variant = data || 'control';

    res.json({ success: true, variant });
  } catch (error) {
    console.error('Error assigning experiment variant:', error);
    res.status(500).json({ error: 'Failed to assign variant' });
  }
});

// Get all experiments (admin only)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: experiments, error } = await supabase
      .from('experiments')
      .select(`
        *,
        experiment_variants(name, weight, config)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, experiments: experiments || [] });
  } catch (error) {
    console.error('Error getting experiments:', error);
    res.status(500).json({ error: 'Failed to get experiments' });
  }
});

// Create experiment (admin only)
router.post('/', async (req, res) => {
  try {
    const { userId, key, name, description, primaryMetric, variants } = req.body;

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Create experiment
    const { data: experiment, error: expError } = await supabase
      .from('experiments')
      .insert({
        key,
        name,
        description: description || '',
        primary_metric: primaryMetric,
        created_by: userId
      })
      .select()
      .single();

    if (expError) throw expError;

    // Create variants
    const variantData = variants.map((variant: any) => ({
      experiment_id: experiment.id,
      name: variant.name,
      weight: variant.weight || 50,
      config: variant.config || {}
    }));

    const { error: variantError } = await supabase
      .from('experiment_variants')
      .insert(variantData);

    if (variantError) throw variantError;

    // Log audit event
    await logAuditEvent(userId, 'experiment_created', 'experiment', experiment.id, {
      key,
      name,
      variant_count: variants.length
    });

    res.json({ success: true, experiment });
  } catch (error) {
    console.error('Error creating experiment:', error);
    res.status(500).json({ error: 'Failed to create experiment' });
  }
});

// Update experiment status (admin only)
router.patch('/:experimentId', async (req, res) => {
  try {
    const { experimentId } = req.params;
    const { userId, status, endDate } = req.body;

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const updates: any = { status };
    if (status === 'running' && !endDate) {
      updates.start_date = new Date().toISOString();
    }
    if (status === 'completed' || endDate) {
      updates.end_date = endDate || new Date().toISOString();
    }

    const { error } = await supabase
      .from('experiments')
      .update(updates)
      .eq('id', experimentId);

    if (error) throw error;

    // Log audit event
    await logAuditEvent(userId, 'experiment_updated', 'experiment', experimentId, {
      status,
      end_date: updates.end_date
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating experiment:', error);
    res.status(500).json({ error: 'Failed to update experiment' });
  }
});

// Get experiment results (admin only)
router.get('/:experimentId/results', async (req, res) => {
  try {
    const { experimentId } = req.params;
    const { userId } = req.query;

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get experiment details
    const { data: experiment, error: expError } = await supabase
      .from('experiments')
      .select(`
        *,
        experiment_variants(name, weight, config)
      `)
      .eq('id', experimentId)
      .single();

    if (expError || !experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    // Get assignment counts
    const { data: assignments, error: assignError } = await supabase
      .from('experiment_assignments')
      .select('variant_name')
      .eq('experiment_id', experimentId);

    if (assignError) throw assignError;

    // Get conversion events
    const { data: conversions, error: convError } = await supabase
      .from('analytics_events')
      .select('properties')
      .eq('event_name', 'experiment_conversion')
      .contains('properties', { experiment_key: experiment.key });

    if (convError) throw convError;

    // Calculate results by variant
    const results = experiment.experiment_variants.map((variant: any) => {
      const assignmentCount = assignments?.filter(a => a.variant_name === variant.name).length || 0;
      const conversionCount = conversions?.filter(c => 
        c.properties?.variant === variant.name
      ).length || 0;
      
      const conversionRate = assignmentCount > 0 ? (conversionCount / assignmentCount) * 100 : 0;

      return {
        variant: variant.name,
        assignments: assignmentCount,
        conversions: conversionCount,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        config: variant.config
      };
    });

    res.json({ 
      success: true, 
      experiment: {
        ...experiment,
        results
      }
    });
  } catch (error) {
    console.error('Error getting experiment results:', error);
    res.status(500).json({ error: 'Failed to get experiment results' });
  }
});

export default router;