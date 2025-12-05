import React, { useState } from 'react';
import { Eye, Download, Lock, Star, User, Calendar, Tag, AlertTriangle, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMembership } from '../hooks/useMembership';
import { canDownloadFull, isInTrial } from '../lib/membership';
import { profileStorage } from '../lib/localStorage';
import PreviewViewer from './PreviewViewer';
import CheckoutButton from './CheckoutButton';
import ReviewSystem from './ReviewSystem';
import RecommendationsCarousel from './RecommendationsCarousel';

interface ResourcePreviewProps {
  resourceId: string;
}

const ResourcePreview: React.FC<ResourcePreviewProps> = ({ resourceId }) => {
  const { user } = useAuth();
  const { membership } = useMembership();
  const [showReviews, setShowReviews] = useState(false);

  // Mock resource data - in real app, this would come from API
  const resource = {
    id: resourceId,
    coachId: 'coach1',
    title: 'Advanced Ball Handling Drills for Guards',
    description: 'Comprehensive collection of 25 progressive ball handling drills designed specifically for point guards and shooting guards. Includes detailed diagrams, coaching points, and progression sequences.',
    price: 12.99,
    sports: ['Basketball'],
    levels: ['High School', 'Collegiate'],
    category: 'Drill Collections',
    rating: 4.8,
    downloads: 156,
    status: 'active',
    createdAt: '2024-01-10T10:00:00Z',
    tags: ['Ball Handling', 'Guards', 'Fundamentals', 'Progressive Training'],
    whatYouGet: [
      '25 detailed drill diagrams with step-by-step instructions',
      'Video demonstrations for each drill',
      'Progressive difficulty levels from beginner to advanced',
      'Coaching points and common mistakes to avoid',
      'Practice plan templates incorporating the drills'
    ],
    requirements: 'Basic basketball knowledge, access to a gym with basketballs',
    targetAudience: 'Perfect for high school and college coaches looking to improve their guards\' ball handling skills'
  };

  const profile = profileStorage.getProfileById(resource.coachId);
  const canDownload = membership ? canDownloadFull(membership) : false;
  const inTrial = membership ? isInTrial(membership) : false;

  const handlePurchaseClick = () => {
    if (!user) {
      alert('Please sign in to purchase resources');
      return;
    }
    
    if (inTrial) {
      alert('Upgrade to an active membership to purchase resources');
      return;
    }
    
    // This would trigger the purchase flow
    console.log('Purchase clicked for:', resource.title);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Resource Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{resource.title}</h1>
                  <p className="text-gray-600 mb-4">{resource.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span>{resource.rating} ({resource.downloads} downloads)</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {resource.sports.map((sport, index) => (
                      <span key={index} className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full">
                        {sport}
                      </span>
                    ))}
                    {resource.levels.map((level, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {level}
                      </span>
                    ))}
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      {resource.category}
                    </span>
                  </div>
                </div>
                
                <div className="text-right ml-6">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">${resource.price}</div>
                  {!canDownload && (
                    <div className="text-sm text-gray-500">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Active membership required
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <PreviewViewer
              resourceId={resourceId}
              title={resource.title}
              price={resource.price}
              onPurchaseClick={handlePurchaseClick}
            />

            {/* What You Get */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">What You Get</h3>
              <ul className="space-y-2">
                {resource.whatYouGet.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-emerald-600 text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements & Target Audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Requirements</h3>
                <p className="text-gray-700">{resource.requirements}</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Target Audience</h3>
                <p className="text-gray-700">{resource.targetAudience}</p>
              </div>
            </div>

            {/* Reviews Section */}
            <div>
              <button
                onClick={() => setShowReviews(!showReviews)}
                className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Reviews & Ratings</h3>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 mr-1" />
                    <span className="font-semibold">{resource.rating}</span>
                    <span className="text-gray-500 ml-1">({resource.downloads} reviews)</span>
                  </div>
                </div>
              </button>
              
              {showReviews && (
                <div className="mt-4">
                  <ReviewSystem
                    resourceId={resourceId}
                    averageRating={resource.rating}
                    totalReviews={resource.downloads}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <RecommendationsCarousel
            resourceId={resourceId}
            onResourceClick={(id) => window.location.href = `/resource/${id}`}
          />

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-slate-900 mb-2">${resource.price}</div>
                <p className="text-gray-600">One-time purchase</p>
              </div>

              {/* Trial User Notice */}
              {inTrial && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-blue-800 text-sm font-medium">Trial Mode</p>
                      <p className="text-blue-700 text-xs">Upgrade to purchase and download resources</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <CheckoutButton
                  resource={resource}
                  className="w-full"
                />
                
                <button className="w-full border border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-semibold transition-colors">
                  Add to Wishlist
                </button>
              </div>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <Download className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-700">Instant download</span>
                  </div>
                  <div className="flex items-center">
                    <Crown className="w-4 h-4 text-emerald-500 mr-2" />
                    <span className="text-gray-700">Lifetime access</span>
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-gray-700">Coach support</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coach Info */}
            {profile && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">About the Coach</h3>
                
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      {profile.firstName} {profile.lastName}
                    </h4>
                    <p className="text-sm text-emerald-600">{profile.title}</p>
                    <p className="text-xs text-gray-500">{profile.location}</p>
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-4 line-clamp-3">{profile.bio}</p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {profile.specialties.slice(0, 3).map((specialty, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {specialty}
                    </span>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                    View Profile
                  </button>
                  <button className="flex-1 border border-gray-300 hover:bg-gray-50 py-2 rounded-lg text-sm font-semibold transition-colors">
                    Message Coach
                  </button>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcePreview;