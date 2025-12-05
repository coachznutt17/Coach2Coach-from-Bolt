import React, { useState } from 'react';
import { Download, Calendar, Star, Filter, Search, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSecureDownloadUrl } from '../lib/fileUpload';
import { resourceStorage } from '../lib/localStorage';
import DisputeModal from './DisputeModal';

interface Purchase {
  id: string;
  resourceId: string;
  title: string;
  coachName: string;
  price: number;
  purchaseDate: string;
  downloadCount: number;
  rating?: number;
}

const PurchaseHistory: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Mock purchase data - in real app, this would come from your backend
  const purchases: Purchase[] = [
    {
      id: '1',
      resourceId: 'res1',
      title: 'Advanced Ball Handling Drills',
      coachName: 'Coach Mike Johnson',
      price: 12.99,
      purchaseDate: '2024-01-15',
      downloadCount: 3,
      rating: 5
    },
    {
      id: '2',
      resourceId: 'res2',
      title: 'Team Defense Strategies',
      coachName: 'Coach Sarah Williams',
      price: 19.99,
      purchaseDate: '2024-01-10',
      downloadCount: 1
    },
    {
      id: '3',
      resourceId: 'res3',
      title: 'Youth Basketball Fundamentals',
      coachName: 'Coach Tom Davis',
      price: 8.99,
      purchaseDate: '2024-01-05',
      downloadCount: 5,
      rating: 4
    }
  ];

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = searchTerm === '' || 
      purchase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.coachName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleDownload = (purchase: Purchase) => {
    const resource = resourceStorage.getResources().find(r => r.id === purchase.resourceId);
    if (resource && resource.fileUrls && resource.fileUrls.length > 0) {
      // Download first file (in real app, show file selection)
      downloadResourceFile(resource.fileUrls[0], `${purchase.title}.pdf`);
    } else {
      alert('Resource files not found. Please contact support.');
    }
  };

  const downloadResourceFile = async (fileUrl: string, fileName: string) => {
    try {
      const result = await getSecureDownloadUrl('resources', fileUrl, 3600);
      
      if (result.success && result.url) {
        const link = document.createElement('a');
        link.href = result.url;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error(result.error || 'Failed to get download link');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again or contact support.');
    }
  };

  const handleRate = (purchaseId: string, rating: number) => {
    // In a real app, this would save the rating to your backend
    console.log('Rating:', purchaseId, rating);
  };

  const handleOpenDispute = (purchase: Purchase) => {
    setSelectedPurchase({
      ...purchase,
      resourceTitle: purchase.title,
      amount: purchase.price
    });
    setShowDisputeModal(true);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view your purchase history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Purchase History</h1>
          <p className="text-gray-600">Access and manage all your purchased coaching resources</p>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search your purchases..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Purchases</option>
              <option value="recent">Recent</option>
              <option value="rated">Rated</option>
              <option value="unrated">Not Rated</option>
            </select>
          </div>
        </div>

        {/* Purchase List */}
        <div className="p-6">
          {filteredPurchases.length > 0 ? (
            <div className="space-y-4">
              {filteredPurchases.map((purchase) => (
                <div key={purchase.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{purchase.title}</h3>
                      <p className="text-gray-600 mb-2">by {purchase.coachName}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{new Date(purchase.purchaseDate).toLocaleDateString()}</span>
                        </div>
                        <span>•</span>
                        <span>${purchase.price}</span>
                        <span>•</span>
                        <span>{purchase.downloadCount} downloads</span>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Your rating:</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRate(purchase.id, star)}
                              className={`w-4 h-4 ${
                                purchase.rating && star <= purchase.rating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300 hover:text-yellow-400'
                              } transition-colors`}
                            >
                              <Star className="w-4 h-4 fill-current" />
                            </button>
                          ))}
                        </div>
                        {!purchase.rating && (
                          <span className="text-xs text-gray-500">Click to rate</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleDownload(purchase)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>
                      
                      <button className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold transition-colors text-sm">
                        View Details
                      </button>
                      
                      <button
                        onClick={() => handleOpenDispute(purchase)}
                        className="border border-orange-300 text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg font-semibold transition-colors text-sm flex items-center"
                      >
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Dispute
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">No Purchases Yet</h3>
              <p className="text-gray-600 mb-6">
                Start building your coaching resource library by browsing our marketplace.
              </p>
              <a 
                href="/browse"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
              >
                Browse Resources
              </a>
            </div>
          )}
        </div>

        {/* Dispute Modal */}
        {selectedPurchase && (
          <DisputeModal
            isOpen={showDisputeModal}
            onClose={() => {
              setShowDisputeModal(false);
              setSelectedPurchase(null);
            }}
            purchase={selectedPurchase}
          />
        )}

        {/* Summary */}
        {filteredPurchases.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  Total Purchases: <span className="font-semibold">{filteredPurchases.length}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Total Spent: <span className="font-semibold">
                    ${filteredPurchases.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
                  </span>
                </p>
              </div>
              
              <button className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm">
                Download All Resources
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseHistory;