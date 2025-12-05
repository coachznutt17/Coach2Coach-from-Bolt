// Recommendations carousel for resource pages
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, TrendingUp, Users, Award } from 'lucide-react';
import { RecommendationResult } from '../lib/search/types';

interface RecommendationsCarouselProps {
  resourceId: string;
  title?: string;
  limit?: number;
  onResourceClick?: (resourceId: string) => void;
  className?: string;
}

const RecommendationsCarousel: React.FC<RecommendationsCarouselProps> = ({
  resourceId,
  title = "Coaches who bought this also bought",
  limit = 12,
  onResourceClick,
  className = ""
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecommendations();
  }, [resourceId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(getApiUrl(`/api/search/recommendations/${resourceId}?limit=${limit}`);
      const data = await response.json();

      if (data.success) {
        setRecommendations(data.recommendations || []);
      } else {
        throw new Error(data.error || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getReasonIcon = (reason: RecommendationResult['reason']) => {
    switch (reason) {
      case 'co_purchase':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'same_coach':
        return <Award className="w-4 h-4 text-blue-600" />;
      case 'same_sport':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <Star className="w-4 h-4 text-gray-600" />;
    }
  };

  const getReasonText = (reason: RecommendationResult['reason']) => {
    switch (reason) {
      case 'co_purchase':
        return 'Also bought';
      case 'same_coach':
        return 'Same coach';
      case 'same_sport':
        return 'Similar sport';
      case 'similar_content':
        return 'Similar content';
      default:
        return 'Recommended';
    }
  };

  const itemsPerView = 4;
  const maxIndex = Math.max(0, recommendations.length - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <h3 className="text-xl font-bold text-slate-900 mb-6">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-48 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Don't show empty recommendations
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        
        {recommendations.length > itemsPerView && (
          <div className="flex items-center space-x-2">
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
        >
          {recommendations.map((recommendation) => (
            <div 
              key={recommendation.id}
              className="flex-shrink-0 w-1/4 px-2"
            >
              <div 
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => onResourceClick?.(recommendation.id)}
              >
                <div className="aspect-square bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                  <Tag className="w-8 h-8 text-emerald-600" />
                </div>
                
                <h4 className="font-semibold text-slate-900 text-sm mb-2 line-clamp-2">
                  {recommendation.title}
                </h4>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-emerald-600">
                    ${(recommendation.price_cents / 100).toFixed(2)}
                  </span>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 mr-1" />
                    <span className="text-xs text-gray-600">{recommendation.rating.toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                      {recommendation.sport}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    {getReasonIcon(recommendation.reason)}
                    <span className="ml-1">{getReasonText(recommendation.reason)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      {recommendations.length > itemsPerView && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationsCarousel;