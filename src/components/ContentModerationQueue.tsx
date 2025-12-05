import React, { useState } from 'react';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  Calendar,
  FileText,
  Download,
  Flag,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { resourceStorage, profileStorage } from '../lib/localStorage';

interface ModerationItem {
  id: string;
  resourceId: string;
  title: string;
  description: string;
  coachName: string;
  coachId: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  price: number;
  category: string;
  sports: string[];
  levels: string[];
  flagReason?: string;
  reviewNotes?: string;
}

const ContentModerationQueue: React.FC = () => {
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'flagged'>('pending');
  const [reviewNotes, setReviewNotes] = useState('');

  // Get pending resources for moderation
  const allResources = resourceStorage.getResources();
  const pendingResources = allResources.filter(r => r.status === 'pending');

  // Mock moderation items
  const moderationItems: ModerationItem[] = pendingResources.map(resource => {
    const profile = profileStorage.getProfileById(resource.coachId);
    return {
      id: `mod_${resource.id}`,
      resourceId: resource.id,
      title: resource.title,
      description: resource.description,
      coachName: profile ? `${profile.firstName} ${profile.lastName}` : 'Unknown Coach',
      coachId: resource.coachId,
      uploadDate: resource.createdAt,
      status: 'pending',
      price: resource.price,
      category: resource.category,
      sports: resource.sports,
      levels: resource.levels
    };
  });

  // Check if user is admin
  const isAdmin = user?.email === 'admin@coach2coachnetwork.com' || user?.email === 'zach@coach2coachnetwork.com';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the moderation queue.</p>
        </div>
      </div>
    );
  }

  const handleApprove = (itemId: string) => {
    const item = moderationItems.find(i => i.id === itemId);
    if (item) {
      const resource = allResources.find(r => r.id === item.resourceId);
      if (resource) {
        const updatedResource = { ...resource, status: 'active' as const };
        resourceStorage.saveResource(updatedResource);
        alert(`✅ Resource "${item.title}" has been approved and is now live!`);
        window.location.reload();
      }
    }
  };

  const handleReject = (itemId: string) => {
    const item = moderationItems.find(i => i.id === itemId);
    if (item) {
      const reason = prompt('Reason for rejection (will be sent to coach):');
      if (reason) {
        const resource = allResources.find(r => r.id === item.resourceId);
        if (resource) {
          const updatedResource = { ...resource, status: 'rejected' as const };
          resourceStorage.saveResource(updatedResource);
          alert(`❌ Resource "${item.title}" has been rejected. Coach will be notified.`);
          window.location.reload();
        }
      }
    }
  };

  const filteredItems = moderationItems.filter(item => {
    if (filter === 'pending') return item.status === 'pending';
    if (filter === 'flagged') return item.flagReason;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Content Moderation</h1>
              <p className="text-gray-600">Review and approve coaching resources</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Items</option>
                <option value="pending">Pending Review</option>
                <option value="flagged">Flagged Content</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-slate-900">
                  {moderationItems.filter(i => i.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Approved Today</p>
                <p className="text-2xl font-bold text-slate-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Rejected Today</p>
                <p className="text-2xl font-bold text-slate-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flag className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Flagged Items</p>
                <p className="text-2xl font-bold text-slate-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Moderation Queue */}
        <div className="bg-white rounded-xl shadow-sm">
          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Resource</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Coach</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Price</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Uploaded</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-start">
                          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mr-4">
                            <FileText className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{item.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.sports.slice(0, 2).map((sport, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {sport}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="text-slate-900">{item.coachName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-900">{item.category}</td>
                      <td className="py-4 px-6 text-slate-900">${item.price}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(item.uploadDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Review"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-4">All Caught Up!</h3>
              <p className="text-gray-600">No resources pending review at this time.</p>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Review Resource</h2>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Resource Details */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedItem.title}</h3>
                      <p className="text-gray-700">{selectedItem.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Category</label>
                        <p className="text-slate-900">{selectedItem.category}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Price</label>
                        <p className="text-slate-900">${selectedItem.price}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Sports & Levels</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedItem.sports.map((sport, index) => (
                          <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                            {sport}
                          </span>
                        ))}
                        {selectedItem.levels.map((level, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Coach</label>
                      <div className="flex items-center mt-1">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-slate-900">{selectedItem.coachName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Review Actions */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Review Notes</label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add notes about this review (optional)..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => handleApprove(selectedItem.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Approve Resource
                      </button>
                      
                      <button
                        onClick={() => handleReject(selectedItem.id)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Reject Resource
                      </button>
                      
                      <button className="w-full border border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Message Coach
                      </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-slate-900 mb-3">Quick Actions</h4>
                      <div className="space-y-2">
                        <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center">
                          <Download className="w-4 h-4 text-gray-600 mr-3" />
                          <span className="text-sm">Download for Review</span>
                        </button>
                        <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center">
                          <Flag className="w-4 h-4 text-gray-600 mr-3" />
                          <span className="text-sm">Flag for Further Review</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentModerationQueue;