import React, { useState } from 'react';
import { UserPlus, UserCheck, Users, Star, MapPin, Award, Bell, BellOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { profileStorage } from '../lib/localStorage';

interface FollowingRelationship {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
  notifications: boolean;
}

interface CoachFollowingProps {
  coachId?: string;
  showFollowButton?: boolean;
}

const CoachFollowing: React.FC<CoachFollowingProps> = ({ 
  coachId, 
  showFollowButton = true 
}) => {
  const { user } = useAuth();
  
  // Mock following relationships - in real app, this would come from your backend
  const [followingRelationships, setFollowingRelationships] = useState<FollowingRelationship[]>([
    {
      id: '1',
      followerId: 'current-user',
      followingId: 'coach1',
      createdAt: '2024-01-15T10:00:00Z',
      notifications: true
    }
  ]);

  const [followedCoaches, setFollowedCoaches] = useState<string[]>(['coach1']);
  const [loading, setLoading] = useState(false);

  // Get all coach profiles for display
  const allProfiles = profileStorage.getProfiles();
  
  // Mock featured coaches to follow
  const featuredCoaches = [
    {
      id: 'coach1',
      firstName: 'Mike',
      lastName: 'Johnson',
      title: 'Basketball Skills Trainer',
      location: 'Atlanta, GA',
      followers: 1247,
      resources: 23,
      rating: 4.9,
      specialties: ['Ball Handling', 'Shooting', 'Player Development'],
      recentActivity: 'Uploaded new drill collection 2 days ago'
    },
    {
      id: 'coach2',
      firstName: 'Sarah',
      lastName: 'Williams',
      title: 'High School Soccer Coach',
      location: 'Austin, TX',
      followers: 892,
      resources: 18,
      rating: 4.8,
      specialties: ['Team Strategy', 'Conditioning', 'Mental Training'],
      recentActivity: 'Published practice plan template 1 week ago'
    },
    {
      id: 'coach3',
      firstName: 'Tom',
      lastName: 'Davis',
      title: 'Youth Football Coach',
      location: 'Denver, CO',
      followers: 634,
      resources: 15,
      rating: 4.7,
      specialties: ['Fundamentals', 'Team Building', 'Safety'],
      recentActivity: 'Shared new playbook 3 days ago'
    }
  ];

  const isFollowing = (coachId: string) => {
    return followedCoaches.includes(coachId);
  };

  const handleFollow = async (targetCoachId: string) => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      if (isFollowing(targetCoachId)) {
        // Unfollow
        setFollowedCoaches(prev => prev.filter(id => id !== targetCoachId));
        setFollowingRelationships(prev => 
          prev.filter(rel => !(rel.followerId === user.id && rel.followingId === targetCoachId))
        );
      } else {
        // Follow
        setFollowedCoaches(prev => [...prev, targetCoachId]);
        const newRelationship: FollowingRelationship = {
          id: Date.now().toString(),
          followerId: user.id,
          followingId: targetCoachId,
          createdAt: new Date().toISOString(),
          notifications: true
        };
        setFollowingRelationships(prev => [...prev, newRelationship]);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = (targetCoachId: string) => {
    setFollowingRelationships(prev =>
      prev.map(rel => {
        if (rel.followerId === user?.id && rel.followingId === targetCoachId) {
          return { ...rel, notifications: !rel.notifications };
        }
        return rel;
      })
    );
  };

  const getNotificationStatus = (targetCoachId: string) => {
    const relationship = followingRelationships.find(
      rel => rel.followerId === user?.id && rel.followingId === targetCoachId
    );
    return relationship?.notifications || false;
  };

  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Join the Coach Community</h3>
        <p className="text-gray-600">Sign in to follow coaches and get updates on their latest resources</p>
      </div>
    );
  }

  // Single coach follow button
  if (coachId && showFollowButton) {
    const coach = featuredCoaches.find(c => c.id === coachId);
    if (!coach) return null;

    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleFollow(coachId)}
          disabled={loading}
          className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors ${
            isFollowing(coachId)
              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {isFollowing(coachId) ? (
            <>
              <UserCheck className="w-4 h-4 mr-2" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Follow
            </>
          )}
        </button>
        
        {isFollowing(coachId) && (
          <button
            onClick={() => toggleNotifications(coachId)}
            className={`p-2 rounded-lg transition-colors ${
              getNotificationStatus(coachId)
                ? 'text-emerald-600 hover:bg-emerald-50'
                : 'text-gray-400 hover:bg-gray-50'
            }`}
            title={getNotificationStatus(coachId) ? 'Notifications on' : 'Notifications off'}
          >
            {getNotificationStatus(coachId) ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    );
  }

  // Full coach discovery component
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Discover Coaches</h2>
            <p className="text-gray-600">Follow coaches to get updates on their latest resources</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">{followedCoaches.length}</div>
            <div className="text-sm text-gray-600">Following</div>
          </div>
        </div>
      </div>

      {/* Featured Coaches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredCoaches.map((coach) => (
          <div key={coach.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Coach Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{coach.firstName} {coach.lastName}</h3>
                    <p className="text-sm text-emerald-600 font-medium">{coach.title}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleFollow(coach.id)}
                    disabled={loading}
                    className={`flex items-center px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                      isFollowing(coach.id)
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {isFollowing(coach.id) ? (
                      <>
                        <UserCheck className="w-3 h-3 mr-1" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 mr-1" />
                        Follow
                      </>
                    )}
                  </button>
                  
                  {isFollowing(coach.id) && (
                    <button
                      onClick={() => toggleNotifications(coach.id)}
                      className={`p-1 rounded transition-colors ${
                        getNotificationStatus(coach.id)
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {getNotificationStatus(coach.id) ? (
                        <Bell className="w-3 h-3" />
                      ) : (
                        <BellOff className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4 mr-1" />
                {coach.location}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                  <div className="font-bold text-slate-900">{coach.followers}</div>
                  <div className="text-xs text-gray-600">Followers</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900">{coach.resources}</div>
                  <div className="text-xs text-gray-600">Resources</div>
                </div>
                <div>
                  <div className="flex items-center justify-center">
                    <Star className="w-3 h-3 text-yellow-400 mr-1" />
                    <span className="font-bold text-slate-900">{coach.rating}</span>
                  </div>
                  <div className="text-xs text-gray-600">Rating</div>
                </div>
              </div>

              {/* Specialties */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {coach.specialties.slice(0, 2).map((specialty, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {specialty}
                    </span>
                  ))}
                  {coach.specialties.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{coach.specialties.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center">
                  <Award className="w-3 h-3 mr-1" />
                  {coach.recentActivity}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Following List */}
      {followedCoaches.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Coaches You Follow</h3>
          <div className="space-y-3">
            {followedCoaches.map((coachId) => {
              const coach = featuredCoaches.find(c => c.id === coachId);
              if (!coach) return null;
              
              return (
                <div key={coachId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                      <Users className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{coach.firstName} {coach.lastName}</div>
                      <div className="text-sm text-gray-600">{coach.title}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleNotifications(coachId)}
                      className={`p-2 rounded-lg transition-colors ${
                        getNotificationStatus(coachId)
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {getNotificationStatus(coachId) ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleFollow(coachId)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Unfollow
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachFollowing;