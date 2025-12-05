// Trending resources section for homepage
import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, Download, Eye, Calendar, Award } from 'lucide-react';
import { TrendingResult } from '../lib/search/types';
import { getApiUrl } from '../lib/apiConfig';

interface TrendingSectionProps {
  limit?: number;
  onResourceClick?: (resourceId: string) => void;
  className?: string;
}

const TrendingSection: React.FC<TrendingSectionProps> = ({
  limit = 12,
  onResourceClick,
  className = ""
}) => {
  const [trending, setTrending] = useState<TrendingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTrending();
  }, [limit]);

  const loadTrending = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(getApiUrl(`/api/search/trending?limit=${limit}`));
      const data = await response.json();

      if (data.success) {
        setTrending(data.trending || []);
      } else {
        throw new Error(data.error || 'Failed to load trending');
      }
    } catch (err) {
      console.error('Error loading trending:', err);
      setError('Failed to load trending resources');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center mb-6">
          <TrendingUp className="w-6 h-6 text-orange-500 mr-3" />
          <h3 className="text-xl font-bold text-slate-900">Trending Now</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || trending.length === 0) {
    return null; // Don't show empty trending section
  }

  return (
    <section className={`py-16 bg-white ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center mb-12">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
            <TrendingUp className="w-6 h-6 text-orange-500" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">Trending Resources</h2>
            <p className="text-gray-600">Most popular coaching resources right now</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trending.map((item, index) => (
            <div 
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              onClick={() => onResourceClick?.(item.id)}
            >
              <div className="p-6">
                {/* Trending Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    #{item.rank_position}
                  </div>
                  <span className="text-lg font-bold text-emerald-600">
                    ${(item.price_cents / 100).toFixed(2)}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                  {item.title}
                </h3>

                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Award className="w-4 h-4 text-emerald-500 mr-1" />
                    <span>{item.sport}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs font-semibold text-gray-600">
                        {item.coach_name?.split(' ').map(n => n[0]).join('') || 'C'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">{item.coach_name}</span>
                  </div>
                  
                  <div className="text-xs text-orange-600 font-medium">
                    Score: {item.trending_score.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <button 
            onClick={() => window.location.href = '/browse?sort=trending'}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            View All Trending Resources
          </button>
        </div>
      </div>
    </section>
  );
};

export default TrendingSection;