// Push notifications and in-app notifications API
import { Router } from 'express';
import webpush from 'web-push';
import { supabase } from '../lib/supabase';
import { requireActiveMember, logAuditEvent } from '../lib/api';

const router = Router();

// Configure web push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.WEB_PUSH_SUBJECT || 'mailto:support@coach2coachnetwork.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Subscribe to push notifications
router.post('/push/subscribe', async (req, res) => {
  try {
    const { userId, subscription } = req.body;

    if (!userId || !subscription) {
      return res.status(400).json({ error: 'User ID and subscription required' });
    }

    // Verify user is active member
    const isActive = await requireActiveMember(userId);
    if (!isActive) {
      return res.status(403).json({ error: 'Active membership required for push notifications' });
    }

    // Store subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      });

    if (error) throw error;

    // Log audit event
    await logAuditEvent(userId, 'push_subscription_created', 'subscription');

    res.json({ success: true });
  } catch (error) {
    console.error('Error subscribing to push:', error);
    res.status(500).json({ error: 'Failed to subscribe to push notifications' });
  }
});

// Unsubscribe from push notifications
router.post('/push/unsubscribe', async (req, res) => {
  try {
    const { userId, endpoint } = req.body;

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (error) throw error;

    // Log audit event
    await logAuditEvent(userId, 'push_subscription_deleted', 'subscription');

    res.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from push notifications' });
  }
});

// Get user notifications
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    res.json({ 
      success: true, 
      notifications: notifications || [],
      unreadCount: unreadCount || 0
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
router.post('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.post('/read-all', async (req, res) => {
  try {
    const { userId } = req.body;

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Get/update notification preferences
router.get('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: prefs, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Create default preferences if none exist
    if (!prefs) {
      const { data: newPrefs, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          new_message: true,
          new_sale: true,
          purchase_confirmed: true,
          new_resource: true,
          moderation: true,
          via_push: true,
          via_email: true,
          via_inapp: true
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return res.json({ success: true, preferences: newPrefs });
    }

    res.json({ success: true, preferences: prefs });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({ error: 'Failed to get notification preferences' });
  }
});

router.put('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await logAuditEvent(userId, 'notification_preferences_updated', 'preferences');

    res.json({ success: true, preferences: data });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Send push notification (internal use)
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  link?: string
): Promise<void> {
  try {
    // Get user's push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (!subscriptions || subscriptions.length === 0) {
      return; // No subscriptions
    }

    const payload = JSON.stringify({
      title,
      body,
      link: link || '/',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png'
    });

    // Send to all user's devices
    const promises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }, payload);
      } catch (error) {
        console.error('Push notification failed:', error);
        
        // Remove invalid subscription
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
        }
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

export default router;