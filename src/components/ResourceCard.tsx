import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Download, Heart, Eye, User, Clock, Tag, Flag } from 'lucide-react';
import { profileStorage } from '../lib/localStorage';
import CheckoutButton from './CheckoutButton';
import DownloadManager from './DownloadManager';
import VerificationBadge from './VerificationBadge';
import ReportModal from './ReportModal';

interface ResourceCardProps {
  resource: {
    id: string;
    coachId: string;
    title: string;
    description: string;
    price: number;
    sports: string[];
    levels: string[];
    rating: number;
    downloads: number;
    status: string;
    createdAt: string;
  };
  showPurchaseButton?: boolean;
  viewMode?: 'grid' | 'list';
  showDownloads?: boolean;
  isPurchased?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  showPurchaseButton = true,
  viewMode = 'grid',
  showDownloads = false,
  isPurchased = false
}) => {
  const navigate = useNavigate();
  const profile = profileStorage.getProfileById(resource.coachId);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/resource/${resource.id}`);
  };
  
  // Calculate days since upload
  const daysSinceUpload = Math.floor(
    (new Date().getTime() - new Date(resource.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (viewMode === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start space-x-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Tag className="w-8 h-8 text-emerald-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold text-slate-900">{resource.title}</h3>
              <span className="text-2xl font-bold text-emerald-600 ml-4">${resource.price}</span>
            </div>
            
            <p className="text-gray-600 mb-3 line-clamp-2">{resource.description}</p>
            
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                <span className="text-sm text-gray-600">{resource.rating}</span>
              </div>
              <div className="flex items-center">
                <Download className="w-4 h-4 text-gray-400 mr-1" />
                <span className="text-sm text-gray-600">{resource.downloads}</span>
              </div>
              {daysSinceUpload <= 7 && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                  {daysSinceUpload === 0 ? 'New!' : `${daysSinceUpload}d ago`}
                </span>
              )}
              <VerificationBadge isVerified={true} size="sm" className="ml-2" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {resource.sports.slice(0, 3).map((sport, index) => (
                  <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                    {sport}
                  </span>
                ))}
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Report this resource"
                >
                  <Flag className="w-4 h-4 text-gray-600" />
                </button>
                {resource.sports.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{resource.sports.length - 3}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                    <User className="w-3 h-3 text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-600">
                    {profile ? `${profile.firstName} ${profile.lastName}` : 'Coach'}
                  </span>
                </div>
                
                {showPurchaseButton && (
                  <CheckoutButton
                    resource={resource}
                    className="px-4 py-2 text-sm"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Report Modal */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          resourceId={resource.id}
          resourceTitle={resource.title}
        />
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{resource.title}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">{resource.description}</p>
            
            {/* Upload date indicator */}
            {daysSinceUpload <= 7 && (
              <div className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full mb-2">
                <Clock className="w-3 h-3 mr-1" />
                {daysSinceUpload === 0 ? 'New today!' : `${daysSinceUpload} days ago`}
              </div>
            )}
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Heart className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <Star className="w-4 h-4 text-yellow-400 mr-1" />
            <span className="text-sm text-gray-600">{resource.rating}</span>
            <span className="text-gray-400 mx-2">•</span>
            <Download className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{resource.downloads}</span>
          </div>
          <span className="text-2xl font-bold text-emerald-600">${resource.price}</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {resource.sports.slice(0, 2).map((sport, index) => (
            <span key={index} className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
              <Tag className="w-3 h-3 mr-1" />
              {sport}
            </span>
          ))}
          {resource.levels.slice(0, 1).map((level, index) => (
            <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              <Tag className="w-3 h-3 mr-1" />
              {level}
            </span>
          ))}
          {resource.sports.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{resource.sports.length - 2} more
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900">
                {profile ? `${profile.firstName} ${profile.lastName}` : 'Coach'}
              </span>
              {profile && (
                <p className="text-xs text-gray-500">{profile.title}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Eye className="w-4 h-4 text-gray-600" />
            </button>
            
            {showPurchaseButton && (
              <CheckoutButton
                resource={resource}
                variant="primary"
                className="text-sm px-4 py-2"
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Downloads Section */}
      {showDownloads && (
        <div className="mt-4">
          <DownloadManager
            resource={resource}
            isPurchased={isPurchased}
            onPurchaseRequired={() => {
              // This would trigger the purchase flow
              console.log('Purchase required for:', resource.title);
            }}
          />
        </div>
      )}
      
      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        resourceId={resource.id}
        resourceTitle={resource.title}
      />
    </div>
  );
};

export default ResourceCard;