import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  icon: React.ComponentType<any>;
  color: string;
}

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    
    try {
      // Mock analytics data for demo
      const mockMetrics: MetricCard[] = [
        {
          title: 'Total Revenue',
          value: '$12,847',
          change: 23.5,
          icon: DollarSign,
          color: 'text-green-600'
        },
        {
          title: 'Active Users',
          value: '1,247',
          change: 12.3,
          icon: Users,
          color: 'text-blue-600'
        },
        {
          title: 'Conversion Rate',
          value: '3.2%',
          change: -2.1,
          icon: Target,
          color: 'text-purple-600'
        },
        {
          title: 'Avg. Session Duration',
          value: '4m 32s',
          change: 8.7,
          icon: Clock,
          color: 'text-orange-600'
        }
      ];

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (change: number) => {
    return change > 0 ? (
      <ArrowUpRight className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowDownRight className="w-4 h-4 text-red-500" />
    );
  };

  const getTrendColor = (change: number) => {
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  // Check if user is admin
  const isAdmin = user?.email === 'admin@coach2coachnetwork.com' || user?.email === 'zach@coach2coachnetwork.com';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <BarChart3 className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the analytics dashboard.</p>
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
              <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Platform performance and optimization insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button 
                onClick={loadAnalytics}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-semibold transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metric.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                    <div className="flex items-center mt-1">
                      {getTrendIcon(metric.change)}
                      <span className={`text-sm ml-1 ${getTrendColor(metric.change)}`}>
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-100">
                    <IconComponent className={`w-6 h-6 ${metric.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Conversion Funnel</h3>
          <div className="space-y-4">
            {[
              { step: 'Visits', count: 12450, rate: 100 },
              { step: 'Previews', count: 3890, rate: 31.2 },
              { step: 'Checkouts', count: 456, rate: 11.7 },
              { step: 'Subscriptions', count: 234, rate: 51.3 },
              { step: 'Purchases', count: 89, rate: 38.0 }
            ].map((step, index) => (
              <div key={step.step}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-900">{step.step}</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">{step.count.toLocaleString()}</span>
                    <span className="text-sm text-gray-600 ml-2">({step.rate}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${step.rate}%` }}
                  ></div>
                </div>
                {index < 4 && (
                  <div className="flex justify-center my-2">
                    <ArrowDownRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top Resources */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Top Performing Resources</h3>
          <div className="space-y-4">
            {[
              { title: 'Advanced Ball Handling Drills', revenue: 2847, conversions: 89, views: 1456 },
              { title: 'Team Defense Strategies', revenue: 1923, conversions: 67, views: 1234 },
              { title: 'Youth Soccer Fundamentals', revenue: 1456, conversions: 52, views: 987 }
            ].map((resource, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-emerald-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{resource.title}</p>
                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                      <span>{resource.conversions} conversions</span>
                      <span>•</span>
                      <span>{resource.views} views</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-600">${resource.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">
                    {((resource.conversions / resource.views) * 100).toFixed(1)}% CVR
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;