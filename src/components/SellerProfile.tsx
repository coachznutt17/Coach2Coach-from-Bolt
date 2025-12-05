import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Users, Camera, MapPin, Award, Calendar, Star, CreditCard as Edit3, Save, X, DollarSign, TrendingUp, FileText, Plus, Eye, CreditCard as Edit, BarChart3, CreditCard, PieChart, ArrowUpRight, Clock, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/supabase';
import { calculateCommission } from '../lib/stripe';

interface SellerProfileProps {
  isOwner?: boolean;
}

const SellerProfile: React.FC<SellerProfileProps> = ({ isOwner = false }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [profile, setProfile] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        console.log('No user logged in');
        setLoading(false);
        return;
      }

      console.log('=== LOADING PROFILE ===');
      console.log('User ID:', user.id);

      try {
        const { data, error } = await db.getCoachProfile(user.id);
        console.log('Load result - data:', data, 'error:', error);

        if (error) {
          console.error('Error loading profile:', error);
        } else {
          setProfile(data);
          console.log('Profile set to state:', data);
        }
      } catch (error) {
        console.error('Exception loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    const loadResources = async () => {
      if (!profile?.id) return;

      try {
        const { data, error } = await db.getUserResources(profile.id);

        if (error) {
          console.error('Error loading resources:', error);
        } else {
          const normalizedResources = (data || []).map(resource => ({
            ...resource,
            sports: resource.sports || [],
            downloads: resource.downloads || 0,
            rating: resource.rating || 0,
            price: resource.price || 0
          }));
          setResources(normalizedResources);
          console.log('Loaded resources:', normalizedResources);
        }
      } catch (error) {
        console.error('Exception loading resources:', error);
      }
    };

    loadResources();
  }, [profile]);
  
  // Fixed 15% commission for all sellers
  const commissionRate = 0.15;

  // Calculate earnings data
  const totalSales = resources.reduce((sum, r) => sum + (r.price * r.downloads), 0);
  const platformCommission = totalSales * commissionRate;
  const netEarnings = totalSales - platformCommission;

  const stats = {
    totalEarnings: netEarnings,
    monthlyEarnings: netEarnings * 0.3,
    totalSales: resources.reduce((sum, r) => sum + r.downloads, 0),
    totalResources: resources.length,
    avgRating: resources.length > 0 ? resources.reduce((sum, r) => sum + r.rating, 0) / resources.length : 0,
    pendingPayout: netEarnings * 0.15,
    commissionRate: 15,
    followers: Math.floor(Math.random() * 2000) + 500
  };

  const recentSales = [
    { id: 1, resource: 'Advanced Ball Handling Drills', price: 12.99, date: '2024-01-15', buyer: 'Coach Mike', commission: 6.50, earnings: 6.49 },
    { id: 2, resource: 'Team Defense Strategies', price: 19.99, date: '2024-01-14', buyer: 'Sarah J.', commission: 10.00, earnings: 9.99 },
    { id: 3, resource: 'Youth Basketball Fundamentals', price: 8.99, date: '2024-01-14', buyer: 'Coach Tom', commission: 4.50, earnings: 4.49 },
    { id: 4, resource: 'Practice Planning Template', price: 5.99, date: '2024-01-13', buyer: 'Lisa M.', commission: 3.00, earnings: 2.99 },
  ];

  const monthlyData = [
    { month: 'Jan', sales: 450, earnings: 225, commission: 225 },
    { month: 'Feb', sales: 680, earnings: 340, commission: 340 },
    { month: 'Mar', sales: 520, earnings: 260, commission: 260 },
    { month: 'Apr', sales: 750, earnings: 375, commission: 375 },
    { month: 'May', sales: 890, earnings: 445, commission: 445 },
    { month: 'Jun', sales: 1200, earnings: 600, commission: 600 },
  ];

  const [profileData, setProfileData] = useState({
    name: 'Coach Profile',
    title: 'Create your profile to get started',
    location: '',
    yearsExperience: '',
    bio: 'No profile created yet. Click "Create Profile" to get started.',
    specialties: [],
    achievements: [],
    stats: {
      totalSales: 0,
      rating: 0,
      resources: 0,
      followers: 0
    }
  });

  useEffect(() => {
    if (profile) {
      // Handle both snake_case (Supabase) and camelCase (localStorage)
      const firstName = profile.first_name || profile.firstName;
      const lastName = profile.last_name || profile.lastName;
      const yearsExp = profile.years_experience || profile.yearsExperience;

      setProfileData({
        name: `${firstName} ${lastName}`,
        title: profile.title || '',
        location: profile.location || '',
        yearsExperience: yearsExp || '',
        bio: profile.bio || '',
        specialties: profile.specialties || [],
        achievements: profile.achievements || [],
        stats: {
          totalSales: stats.totalSales,
          rating: stats.avgRating,
          resources: stats.totalResources,
          followers: stats.followers
        }
      });
    }
  }, [profile]);

  const handleSyncToDatabase = async () => {
    if (!user || !profile) {
      console.log('No user or profile', { user, profile });
      alert('No user or profile data available');
      return;
    }

    console.log('=== SYNCING PROFILE ===');
    console.log('User:', user);
    console.log('Current profile:', profile);

    try {
      const payload = {
        user_id: user.id,
        first_name: profile.firstName,
        last_name: profile.lastName,
        title: profile.title,
        bio: profile.bio,
        location: profile.location,
        years_experience: '20+',
        sports: profile.sports || [],
        levels: profile.levels || [],
        specialties: profile.specialties || [],
        achievements: profile.achievements || [],
        website: profile.website || '',
        social_links: profile.socialLinks || {}
      };

      console.log('Payload to send:', payload);

      const { data, error } = await db.createCoachProfile(payload);

      console.log('Response:', { data, error });

      if (error) {
        console.error('Error syncing profile:', error);
        alert(`Failed to sync: ${error}`);
      } else {
        alert('Profile synced to database with 20+ years experience!');
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Exception syncing profile:', error);
      alert(`Failed to sync profile: ${error.message}`);
    }
  };

  const handleSave = async () => {
    if (!user) {
      alert('You must be logged in to save changes');
      return;
    }

    if (!profile) {
      alert('No profile found.');
      return;
    }

    try {
      const updates = {
        first_name: profileData.name.split(' ')[0] || profileData.name,
        last_name: profileData.name.split(' ').slice(1).join(' ') || '',
        title: profileData.title,
        bio: profileData.bio,
        location: profileData.location,
        years_experience: profileData.yearsExperience,
        sports: profile.sports || [],
        levels: profile.levels || [],
        specialties: profileData.specialties.filter(s => s.trim() !== ''),
        achievements: profileData.achievements.filter(a => a.trim() !== ''),
        website: profile.website || '',
        social_links: profile.socialLinks || {}
      };

      // First check if profile exists in database
      const checkResult = await db.getCoachProfile(user.id);

      let result;
      if (!checkResult.data) {
        // Profile doesn't exist in DB - create it
        result = await db.createCoachProfile({
          user_id: user.id,
          ...updates
        });
      } else {
        // Profile exists - update it
        result = await db.updateCoachProfile(user.id, updates);
      }

      if (result.error) {
        alert(`Failed to save: ${result.error}`);
        return;
      }

      // Reload the profile from database
      const profileResult = await db.getCoachProfile(user.id);
      if (profileResult.data) {
        setProfile(profileResult.data);
      }

      setIsEditing(false);
      alert('Profile saved successfully!');
    } catch (error: any) {
      alert(`Error: ${error.message || 'Unknown error occurred'}`);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Complete Your Coach Profile</h2>
          <p className="text-gray-600 mb-6">Add more details to your coaching profile to start uploading resources and earning money.</p>
          <Link
            to="/complete-profile"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Complete Your Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Coach Profile & Dashboard</h1>
              <p className="text-gray-600">Manage your profile and track your coaching business</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/upload"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center transition-colors no-underline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Resource
              </Link>
              <Link 
                to="/resources"
                className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold transition-colors no-underline"
              >
                <FileText className="w-4 h-4 mr-2 inline" />
                Manage Resources
              </Link>
              {activeTab === 'earnings' && (
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-r from-blue-900 to-red-600"></div>
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 mb-4">
              <div className="relative">
                <div className="w-32 h-32 bg-gray-300 rounded-full border-4 border-white flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-600" />
                </div>
                {isOwner && (
                  <button className="absolute bottom-2 right-2 w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center text-white hover:bg-blue-800">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex-1 sm:ml-6 mt-4 sm:mt-0">
                <div className="flex items-start justify-between">
                  <div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          className="text-2xl font-bold border-b-2 border-blue-900 bg-transparent focus:outline-none"
                        />
                        <input
                          type="text"
                          value={profileData.title}
                          onChange={(e) => setProfileData({...profileData, title: e.target.value})}
                          className="text-lg text-gray-600 border-b border-gray-300 bg-transparent focus:outline-none w-full"
                        />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold text-slate-900">{profileData.name}</h1>
                        <p className="text-lg text-gray-600">{profileData.title}</p>
                      </>
                    )}

                    {isEditing ? (
                      <div className="flex flex-col sm:flex-row gap-4 mt-3">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          <input
                            type="text"
                            value={profileData.location}
                            onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                            placeholder="Location"
                            className="border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-900 px-2 py-1"
                          />
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                          <select
                            value={profileData.yearsExperience}
                            onChange={(e) => setProfileData({...profileData, yearsExperience: e.target.value})}
                            className="border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-900 px-2 py-1"
                          >
                            <option value="0-2">0-2 years</option>
                            <option value="3-5">3-5 years</option>
                            <option value="5-10">5-10 years</option>
                            <option value="10-15">10-15 years</option>
                            <option value="15-20">15-20 years</option>
                            <option value="20+">20+ years</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center mt-2 text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{profileData.location}</span>
                        <span className="mx-2">•</span>
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{profileData.yearsExperience} years experience</span>
                      </div>
                    )}
                  </div>
                  
                  {isOwner && (
                    <div className="flex space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 flex items-center"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSyncToDatabase}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Fix & Sync Profile
                          </button>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit Profile
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{profileData.stats.totalSales}</div>
                <div className="text-sm text-gray-600">Total Sales</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900">{profileData.stats.rating.toFixed(1)}</span>
                  <Star className="w-5 h-5 text-yellow-400 ml-1" />
                </div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{profileData.stats.resources}</div>
                <div className="text-sm text-gray-600">Resources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{profileData.stats.followers}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Overview Cards (for owners) */}
        {isOwner && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-slate-900">${stats.totalEarnings.toFixed(2)}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+12.5%</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-slate-900">${stats.monthlyEarnings.toFixed(2)}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+8.2%</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Payout</p>
                  <p className="text-2xl font-bold text-slate-900">${stats.pendingPayout.toFixed(2)}</p>
                  <div className="flex items-center mt-1">
                    <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-yellow-600">Next: Jan 31</span>
                  </div>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Commission Rate</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.commissionRate}%</p>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-600">
                      You keep 85%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <PieChart className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                ...(isOwner ? [
                  { id: 'earnings', label: 'Earnings', icon: DollarSign },
                  { id: 'resources', label: 'My Resources', icon: FileText },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                  { id: 'payouts', label: 'Payouts', icon: CreditCard }
                ] : [])
              ].map((tab) => {
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

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* About */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">About</h2>
                    {isEditing ? (
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      />
                    ) : (
                      <p className="text-gray-700 leading-relaxed">{profileData.bio}</p>
                    )}
                  </div>

                  {/* Recent Resources */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Resources</h2>
                    {resources.length > 0 ? (
                      <div className="space-y-4">
                        {resources.slice(0, 3).map((resource) => (
                          <div key={resource.id} className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mr-4">
                              <Award className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900">{resource.title}</h3>
                              <p className="text-sm text-gray-600">
                                {resource.sports.length > 0 ? resource.sports.join(', ') : 'General'} • ${resource.price.toFixed(2)} • {resource.downloads} downloads
                              </p>
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              <span className="text-sm text-gray-600">{resource.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No resources uploaded yet.</p>
                        {isOwner && (
                          <Link 
                            to="/upload"
                            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors inline-block no-underline"
                          >
                            Upload Your First Resource
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Specialties */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Specialties</h3>
                    {isEditing ? (
                      <div className="space-y-2">
                        {profileData.specialties.map((specialty, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={specialty}
                              onChange={(e) => {
                                const newSpecialties = [...profileData.specialties];
                                newSpecialties[index] = e.target.value;
                                setProfileData({...profileData, specialties: newSpecialties});
                              }}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                            />
                            <button
                              onClick={() => {
                                const newSpecialties = profileData.specialties.filter((_, i) => i !== index);
                                setProfileData({...profileData, specialties: newSpecialties});
                              }}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setProfileData({...profileData, specialties: [...profileData.specialties, '']})}
                          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          + Add Specialty
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {profileData.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Achievements */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Achievements</h3>
                    {isEditing ? (
                      <div className="space-y-2">
                        {profileData.achievements.map((achievement, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={achievement}
                              onChange={(e) => {
                                const newAchievements = [...profileData.achievements];
                                newAchievements[index] = e.target.value;
                                setProfileData({...profileData, achievements: newAchievements});
                              }}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                            />
                            <button
                              onClick={() => {
                                const newAchievements = profileData.achievements.filter((_, i) => i !== index);
                                setProfileData({...profileData, achievements: newAchievements});
                              }}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setProfileData({...profileData, achievements: [...profileData.achievements, '']})}
                          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          + Add Achievement
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {profileData.achievements.map((achievement, index) => (
                          <div key={index} className="flex items-start">
                            <Award className="w-5 h-5 text-blue-900 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{achievement}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Connect (for non-owners) */}
                  {!isOwner && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Connect</h3>
                      <div className="space-y-3">
                        <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                          Follow Coach
                        </button>
                        <button className="w-full border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold transition-colors">
                          Send Message
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && isOwner && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Sales */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Sales</h3>
                    <div className="space-y-3">
                      {recentSales.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{sale.resource}</p>
                            <p className="text-sm text-gray-600">Sold to {sale.buyer} • {sale.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-600">${sale.earnings}</p>
                            <p className="text-xs text-gray-500">Commission: ${sale.commission}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Commission Breakdown */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Commission Breakdown</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Sales</span>
                          <span className="font-semibold">${totalSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Platform Commission ({stats.commissionRate}%)</span>
                          <span className="font-semibold text-red-600">-${platformCommission.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-900">Your Earnings</span>
                            <span className="font-bold text-emerald-600 text-lg">${netEarnings.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Performance</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-end space-x-2 h-40">
                      {monthlyData.map((data, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full bg-emerald-200 rounded-t relative" style={{ height: `${(data.earnings / 600) * 100}%` }}>
                            <div className="absolute inset-0 bg-emerald-600 rounded-t" style={{ height: '60%' }}></div>
                          </div>
                          <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center mt-4 space-x-6">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-emerald-600 rounded mr-2"></div>
                        <span className="text-sm text-gray-600">Your Earnings</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-emerald-200 rounded mr-2"></div>
                        <span className="text-sm text-gray-600">Platform Commission</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && isOwner && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">My Resources</h3>
                  <Link 
                    to="/upload"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Resource
                  </Link>
                </div>

                {resources.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Resource</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Sales</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Rating</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Earnings</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resources.map((resource) => {
                          const resourceEarnings = (resource.price * resource.downloads) * (1 - commissionRate);
                          return (
                            <tr key={resource.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div className="font-medium text-slate-900">{resource.title}</div>
                                <div className="text-sm text-gray-600">
                                  {resource.sports.length > 0 ? resource.sports.join(', ') : 'General'}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-slate-900">${resource.price.toFixed(2)}</td>
                              <td className="py-4 px-4 text-slate-900">{resource.downloads}</td>
                              <td className="py-4 px-4">
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                  <span className="text-slate-900">{resource.rating.toFixed(1)}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  resource.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : resource.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {resource.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-emerald-600 font-semibold">
                                ${resourceEarnings.toFixed(2)}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex space-x-2">
                                  <button className="p-1 text-gray-600 hover:text-emerald-600">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="p-1 text-gray-600 hover:text-blue-600">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Resources Yet</h3>
                    <p className="text-gray-600 mb-6">Upload your first coaching resource to start earning!</p>
                    <Link 
                      to="/upload"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Upload Your First Resource
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && isOwner && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Advanced Analytics</h3>
                  <p className="text-gray-600 mb-6">
                    Get detailed insights into your coaching business performance, audience demographics, and growth opportunities.
                  </p>
                  <a 
                    href="/analytics"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    View Full Analytics Dashboard
                  </a>
                </div>
                
                {/* Quick Analytics Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-emerald-50 rounded-lg p-6 text-center">
                    <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-slate-900">Performance Trends</h4>
                    <p className="text-sm text-gray-600">Track revenue, downloads, and views over time</p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-6 text-center">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-slate-900">Audience Insights</h4>
                    <p className="text-sm text-gray-600">Understand your coaching community demographics</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-6 text-center">
                    <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-slate-900">Growth Recommendations</h4>
                    <p className="text-sm text-gray-600">Get personalized tips to boost your success</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payouts Tab */}
            {activeTab === 'payouts' && isOwner && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-semibold text-blue-800">Payout Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-2">Payout Schedule</h4>
                      <p className="text-blue-700 text-sm">Payouts are processed monthly on the last day of each month for earnings from the previous month.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-2">Next Payout</h4>
                      <p className="text-blue-700 text-sm">January 31, 2024 - ${stats.pendingPayout.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Payout History</h3>
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="p-6 text-center">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">No Payouts Yet</h4>
                      <p className="text-gray-600">Your first payout will appear here after you make your first sale and the payout period ends.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h4 className="font-semibold text-yellow-800 mb-2">💡 Maximize Your Earnings</h4>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>• Upload high-quality, unique coaching resources</li>
                    <li>• Engage with the coaching community</li>
                    <li>• Keep your profile updated and professional</li>
                    <li>• Promote your resources on social media</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;