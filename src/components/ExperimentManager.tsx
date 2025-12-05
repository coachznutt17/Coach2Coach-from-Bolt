// A/B testing experiment management interface
import React, { useState, useEffect } from 'react';
import { 
  Beaker, 
  Play, 
  Pause, 
  CheckCircle, 
  Plus, 
  BarChart3,
  Target,
  Users,
  TrendingUp,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Experiment {
  id: string;
  key: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  primaryMetric: string;
  variants: Array<{
    name: string;
    weight: number;
    config: any;
  }>;
  results?: Array<{
    variant: string;
    assignments: number;
    conversions: number;
    conversionRate: number;
  }>;
  startDate?: string;
  endDate?: string;
  significance?: number;
}

const ExperimentManager: React.FC = () => {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/experiments?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setExperiments(data.experiments);
      }
    } catch (error) {
      console.error('Error loading experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateExperimentStatus = async (experimentId: string, status: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/experiments/${experimentId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, status })
      });

      const data = await response.json();

      if (data.success) {
        loadExperiments();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating experiment:', error);
      alert('Failed to update experiment status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4 text-green-600" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Beaker className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateSignificance = (results: any[]) => {
    // Simple significance calculation (in production, use proper statistical tests)
    if (results.length < 2) return 0;
    
    const control = results.find(r => r.variant === 'control');
    const variants = results.filter(r => r.variant !== 'control');
    
    if (!control || variants.length === 0) return 0;
    
    const maxVariant = variants.reduce((max, variant) => 
      variant.conversionRate > max.conversionRate ? variant : max
    );
    
    const lift = ((maxVariant.conversionRate - control.conversionRate) / control.conversionRate) * 100;
    
    // Mock significance based on sample size and lift
    const totalSamples = control.assignments + maxVariant.assignments;
    if (totalSamples < 100) return 0.1;
    if (totalSamples < 500) return 0.7;
    if (lift > 10) return 0.95;
    if (lift > 5) return 0.85;
    return 0.6;
  };

  // Check if user is admin
  const isAdmin = user?.email === 'admin@coach2coachnetwork.com' || user?.email === 'zach@coach2coachnetwork.com';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <Beaker className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access experiment management.</p>
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
              <h1 className="text-3xl font-bold text-slate-900">A/B Testing</h1>
              <p className="text-gray-600">Manage experiments and optimize conversions</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Experiment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Experiments List */}
        <div className="space-y-6">
          {experiments.map((experiment) => {
            const significance = experiment.results ? calculateSignificance(experiment.results) : 0;
            
            return (
              <div key={experiment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-bold text-slate-900 mr-3">{experiment.name}</h3>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(experiment.status)}`}>
                        {getStatusIcon(experiment.status)}
                        <span className="ml-2 capitalize">{experiment.status}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{experiment.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        <span>Primary: {experiment.primaryMetric}</span>
                      </div>
                      {experiment.startDate && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Started: {new Date(experiment.startDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {experiment.status === 'draft' && (
                      <button
                        onClick={() => updateExperimentStatus(experiment.id, 'running')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </button>
                    )}
                    {experiment.status === 'running' && (
                      <>
                        <button
                          onClick={() => updateExperimentStatus(experiment.id, 'paused')}
                          className="border border-yellow-600 text-yellow-600 hover:bg-yellow-50 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </button>
                        <button
                          onClick={() => updateExperimentStatus(experiment.id, 'completed')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete
                        </button>
                      </>
                    )}
                    {experiment.status === 'paused' && (
                      <button
                        onClick={() => updateExperimentStatus(experiment.id, 'running')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </button>
                    )}
                  </div>
                </div>

                {/* Variants */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {experiment.variants.map((variant, index) => {
                    const result = experiment.results?.find(r => r.variant === variant.name);
                    
                    return (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">{variant.name}</h4>
                          <span className="text-sm text-gray-600">{variant.weight}%</span>
                        </div>
                        
                        {result && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Assignments:</span>
                              <span className="font-medium">{result.assignments}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Conversions:</span>
                              <span className="font-medium">{result.conversions}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Rate:</span>
                              <span className="font-bold text-emerald-600">{result.conversionRate}%</span>
                            </div>
                          </div>
                        )}
                        
                        {!result && experiment.status !== 'draft' && (
                          <p className="text-sm text-gray-500">No data yet</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Statistical Significance */}
                {experiment.status !== 'draft' && significance > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="font-medium text-blue-800">Statistical Significance</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`font-bold text-lg ${
                          significance >= 0.95 ? 'text-green-600' :
                          significance >= 0.8 ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {(significance * 100).toFixed(0)}%
                        </span>
                        {significance >= 0.95 && (
                          <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                        )}
                        {significance < 0.8 && (
                          <AlertTriangle className="w-5 h-5 text-yellow-600 ml-2" />
                        )}
                      </div>
                    </div>
                    {significance >= 0.95 && (
                      <p className="text-sm text-green-700 mt-2">
                        ✅ Results are statistically significant. Safe to declare a winner.
                      </p>
                    )}
                    {significance < 0.8 && (
                      <p className="text-sm text-yellow-700 mt-2">
                        ⚠️ Need more data for statistical significance. Continue running test.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {experiments.length === 0 && !loading && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Beaker className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Experiments Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first A/B test to optimize conversions and user experience.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Create Your First Experiment
              </button>
            </div>
          )}
        </div>

        {/* Create Experiment Modal */}
        {showCreateForm && (
          <CreateExperimentModal
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
              loadExperiments();
            }}
          />
        )}
      </div>
    </div>
  );
};

// Create Experiment Modal Component
const CreateExperimentModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    primaryMetric: 'conversion_rate',
    variants: [
      { name: 'control', weight: 50, config: {} },
      { name: 'variant_a', weight: 50, config: {} }
    ]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/experiments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...formData
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating experiment:', error);
      alert('Failed to create experiment');
    } finally {
      setLoading(false);
    }
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { name: `variant_${String.fromCharCode(97 + prev.variants.length - 1)}`, weight: 50, config: {} }
      ]
    }));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Create A/B Test</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experiment Key</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="pricing_test_v1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Metric</label>
                <select
                  value={formData.primaryMetric}
                  onChange={(e) => setFormData(prev => ({ ...prev, primaryMetric: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="conversion_rate">Conversion Rate</option>
                  <option value="subscription_rate">Subscription Rate</option>
                  <option value="purchase_rate">Purchase Rate</option>
                  <option value="engagement_rate">Engagement Rate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experiment Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Pricing Test - January 2024"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Test different pricing points to optimize conversion rate..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">Variants</label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Variant
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.variants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Variant Name</label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Traffic %</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={variant.weight}
                        onChange={(e) => updateVariant(index, 'weight', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
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
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Creating...' : 'Create Experiment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExperimentManager;