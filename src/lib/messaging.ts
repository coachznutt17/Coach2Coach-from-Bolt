// Real-time messaging system for Coach2Coach
import { supabase } from './supabase';
import { generateId } from './localStorage';

export interface Conversation {
  id: string;
  type: 'dm' | 'resource';
  resourceId?: string;
  title: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  isMuted: boolean;
  lastReadAt: string;
  joinedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  attachmentPath?: string;
  attachmentType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

// Discussion Board interfaces
export interface DiscussionBoard {
  id: string;
  title: string;
  description: string;
  category: string;
  sport?: string;
  level?: string;
  creatorId: string;
  isPinned: boolean;
  isLocked: boolean;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionPost {
  id: string;
  boardId: string;
  title: string;
  content: string;
  authorId: string;
  postType: 'discussion' | 'question' | 'resource_share';
  isPinned: boolean;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionReply {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
}

// Local storage keys for demo mode
const STORAGE_KEYS = {
  conversations: 'coach2coach_conversations',
  messages: 'coach2coach_messages',
  blocks: 'coach2coach_blocks',
  discussionBoards: 'coach2coach_discussion_boards',
  discussionPosts: 'coach2coach_discussion_posts',
  discussionReplies: 'coach2coach_discussion_replies'
};

// Messaging functions
export const messaging = {
  // Get all conversations for a user
  getConversations: async (userId: string): Promise<Conversation[]> => {
    if (!supabase) {
      const conversations = JSON.parse(localStorage.getItem(STORAGE_KEYS.conversations) || '[]');
      return conversations.filter((c: any) => 
        c.participants.some((p: any) => p.userId === userId)
      );
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(
            user_id,
            is_muted,
            last_read_at,
            joined_at
          )
        `)
        .eq('conversation_participants.user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Fallback to localStorage
      const conversations = JSON.parse(localStorage.getItem(STORAGE_KEYS.conversations) || '[]');
      return conversations.filter((c: any) => 
        c.participants.some((p: any) => p.userId === userId)
      );
    }
  },

  // Create a new conversation
  createConversation: async (
    type: 'dm' | 'resource',
    participantIds: string[],
    resourceId?: string,
    title?: string
  ): Promise<Conversation> => {
    const conversation = {
      id: generateId(),
      type,
      resourceId,
      title: title || '',
      participants: participantIds.map(userId => ({
        id: generateId(),
        conversationId: '',
        userId,
        isMuted: false,
        lastReadAt: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      })),
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!supabase) {
      const conversations = JSON.parse(localStorage.getItem(STORAGE_KEYS.conversations) || '[]');
      conversations.push(conversation);
      localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(conversations));
      return conversation;
    }

    try {
      // Create conversation
      const { data: newConversation, error: convError } = await supabase
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
      const participantData = participantIds.map(userId => ({
        conversation_id: newConversation.id,
        user_id: userId
      }));

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participantData);

      if (participantError) throw participantError;

      return {
        ...conversation,
        id: newConversation.id
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Fallback to localStorage
      const conversations = JSON.parse(localStorage.getItem(STORAGE_KEYS.conversations) || '[]');
      conversations.push(conversation);
      localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(conversations));
      return conversation;
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId: string, limit: number = 50): Promise<Message[]> => {
    if (!supabase) {
      const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.messages) || '[]');
      return messages
        .filter((m: Message) => m.conversationId === conversationId)
        .slice(-limit);
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).reverse();
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fallback to localStorage
      const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.messages) || '[]');
      return messages
        .filter((m: Message) => m.conversationId === conversationId)
        .slice(-limit);
    }
  },

  // Send a message
  sendMessage: async (message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> => {
    const newMessage: Message = {
      ...message,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!supabase) {
      const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.messages) || '[]');
      messages.push(newMessage);
      localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
      return newMessage;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: message.conversationId,
          sender_id: message.senderId,
          body: message.body,
          attachment_path: message.attachmentPath,
          attachment_type: message.attachmentType
        }])
        .select()
        .single();

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', message.conversationId);

      return {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        body: data.body,
        attachmentPath: data.attachment_path,
        attachmentType: data.attachment_type,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback to localStorage
      const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.messages) || '[]');
      messages.push(newMessage);
      localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
      return newMessage;
    }
  },

  // Mark conversation as read
  markAsRead: async (conversationId: string, userId: string): Promise<void> => {
    if (!supabase) {
      // Update localStorage participant data
      const conversations = JSON.parse(localStorage.getItem(STORAGE_KEYS.conversations) || '[]');
      const updatedConversations = conversations.map((c: any) => {
        if (c.id === conversationId) {
          return {
            ...c,
            participants: c.participants.map((p: any) => 
              p.userId === userId 
                ? { ...p, lastReadAt: new Date().toISOString() }
                : p
            )
          };
        }
        return c;
      });
      localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(updatedConversations));
      return;
    }

    try {
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  },

  // Block/unblock user
  blockUser: async (blockerId: string, blockedId: string): Promise<void> => {
    if (!supabase) {
      const blocks = JSON.parse(localStorage.getItem(STORAGE_KEYS.blocks) || '[]');
      blocks.push({
        id: generateId(),
        blockerId,
        blockedId,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEYS.blocks, JSON.stringify(blocks));
      return;
    }

    try {
      await supabase
        .from('blocks')
        .insert([{
          blocker_id: blockerId,
          blocked_id: blockedId
        }]);
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  },

  unblockUser: async (blockerId: string, blockedId: string): Promise<void> => {
    if (!supabase) {
      const blocks = JSON.parse(localStorage.getItem(STORAGE_KEYS.blocks) || '[]');
      const filteredBlocks = blocks.filter((b: any) => 
        !(b.blockerId === blockerId && b.blockedId === blockedId)
      );
      localStorage.setItem(STORAGE_KEYS.blocks, JSON.stringify(filteredBlocks));
      return;
    }

    try {
      await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId);
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  },

  // Check if user is blocked
  isBlocked: async (userId1: string, userId2: string): Promise<boolean> => {
    if (!supabase) {
      const blocks = JSON.parse(localStorage.getItem(STORAGE_KEYS.blocks) || '[]');
      return blocks.some((b: any) => 
        (b.blockerId === userId1 && b.blockedId === userId2) ||
        (b.blockerId === userId2 && b.blockedId === userId1)
      );
    }

    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('id')
        .or(`and(blocker_id.eq.${userId1},blocked_id.eq.${userId2}),and(blocker_id.eq.${userId2},blocked_id.eq.${userId1})`)
        .limit(1);

      if (error) throw error;
      return (data || []).length > 0;
    } catch (error) {
      console.error('Error checking block status:', error);
      return false;
    }
  }
};

// Discussion functions
export const discussions = {
  // Get all discussion boards
  getBoards: async (): Promise<DiscussionBoard[]> => {
    if (!supabase) {
      const boards = JSON.parse(localStorage.getItem(STORAGE_KEYS.discussionBoards) || '[]');
      return boards;
    }

    try {
      const { data, error } = await supabase
        .from('discussion_boards')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading discussion boards:', error);
      const boards = JSON.parse(localStorage.getItem(STORAGE_KEYS.discussionBoards) || '[]');
      return boards;
    }
  },

  // Get posts for a board
  getPosts: async (boardId: string): Promise<DiscussionPost[]> => {
    if (!supabase) {
      const posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.discussionPosts) || '[]');
      return posts.filter((p: DiscussionPost) => p.boardId === boardId);
    }

    try {
      const { data, error } = await supabase
        .from('discussion_posts')
        .select('*')
        .eq('board_id', boardId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading discussion posts:', error);
      const posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.discussionPosts) || '[]');
      return posts.filter((p: DiscussionPost) => p.boardId === boardId);
    }
  },

  // Get replies for a post
  getReplies: async (postId: string): Promise<DiscussionReply[]> => {
    if (!supabase) {
      const replies = JSON.parse(localStorage.getItem(STORAGE_KEYS.discussionReplies) || '[]');
      return replies.filter((r: DiscussionReply) => r.postId === postId);
    }

    try {
      const { data, error } = await supabase
        .from('discussion_replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading discussion replies:', error);
      const replies = JSON.parse(localStorage.getItem(STORAGE_KEYS.discussionReplies) || '[]');
      return replies.filter((r: DiscussionReply) => r.postId === postId);
    }
  }
};

// Initialize sample messaging data
export const initializeMessagingData = (): void => {
  // Sample conversations
  const sampleConversations = [
    {
      id: 'conv1',
      type: 'dm',
      title: '',
      participants: [
        {
          id: 'part1',
          conversationId: 'conv1',
          userId: 'user1',
          isMuted: false,
          lastReadAt: '2024-01-15T10:00:00Z',
          joinedAt: '2024-01-10T10:00:00Z'
        },
        {
          id: 'part2',
          conversationId: 'conv1',
          userId: 'current-user',
          isMuted: false,
          lastReadAt: '2024-01-15T14:30:00Z',
          joinedAt: '2024-01-10T10:00:00Z'
        }
      ],
      unreadCount: 0,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z'
    }
  ];

  // Sample messages
  const sampleMessages = [
    {
      id: 'msg1',
      conversationId: 'conv1',
      senderId: 'user1',
      body: 'Hey! I saw your basketball drills resource. Really impressive work!',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'msg2',
      conversationId: 'conv1',
      senderId: 'current-user',
      body: 'Thanks! I\'ve been working on those drills for years. Glad you found them helpful.',
      createdAt: '2024-01-15T10:05:00Z',
      updatedAt: '2024-01-15T10:05:00Z'
    },
    {
      id: 'msg3',
      conversationId: 'conv1',
      senderId: 'user1',
      body: 'Would love to collaborate on some content. Do you have any football drills?',
      createdAt: '2024-01-15T14:30:00Z',
      updatedAt: '2024-01-15T14:30:00Z'
    }
  ];

  // Only initialize if data doesn't exist
  if (!localStorage.getItem(STORAGE_KEYS.conversations)) {
    localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(sampleConversations));
  }
  if (!localStorage.getItem(STORAGE_KEYS.messages)) {
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(sampleMessages));
  }
  if (!localStorage.getItem(STORAGE_KEYS.blocks)) {
    localStorage.setItem(STORAGE_KEYS.blocks, JSON.stringify([]));
  }

  // Sample discussion boards
  const sampleBoards: DiscussionBoard[] = [
    {
      id: 'board1',
      title: 'Basketball Coaching Tips',
      description: 'Share and discuss basketball coaching strategies, drills, and techniques',
      category: 'Sport Specific',
      sport: 'Basketball',
      level: 'All Levels',
      creatorId: 'user1',
      isPinned: true,
      isLocked: false,
      postCount: 15,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z'
    },
    {
      id: 'board2',
      title: 'Youth Development',
      description: 'Discuss coaching approaches for young athletes and character development',
      category: 'Age Group',
      level: 'Youth',
      creatorId: 'user2',
      isPinned: false,
      isLocked: false,
      postCount: 8,
      createdAt: '2024-01-12T10:00:00Z',
      updatedAt: '2024-01-14T16:20:00Z'
    }
  ];

  // Sample discussion posts
  const samplePosts: DiscussionPost[] = [
    {
      id: 'post1',
      boardId: 'board1',
      title: 'Best defensive drills for beginners?',
      content: 'I\'m looking for some effective defensive drills that work well with beginner players. What are your go-to exercises?',
      authorId: 'user1',
      postType: 'question',
      isPinned: false,
      upvotes: 12,
      downvotes: 1,
      replyCount: 5,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z'
    },
    {
      id: 'post2',
      boardId: 'board1',
      title: 'Zone Defense vs Man-to-Man',
      content: 'Let\'s discuss the pros and cons of zone defense versus man-to-man coverage for different age groups.',
      authorId: 'user2',
      postType: 'discussion',
      isPinned: true,
      upvotes: 8,
      downvotes: 0,
      replyCount: 3,
      createdAt: '2024-01-14T15:00:00Z',
      updatedAt: '2024-01-15T12:00:00Z'
    }
  ];

  // Sample discussion replies
  const sampleReplies: DiscussionReply[] = [
    {
      id: 'reply1',
      postId: 'post1',
      content: 'I\'ve had great success with the shell drill. Start with 4-on-0, then progress to 4-on-4. Really helps players understand positioning.',
      authorId: 'user2',
      upvotes: 5,
      downvotes: 0,
      createdAt: '2024-01-15T11:00:00Z',
      updatedAt: '2024-01-15T11:00:00Z'
    },
    {
      id: 'reply2',
      postId: 'post1',
      content: 'Mirror drills are also excellent. Have players mirror their partner\'s movements without a ball first.',
      authorId: 'user3',
      upvotes: 3,
      downvotes: 0,
      createdAt: '2024-01-15T12:30:00Z',
      updatedAt: '2024-01-15T12:30:00Z'
    }
  ];

  // Initialize discussion data if it doesn't exist
  if (!localStorage.getItem(STORAGE_KEYS.discussionBoards)) {
    localStorage.setItem(STORAGE_KEYS.discussionBoards, JSON.stringify(sampleBoards));
  }
  if (!localStorage.getItem(STORAGE_KEYS.discussionPosts)) {
    localStorage.setItem(STORAGE_KEYS.discussionPosts, JSON.stringify(samplePosts));
  }
  if (!localStorage.getItem(STORAGE_KEYS.discussionReplies)) {
    localStorage.setItem(STORAGE_KEYS.discussionReplies, JSON.stringify(sampleReplies));
  }
};

// Realtime subscriptions
export const subscribeToConversation = (conversationId: string, onMessage: (message: Message) => void) => {
  if (!supabase) return null;

  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        const message: Message = {
          id: payload.new.id,
          conversationId: payload.new.conversation_id,
          senderId: payload.new.sender_id,
          body: payload.new.body,
          attachmentPath: payload.new.attachment_path,
          attachmentType: payload.new.attachment_type,
          createdAt: payload.new.created_at,
          updatedAt: payload.new.updated_at
        };
        onMessage(message);
      }
    )
    .subscribe();

  return channel;
};

// Presence tracking
export const subscribeToPresence = (conversationId: string, userId: string) => {
  if (!supabase) return null;

  const channel = supabase
    .channel(`presence:${conversationId}`)
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('Presence state:', state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString()
        });
      }
    });

  return channel;
};

// Typing indicators
export const sendTypingIndicator = (conversationId: string, userId: string, isTyping: boolean) => {
  if (!supabase) return;

  const channel = supabase.channel(`typing:${conversationId}`);
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { user_id: userId, is_typing: isTyping }
  });
};