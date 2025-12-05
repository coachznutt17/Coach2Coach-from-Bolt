import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  Search,
  Filter,
  Download,
  Mail,
  Calendar,
  BarChart3,
  Shield,
  Settings,
  Flag,
  Award,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { profileStorage, resourceStorage, userStorage } from '../lib/localStorage';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [adminStats, setAdminStats] = useState({
    pendingModeration: 3,
    openDisputes: 1,
    pendingVerification: 2,
    openReports: 0
  });

  // Get data from localStorage
  const allUsers = userStorage.getUsers();
  const allProfiles = profileStorage.getProfiles();
  const allResources = resourceStorage.getResources();

  // Calculate stats
  const stats = {
    totalUsers: allUsers.length,
    totalCoaches: allProfiles.length,
    totalResources: allResources.length,
    pendingResources: allResources.filter(r => r.status === 'pending').length,
    activeResources: allResources.filter(r => r.status === 'active').length,
    totalRevenue: allResources.reduce((sum, r) => sum + (r.price * r.downloads), 0),
    monthlyRevenue: allResources.reduce((sum, r) => sum + (r.price * r.downloads * 0.3), 0), // Mock monthly data
  };

  // Filter resources based on search and status
  const filteredResources = allResources.filter(resource => {
    const matchesSearch = searchTerm === '' || 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || resource.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleResourceAction = (resourceId: string, action: 'approve' | 'reject' | 'suspend') => {
    const resource = allResources.find(r => r.id === resourceId);
    if (resource) {
      const updatedResource = {
        ...resource,
        status: action === 'approve' ? 'active' : action === 'reject' ? 'rejected' : 'inactive'
      };
      resourceStorage.saveResource(updatedResource);
      // In a real app, this would trigger a re-render
      window.location.reload();
    }
  };

  // Check if user is admin (in a real app, this would be a proper role check)
  const isAdmin = user?.email === 'admin@coach2coachnetwork.com' || user?.email === 'zach@coach2coachnetwork.com';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-gray-600">Platform Management & Analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
              <button className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Coaches</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalCoaches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Resources</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalResources}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">${stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Actions Alert */}
        {stats.pendingResources > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-800">Action Required</h3>
                <p className="text-sm text-yellow-700">
                  {stats.pendingResources} resource{stats.pendingResources !== 1 ? 's' : ''} pending review
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('resources')}
                className="ml-auto bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Review Now
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'moderation', label: 'Moderation', icon: Shield, badge: adminStats.pendingModeration },
                { id: 'disputes', label: 'Disputes', icon: AlertTriangle, badge: adminStats.openDisputes },
                { id: 'verification', label: 'Verification', icon: Award, badge: adminStats.pendingVerification },
                { id: 'reports', label: 'Reports', icon: Flag, badge: adminStats.openReports },
                { id: 'revenue', label: 'Revenue', icon: DollarSign },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm relative ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {tab.label}
                    {tab.badge && tab.badge > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                    {tab.badge && tab.badge > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">New user registered</p>
                          <p className="text-xs text-gray-600">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                          <FileText className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Resource uploaded for review</p>
                          <p className="text-xs text-gray-600">4 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">New purchase completed</p>
                          <p className="text-xs text-gray-600">6 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Platform Health</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium text-green-800">Active Resources</span>
                        <span className="text-lg font-bold text-green-900">{stats.activeResources}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <span className="text-sm font-medium text-yellow-800">Pending Review</span>
                        <span className="text-lg font-bold text-yellow-900">{stats.pendingResources}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-800">Monthly Revenue</span>
                        <span className="text-lg font-bold text-blue-900">${stats.monthlyRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">User Management</h3>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user) => {
                        const profile = allProfiles.find(p => p.userId === user.id);
                        return (
                          <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-xs font-semibold text-gray-600">
                                    {user.firstName[0]}{user.lastName[0]}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-slate-900">{user.firstName} {user.lastName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-slate-900">{user.email}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                profile ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {profile ? 'Coach' : 'User'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-900">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex space-x-2">
                                <button className="p-1 text-gray-600 hover:text-blue-600">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="p-1 text-gray-600 hover:text-red-600">
                                  <Ban className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Moderation Tab */}
            {activeTab === 'moderation' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Content Moderation</h3>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search pending resources..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="high_risk">High Risk</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Resource</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Coach</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Risk Score</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Flags</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Uploaded</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResources.map((resource) => {
                        const profile = allProfiles.find(p => p.id === resource.coachId);
                        const riskScore = Math.floor(Math.random() * 100); // Mock risk score
                        const flags = riskScore > 50 ? ['copyright_phrases'] : [];
                        return (
                          <tr key={resource.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-medium text-slate-900">{resource.title}</div>
                                <div className="text-sm text-gray-600">{resource.sports.join(', ')}</div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-slate-900">
                              {profile ? `${profile.firstName} ${profile.lastName}` : 'Unknown'}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                riskScore >= 75 ? 'bg-red-100 text-red-800' :
                                riskScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                riskScore >= 25 ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {riskScore}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {flags.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {flags.map((flag, index) => (
                                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                      {flag.replace('_', ' ')}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">None</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-slate-900">${resource.price}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                resource.status === 'approved' ? 'bg-green-100 text-green-800' :
                                resource.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                resource.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {resource.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-900">
                              {new Date(resource.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex space-x-2">
                                <button className="p-1 text-gray-600 hover:text-blue-600">
                                  <Eye className="w-4 h-4" />
                                </button>
                                {resource.status === 'pending' && (
                                  <>
                                    <button 
                                      onClick={() => handleResourceAction(resource.id, 'approve')}
                                      className="p-1 text-gray-600 hover:text-green-600"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleResourceAction(resource.id, 'reject')}
                                      className="p-1 text-gray-600 hover:text-red-600"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {resource.status === 'approved' && (
                                  <button 
                                    onClick={() => handleResourceAction(resource.id, 'suspend')}
                                    className="p-1 text-gray-600 hover:text-red-600"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Disputes Tab */}
            {activeTab === 'disputes' && (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Dispute Management</h3>
                <p className="text-gray-600">Handle refund requests and purchase disputes.</p>
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    💡 <strong>Coming Soon:</strong> Full dispute resolution workflow with Stripe refund integration
                  </p>
                </div>
              </div>
            )}

            {/* Verification Tab */}
            {activeTab === 'verification' && (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Coach Verification</h3>
                <p className="text-gray-600">Review and approve coach verification requests.</p>
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    🏆 <strong>Verification Benefits:</strong> Verified badge, search ranking boost, increased trust
                  </p>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="text-center py-12">
                <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">User Reports</h3>
                <p className="text-gray-600">Review user reports for inappropriate content.</p>
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    🚨 <strong>Report Types:</strong> Copyright, spam, low quality, malware, inappropriate content
                  </p>
                </div>
              </div>
            )}
            {/* Revenue Tab */}
            {activeTab === 'revenue' && (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Revenue Analytics</h3>
                <p className="text-gray-600">Detailed revenue reports and analytics coming soon.</p>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Platform Reports</h3>
                <p className="text-gray-600">Comprehensive platform reports and insights coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;