// Performance monitoring dashboard
import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Wifi, 
  Monitor,
  Smartphone,
  RefreshCw,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface WebVital {
  metric: string;
  value: number;
  threshold: number;
  status: 'good' | 'needs-improvement' | 'poor';
  description: string;
  unit: string;
}

interface PerformanceData {
  webVitals: WebVital[];
  pageSpeed: {
    desktop: number;
    mobile: number;
  };
  errorRate: number;
  uptime: number;
  avgResponseTime: number;
}

const PerformanceMonitor: React.FC = () => {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      // Mock performance data for demo
      const mockData: PerformanceData = {
        webVitals: [
          {
            metric: 'LCP',
            value: 2.1,
            threshold: 2.5,
            status: 'good',
            description: 'Largest Contentful Paint',
            unit: 's'
          },
          {
            metric: 'FID',
            value: 45,
            threshold: 100,
            status: 'good',
            description: 'First Input Delay',
            unit: 'ms'
          },
          {
            metric: 'CLS',
            value: 0.08,
            threshold: 0.1,
            status: 'good',
            description: 'Cumulative Layout Shift',
            unit: ''
          },
          {
            metric: 'TTFB',
            value: 180,
            threshold: 600,
            status: 'good',
            description: 'Time to First Byte',
            unit: 'ms'
          }
        ],
        pageSpeed: {
          desktop: 95,
          mobile: 87
        },
        errorRate: 0.02,
        uptime: 99.9,
        avgResponseTime: 145
      };

      setPerformanceData(mockData);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVitalStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'needs-improvement':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'poor':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getVitalStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'needs-improvement':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'poor':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPageSpeedColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Check if user is admin
  const isAdmin = user?.email === 'admin@coach2coachnetwork.com' || user?.email === 'zach@coach2coachnetwork.com';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <Zap className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access performance monitoring.</p>
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
              <h1 className="text-3xl font-bold text-slate-900">Performance Monitor</h1>
              <p className="text-gray-600">Core Web Vitals, speed metrics, and error tracking</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <button
                onClick={loadPerformanceData}
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
        {performanceData && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Uptime</p>
                    <p className="text-2xl font-bold text-slate-900">{performanceData.uptime}%</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">Excellent</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Wifi className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Response Time</p>
                    <p className="text-2xl font-bold text-slate-900">{performanceData.avgResponseTime}ms</p>
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">Fast</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Error Rate</p>
                    <p className="text-2xl font-bold text-slate-900">{(performanceData.errorRate * 100).toFixed(2)}%</p>
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">Low</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Page Speed</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-slate-900">{performanceData.pageSpeed.desktop}</span>
                      <span className="text-sm text-gray-500">/</span>
                      <span className="text-lg font-bold text-slate-900">{performanceData.pageSpeed.mobile}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <Monitor className="w-3 h-3 text-gray-500 mr-1" />
                      <span className="text-xs text-gray-500">Desktop / Mobile</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Core Web Vitals */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Core Web Vitals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {performanceData.webVitals.map((vital, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${getVitalStatusColor(vital.status)}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {getVitalStatusIcon(vital.status)}
                        <span className="font-bold text-lg ml-2">{vital.metric}</span>
                      </div>
                      <span className="text-xs font-medium uppercase">{vital.status.replace('-', ' ')}</span>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-2xl font-bold">
                        {vital.value}{vital.unit}
                      </span>
                    </div>
                    
                    <div className="text-sm opacity-75 mb-3">
                      {vital.description}
                    </div>
                    
                    <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          vital.status === 'good' ? 'bg-green-600' :
                          vital.status === 'needs-improvement' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ 
                          width: `${Math.min((vital.value / vital.threshold) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    
                    <div className="text-xs mt-1 opacity-75">
                      Threshold: {vital.threshold}{vital.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Recommendations */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">🚀 Performance Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Excellent Performance</h4>
                    <p className="text-sm text-gray-600">All Core Web Vitals are in the "good" range</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Fast Loading</h4>
                    <p className="text-sm text-gray-600">Page speed scores are above 85 on both desktop and mobile</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <Monitor className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Optimized Images</h4>
                    <p className="text-sm text-gray-600">Continue using WebP format and lazy loading for images</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading performance data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;