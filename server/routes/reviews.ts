// Review system API routes

import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { logAuditEvent } from '../lib/api';

const router = Router();

// Get reviews for a resource
router.get('/resource/:resourceId', async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { limit = 20, offset = 0, sortBy = 'newest' } = req.query;

    let query = supabase
      .from('reviews')
      .select(`
        *,
        buyer:profiles!buyer_id (
          first_name,
          last_name,
          title,
          is_verified
        )
      `)
      .eq('resource_id', resourceId);

    // Apply sorting
    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sortBy === 'helpful') {
      query = query.order('helpful_count', { ascending: false });
    } else if (sortBy === 'rating') {
      query = query.order('rating', { ascending: false });
    }

    query = query.range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({ data, error: null });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Check if user can review a resource
router.get('/can-review/:resourceId/:userId', async (req, res) => {
  try {
    const { resourceId, userId } = req.params;

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return res.json({ canReview: false, reason: 'Profile not found' });
    }

    // Check if user purchased the resource
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('id, status')
      .eq('buyer_id', profile.id)
      .eq('resource_id', resourceId)
      .eq('status', 'completed')
      .maybeSingle();

    if (purchaseError || !purchase) {
      return res.json({ canReview: false, reason: 'Must purchase resource to review' });
    }

    // Check if user already reviewed
    const { data: existingReview, error: reviewError } = await supabase
      .from('reviews')
      .select('id')
      .eq('buyer_id', profile.id)
      .eq('resource_id', resourceId)
      .maybeSingle();

    if (reviewError) {
      throw reviewError;
    }

    if (existingReview) {
      return res.json({ canReview: false, reason: 'Already reviewed', hasReview: true, reviewId: existingReview.id });
    }

    res.json({ canReview: true, profileId: profile.id });
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({ error: 'Failed to check review eligibility' });
  }
});

// Get user's review for a resource
router.get('/user/:userId/resource/:resourceId', async (req, res) => {
  try {
    const { userId, resourceId } = req.params;

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('buyer_id', profile.id)
      .eq('resource_id', resourceId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    res.json({ data, error: null });
  } catch (error) {
    console.error('Error fetching user review:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// Create a review
router.post('/', async (req, res) => {
  try {
    const { userId, resourceId, rating, title, comment } = req.body;

    if (!userId || !resourceId || !rating || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Verify user purchased the resource
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('id')
      .eq('buyer_id', profile.id)
      .eq('resource_id', resourceId)
      .eq('status', 'completed')
      .maybeSingle();

    if (purchaseError || !purchase) {
      return res.status(403).json({ error: 'Must purchase resource before reviewing' });
    }

    // Create review
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        buyer_id: profile.id,
        resource_id: resourceId,
        rating,
        title: title.trim(),
        comment: (comment || '').trim(),
        helpful_count: 0
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(400).json({ error: 'You have already reviewed this resource' });
      }
      throw insertError;
    }

    await logAuditEvent(userId, 'review_created', 'review', review.id, {
      resource_id: resourceId,
      rating
    });

    res.json({ data: review, error: null });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update a review
router.put('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId, rating, title, comment } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Verify ownership
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('buyer_id, resource_id')
      .eq('id', reviewId)
      .eq('buyer_id', profile.id)
      .maybeSingle();

    if (checkError || !existingReview) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    // Build update object
    const updates: any = {};
    if (rating !== undefined) updates.rating = rating;
    if (title !== undefined) updates.title = title.trim();
    if (comment !== undefined) updates.comment = comment.trim();

    const { data: review, error: updateError } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    await logAuditEvent(userId, 'review_updated', 'review', reviewId);

    res.json({ data: review, error: null });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review
router.delete('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Verify ownership
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('buyer_id')
      .eq('id', reviewId)
      .eq('buyer_id', profile.id)
      .maybeSingle();

    if (checkError || !existingReview) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteError) {
      throw deleteError;
    }

    await logAuditEvent(userId, 'review_deleted', 'review', reviewId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
