import React from 'react';
import { CheckCircle, Download, Star, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PurchaseConfirmationProps {
  resource: {
    id: string;
    title: string;
    description: string;
    price: number;
    rating: number;
    downloads: number;
  };
  coach: {
    name: string;
    title: string;
  };
  transactionId: string;
}

const PurchaseConfirmation: React.FC<PurchaseConfirmationProps> = ({
  resource,
  coach,
  transactionId
}) => {
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
            <p className="text-gray-600">Thank you for supporting the coaching community</p>
          </div>

          {/* Purchase Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Purchase</h2>
            
            <div className="flex items-start space-x-4 mb-4">
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

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">
                  Created by <span className="font-semibold">{coach.name}</span> - {coach.title}
                </span>
              </div>
            </div>
          </div>

          {/* Download Section */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-emerald-800 mb-2">Ready to Download</h3>
            <p className="text-emerald-700 mb-4">
              Your resource is ready for download. You can access it anytime from your purchase history.
            </p>
            
            <div className="flex space-x-4">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Download Now
              </button>
              <Link 
                to="/purchases"
                className="border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center no-underline"
              >
                View All Purchases
              </Link>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-slate-900">{transactionId}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Purchase Date:</span>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-500 mr-1" />
                <span className="text-slate-900">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-4">What's Next?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link 
                to="/browse"
                className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors no-underline"
              >
                <div className="text-center">
                  <h4 className="font-semibold text-slate-900">Browse More Resources</h4>
                  <p className="text-sm text-gray-600">Discover more coaching materials</p>
                </div>
              </Link>
              
              <Link 
                to="/become-seller"
                className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors no-underline"
              >
                <div className="text-center">
                  <h4 className="font-semibold text-slate-900">Share Your Expertise</h4>
                  <p className="text-sm text-gray-600">Start selling your resources</p>
                </div>
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

export default PurchaseConfirmation;