import React, { useState } from 'react';
import { MessageCircle, Users, TrendingUp, Award, Bell, Search, Filter } from 'lucide-react';
import MessagingCenter from './MessagingCenter';
import DiscussionBoards from './DiscussionBoards';
import CoachFollowing from './CoachFollowing';

const CommunityHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'discussions' | 'messages' | 'following'>('discussions');

  const tabs = [
    {
      id: 'discussions' as const,
      label: 'Discussion Boards',
      icon: MessageCircle,
      description: 'Join coaching discussions and share knowledge'
    },
    {
      id: 'messages' as const,
      label: 'Direct Messages',
      icon: Users,
      description: 'Private conversations with other coaches'
    },
    {
      id: 'following' as const,
      label: 'Following',
      icon: Bell,
      description: 'Coaches you follow and community updates'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Community Hub</h1>
              <p className="text-gray-600">Connect, learn, and grow with the coaching community</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'discussions' && <DiscussionBoards />}
        {activeTab === 'messages' && <MessagingCenter />}
        {activeTab === 'following' && <CoachFollowing />}
      </div>

      {/* Community Stats */}
      <div className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900">1,247</div>
              <div className="text-sm text-gray-600">Active Coaches</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">3,892</div>
              <div className="text-sm text-gray-600">Discussion Posts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">12,456</div>
              <div className="text-sm text-gray-600">Messages Sent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">567</div>
              <div className="text-sm text-gray-600">Resources Shared</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityHub;