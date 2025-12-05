// Real-time messaging API routes
import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requireActiveMember, logAuditEvent } from '../lib/api';

const router = Router();

// Create or get conversation
router.post('/conversations', async (req, res) => {
  try {
    const { userId, participantIds, type = 'dm', resourceId, title } = req.body;

    // Verify user is active member
    const isActive = await requireActiveMember(userId);
    if (!isActive) {
      return res.status(403).json({ error: 'Active membership required for messaging' });
    }

    // Check if conversation already exists for DM
    if (type === 'dm' && participantIds.length === 2) {
      const { data: existing } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(user_id)
        `)
        .eq('type', 'dm')
        .eq('conversation_participants.user_id', participantIds[0])
        .eq('conversation_participants.user_id', participantIds[1])
        .maybeSingle();

      if (existing) {
        return res.json({ success: true, conversation: existing });
      }
    }

    // Create new conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert([{
        type,
        resource_id: resourceId,
        title: title || ''
      }])
      .select()
      .single();

    if (convError) throw convError;

    // Add participants
    const participantData = participantIds.map((userId: string) => ({
      conversation_id: conversation.id,
      user_id: userId
    }));

    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert(participantData);

    if (participantError) throw participantError;

    // Log audit event
    await logAuditEvent(userId, 'conversation_created', 'conversation', conversation.id, {
      type,
      participant_count: participantIds.length
    });

    res.json({ success: true, conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get conversation messages
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return res.status(403).json({ error: 'Not a participant in this conversation' });
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({ success: true, messages: (messages || []).reverse() });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message
router.post('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, body, attachmentPath, attachmentType } = req.body;

    if (!userId || !body?.trim()) {
      return res.status(400).json({ error: 'User ID and message body required' });
    }

    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return res.status(403).json({ error: 'Not a participant in this conversation' });
    }

    // Check if any participants have blocked this user
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', userId);

    for (const p of participants || []) {
      const { data: block } = await supabase
        .from('blocks')
        .select('id')
        .or(`and(blocker_id.eq.${userId},blocked_id.eq.${p.user_id}),and(blocker_id.eq.${p.user_id},blocked_id.eq.${userId})`)
        .single();

      if (block) {
        return res.status(403).json({ error: 'Cannot send message to blocked user' });
      }
    }

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: userId,
        body: body.trim(),
        attachment_path: attachmentPath,
        attachment_type: attachmentType
      }])
      .select()
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Create notifications for other participants
    const otherParticipants = (participants || []).filter(p => p.user_id !== userId);
    
    for (const participant of otherParticipants) {
      // Check notification preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('new_message, via_inapp, via_push, via_email')
        .eq('user_id', participant.user_id)
        .single();

      if (prefs?.new_message) {
        // Create in-app notification
        if (prefs.via_inapp) {
          await supabase
            .from('notifications')
            .insert({
              user_id: participant.user_id,
              type: 'new_message',
              title: 'New Message',
              body: `${getSenderName(userId)} sent you a message`,
              link: `/messages/${conversationId}`
            });
        }

        // TODO: Send push notification if via_push enabled
        // TODO: Send email notification if via_email enabled
      }
    }

    // Log audit event
    await logAuditEvent(userId, 'message_sent', 'message', message.id, {
      conversation_id: conversationId,
      has_attachment: !!attachmentPath
    });

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark conversation as read
router.post('/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Block user
router.post('/block', async (req, res) => {
  try {
    const { blockerId, blockedId } = req.body;

    if (!blockerId || !blockedId) {
      return res.status(400).json({ error: 'Blocker and blocked user IDs required' });
    }

    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const { error } = await supabase
      .from('blocks')
      .insert([{
        blocker_id: blockerId,
        blocked_id: blockedId
      }]);

    if (error) throw error;

    // Log audit event
    await logAuditEvent(blockerId, 'user_blocked', 'user', blockedId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// Unblock user
router.delete('/block', async (req, res) => {
  try {
    const { blockerId, blockedId } = req.body;

    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);

    if (error) throw error;

    // Log audit event
    await logAuditEvent(blockerId, 'user_unblocked', 'user', blockedId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

function getSenderName(userId: string): string {
  // This would typically fetch from your user database
  return 'Coach';
}

export default router;