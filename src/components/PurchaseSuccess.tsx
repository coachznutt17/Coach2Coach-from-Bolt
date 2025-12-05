import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Download, ArrowRight, Star } from 'lucide-react';
import { resourceStorage, profileStorage } from '../lib/localStorage';

const PurchaseSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [resource, setResource] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
  const sessionId = searchParams.get('session_id');
  const resourceId = searchParams.get('resource_id');

  useEffect(() => {
    if (resourceId) {
      const resourceData = resourceStorage.getResources().find(r => r.id === resourceId);
      if (resourceData) {
        setResource(resourceData);
        const coachProfile = profileStorage.getProfileById(resourceData.coachId);
        setProfile(coachProfile);
        
        // Increment download count
        const updatedResource = {
          ...resourceData,
          downloads: resourceData.downloads + 1
        };
        resourceStorage.saveResource(updatedResource);
      }
    }
  }, [resourceId]);

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Loading...</h2>
          <p className="text-gray-600">Confirming your purchase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Purchase Successful!</h1>
            <p className="text-gray-600">Thank you for supporting Coach2Coach and our coaching community.</p>
          </div>

          {/* Purchase Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Purchase</h2>
            
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-8 h-8 text-emerald-600" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{resource.title}</h3>
                <p className="text-gray-600 mb-2">{resource.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span>{resource.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{resource.downloads} downloads</span>
                  <span>•</span>
                  <span>${resource.price}</span>
                </div>
              </div>
            </div>

            {profile && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Created by <span className="font-semibold">{profile.firstName} {profile.lastName}</span>
                </p>
              </div>
            )}
          </div>

          {/* Download Section */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-emerald-800 mb-2">Ready to Download</h3>
            <p className="text-emerald-700 mb-4">
              Your resource is ready for download. You can access it anytime from your purchase history.
            </p>
            
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Download Resource
            </button>
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">What's Next?</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link 
                to="/browse"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-decoration-none"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">Browse More Resources</h4>
                  <p className="text-sm text-gray-600">Discover more coaching materials</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
              
              <Link 
                to="/profile"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-decoration-none"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">View Purchase History</h4>
                  <p className="text-sm text-gray-600">Access all your resources</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Need help? <a href="/contact" className="text-emerald-600 hover:text-emerald-700">Contact our support team</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSuccess;