import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, User, Circle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { messaging, subscribeToConversation, subscribeToPresence, sendTypingIndicator } from '../lib/messaging';
import { userStorage, profileStorage } from '../lib/localStorage';

interface RealtimeMessagingProps {
  conversationId: string;
  onClose?: () => void;
  className?: string;
}

const RealtimeMessaging: React.FC<RealtimeMessagingProps> = ({
  conversationId,
  onClose,
  className = ''
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      
      // Subscribe to real-time messages
      const messageChannel = subscribeToConversation(conversationId, (message) => {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      });

      // Subscribe to presence
      const presenceChannel = subscribeToPresence(conversationId, user?.id || '');

      return () => {
        messageChannel?.unsubscribe();
        presenceChannel?.unsubscribe();
      };
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const msgs = await messaging.getMessages(conversationId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      const message = await messaging.sendMessage({
        conversationId,
        senderId: user.id,
        body: newMessage.trim()
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Stop typing indicator
      sendTypingIndicator(conversationId, user.id, false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (!user) return;

    // Send typing indicator
    sendTypingIndicator(conversationId, user.id, true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(conversationId, user.id, false);
    }, 3000);
  };

  const getSenderName = (senderId: string) => {
    if (senderId === user?.id) return 'You';
    
    const sender = userStorage.getUserById(senderId);
    const profile = profileStorage.getProfileByUserId(senderId);
    
    if (profile) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    if (sender) {
      return `${sender.firstName} ${sender.lastName}`;
    }
    return 'Coach';
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  if (!user) return null;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 flex flex-col ${className}`} style={{ height: '500px' }}>
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <Circle className="absolute -bottom-1 -right-1 w-3 h-3 text-green-500 fill-current" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Coach Chat</h3>
              <p className="text-xs text-gray-600">
                {onlineUsers.length > 0 ? 'Online' : 'Last seen recently'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Video className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.senderId === user.id;
          return (
            <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isOwn 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-slate-900'
              }`}>
                {!isOwn && (
                  <p className="text-xs font-semibold mb-1 opacity-75">
                    {getSenderName(message.senderId)}
                  </p>
                )}
                <p className="text-sm">{message.body}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'text-emerald-100' : 'text-gray-500'}`}>
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        
        {/* Typing Indicator */}
        {typing.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-600 ml-2">typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Paperclip className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Smile className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || loading}
            className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealtimeMessaging;