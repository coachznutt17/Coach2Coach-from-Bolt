// SEO management interface for admins
import React, { useState, useEffect } from 'react';
import { Search, Globe, CreditCard as Edit, Save, X, Plus, ExternalLink, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SEOPage {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  robots: string;
  priority: number;
  changeFrequency: string;
  lastModified: string;
}

const SEOManager: React.FC = () => {
  const { user } = useAuth();
  const [pages, setPages] = useState<SEOPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPage, setEditingPage] = useState<SEOPage | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSEOPages();
  }, []);

  const loadSEOPages = async () => {
    setLoading(true);
    try {
      // Mock SEO pages for demo
      const mockPages: SEOPage[] = [
        {
          path: '/',
          title: 'Coach2Coach - Digital Marketplace for Coaching Resources',
          description: 'The premier digital marketplace where coaching expertise meets opportunity. Create, sell, and discover game-changing resources for every sport and level.',
          keywords: ['coaching', 'sports', 'training', 'drills', 'playbooks'],
          robots: 'index,follow',
          priority: 1.0,
          changeFrequency: 'weekly',
          lastModified: '2024-01-15T10:00:00Z'
        },
        {
          path: '/browse',
          title: 'Browse Coaching Resources - Coach2Coach',
          description: 'Discover thousands of coaching resources from expert coaches across all sports and levels. Find drills, playbooks, training programs and more.',
          keywords: ['coaching resources', 'sports drills', 'training materials'],
          robots: 'index,follow',
          priority: 0.9,
          changeFrequency: 'daily',
          lastModified: '2024-01-14T15:30:00Z'
        },
        {
          path: '/pricing',
          title: 'Pricing - Coach2Coach Membership',
          description: 'Simple, fair pricing for unlimited access to coaching resources. Join thousands of coaches improving their game.',
          keywords: ['coaching membership', 'sports training subscription'],
          robots: 'index,follow',
          priority: 0.8,
          changeFrequency: 'monthly',
          lastModified: '2024-01-10T09:00:00Z'
        }
      ];

      setPages(mockPages);
    } catch (error) {
      console.error('Error loading SEO pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePage = async (pageData: SEOPage) => {
    try {
      // In real implementation, call API to save
      console.log('Saving SEO page:', pageData);
      
      // Update local state
      setPages(prev => {
        const existing = prev.find(p => p.path === pageData.path);
        if (existing) {
          return prev.map(p => p.path === pageData.path ? pageData : p);
        } else {
          return [...prev, pageData];
        }
      });

      setEditingPage(null);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error saving SEO page:', error);
      alert('Failed to save SEO page');
    }
  };

  const filteredPages = pages.filter(page =>
    searchTerm === '' ||
    page.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if user is admin
  const isAdmin = user?.email === 'admin@coach2coachnetwork.com' || user?.email === 'zach@coach2coachnetwork.com';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <Globe className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access SEO management.</p>
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
              <h1 className="text-3xl font-bold text-slate-900">SEO Management</h1>
              <p className="text-gray-600">Manage page metadata, sitemaps, and search optimization</p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/api/seo/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Sitemap
              </a>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Page
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search pages..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Pages List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Page</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Title</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Priority</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Last Modified</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map((page) => (
                  <tr key={page.path} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-mono text-sm text-slate-900">{page.path}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-slate-900 truncate max-w-xs">{page.title}</p>
                        <p className="text-sm text-gray-600 truncate max-w-xs">{page.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        page.priority >= 0.8 ? 'bg-green-100 text-green-800' :
                        page.priority >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {page.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm text-green-600">Indexed</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(page.lastModified).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => setEditingPage(page)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Page Modal */}
        {(editingPage || showCreateForm) && (
          <SEOPageForm
            page={editingPage}
            onSave={savePage}
            onClose={() => {
              setEditingPage(null);
              setShowCreateForm(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

// SEO Page Form Component
const SEOPageForm: React.FC<{
  page?: SEOPage | null;
  onSave: (page: SEOPage) => void;
  onClose: () => void;
}> = ({ page, onSave, onClose }) => {
  const [formData, setFormData] = useState<SEOPage>(
    page || {
      path: '',
      title: '',
      description: '',
      keywords: [],
      robots: 'index,follow',
      priority: 0.5,
      changeFrequency: 'weekly',
      lastModified: new Date().toISOString()
    }
  );
  const [keywordInput, setKeywordInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {page ? 'Edit SEO Page' : 'Create SEO Page'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Page Path</label>
              <input
                type="text"
                value={formData.path}
                onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))}
                placeholder="/about"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Page Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="About Us - Coach2Coach"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 50-60 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Learn about Coach2Coach, the marketplace built for coaches..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 150-160 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="Add keyword"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="ml-2 text-emerald-600 hover:text-emerald-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={1.0}>1.0 (Highest)</option>
                  <option value={0.9}>0.9 (High)</option>
                  <option value={0.8}>0.8 (Medium-High)</option>
                  <option value={0.5}>0.5 (Medium)</option>
                  <option value={0.3}>0.3 (Low)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Change Frequency</label>
                <select
                  value={formData.changeFrequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, changeFrequency: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="always">Always</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Robots</label>
              <select
                value={formData.robots}
                onChange={(e) => setFormData(prev => ({ ...prev, robots: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="index,follow">Index, Follow</option>
                <option value="index,nofollow">Index, No Follow</option>
                <option value="noindex,follow">No Index, Follow</option>
                <option value="noindex,nofollow">No Index, No Follow</option>
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Page
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SEOManager;