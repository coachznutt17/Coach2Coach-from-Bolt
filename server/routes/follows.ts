// Follow/Following system API routes

import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { logAuditEvent } from '../lib/api';

const router = Router();

// Follow a coach
router.post('/', async (req, res) => {
  try {
    const { followerId, followeeId } = req.body;

    if (!followerId || !followeeId) {
      return res.status(400).json({ error: 'followerId and followeeId required' });
    }

    if (followerId === followeeId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Already following this coach' });
    }

    const { data, error } = await supabase
      .from('follows')
      .insert({
        follower_id: followerId,
        followee_id: followeeId
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create notification for the followee
    await supabase.rpc('create_notification', {
      target_user_id: followeeId,
      notification_type: 'new_follower',
      notification_title: 'New Follower',
      notification_body: 'Someone started following you',
      notification_link: `/profile/${followerId}`
    }).catch((err) => {
      console.error('Failed to create notification:', err);
    });

    await logAuditEvent(followerId, 'follow_created', 'follow', data.id, {
      followee_id: followeeId
    });

    res.json({ data, error: null });
  } catch (error) {
    console.error('Error creating follow:', error);
    res.status(500).json({ error: 'Failed to follow coach' });
  }
});

// Unfollow a coach
router.delete('/:followerId/:followeeId', async (req, res) => {
  try {
    const { followerId, followeeId } = req.params;

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId);

    if (error) {
      throw error;
    }

    await logAuditEvent(followerId, 'follow_deleted', 'follow', followeeId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error unfollowing:', error);
    res.status(500).json({ error: 'Failed to unfollow coach' });
  }
});

// Check if user is following another user
router.get('/check/:followerId/:followeeId', async (req, res) => {
  try {
    const { followerId, followeeId } = req.params;

    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    res.json({ isFollowing: !!data });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// Get followers for a user
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from('follows')
      .select(`
        *,
        follower:profiles!follower_id (
          id,
          user_id,
          first_name,
          last_name,
          title,
          avatar_url,
          is_verified
        )
      `, { count: 'exact' })
      .eq('followee_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      throw error;
    }

    res.json({ data, count, error: null });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// Get following for a user
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from('follows')
      .select(`
        *,
        followee:profiles!followee_id (
          id,
          user_id,
          first_name,
          last_name,
          title,
          avatar_url,
          is_verified
        )
      `, { count: 'exact' })
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      throw error;
    }

    res.json({ data, count, error: null });
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// Get follow counts for a user
router.get('/counts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [followersResult, followingResult] = await Promise.all([
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('followee_id', userId),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)
    ]);

    res.json({
      followers: followersResult.count || 0,
      following: followingResult.count || 0
    });
  } catch (error) {
    console.error('Error fetching follow counts:', error);
    res.status(500).json({ error: 'Failed to fetch follow counts' });
  }
});

export default router;
