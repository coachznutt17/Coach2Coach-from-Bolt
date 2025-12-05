import React, { useState } from 'react';
import { X, AlertTriangle, DollarSign, Send, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../lib/apiConfig';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: {
    id: string;
    resourceTitle: string;
    amount: number;
    purchaseDate: string;
  };
}

const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  purchase
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const disputeReasons = [
    { 
      value: 'not_as_described', 
      label: 'Not as Described', 
      description: 'The resource content does not match the description' 
    },
    { 
      value: 'technical_issue', 
      label: 'Technical Issue', 
      description: 'Files are corrupted, missing, or cannot be opened' 
    },
    { 
      value: 'quality_issue', 
      label: 'Quality Issue', 
      description: 'The resource is of poor quality or incomplete' 
    },
    { 
      value: 'copyright_claim', 
      label: 'Copyright Concern', 
      description: 'This appears to be copyrighted material' 
    },
    { 
      value: 'other', 
      label: 'Other Issue', 
      description: 'Other reason not listed above' 
    }
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !reason || !details.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/disputes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          purchaseId: purchase.id,
          reason,
          details: details.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setReason('');
          setDetails('');
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to submit dispute');
      }
    } catch (error) {
      console.error('Error submitting dispute:', error);
      alert('Failed to submit dispute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const daysSincePurchase = Math.floor(
    (Date.now() - new Date(purchase.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Dispute Submitted</h3>
          <p className="text-gray-600 mb-4">
            We've received your dispute and will review it within 2-3 business days. 
            You'll receive an email update once we've made a decision.
          </p>
          <p className="text-sm text-gray-500">
            Reference ID: {purchase.id.slice(0, 8)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Open Dispute</h2>
                <p className="text-sm text-gray-600">Request a refund or report an issue</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Purchase Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-slate-900 mb-2">Purchase Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Resource:</span>
                <span className="font-medium text-slate-900">{purchase.resourceTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium text-slate-900">${purchase.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Purchase Date:</span>
                <span className="font-medium text-slate-900">
                  {new Date(purchase.purchaseDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Days Since Purchase:</span>
                <span className={`font-medium ${daysSincePurchase > 30 ? 'text-red-600' : 'text-slate-900'}`}>
                  {daysSincePurchase} days
                </span>
              </div>
            </div>
          </div>

          {/* Dispute Eligibility Warning */}
          {daysSincePurchase > 30 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 mb-1">Dispute Window Expired</h4>
                  <p className="text-red-700 text-sm">
                    Disputes must be opened within 30 days of purchase. Please contact support 
                    directly for assistance with older purchases.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dispute Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What's the issue? *
              </label>
              <div className="space-y-3">
                {disputeReasons.map((reasonOption) => (
                  <label key={reasonOption.value} className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      name="reason"
                      value={reasonOption.value}
                      checked={reason === reasonOption.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="mt-1 mr-3"
                      required
                      disabled={daysSincePurchase > 30}
                    />
                    <div>
                      <div className="font-medium text-slate-900">{reasonOption.label}</div>
                      <div className="text-sm text-gray-600">{reasonOption.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Explanation *
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please explain the issue in detail. Include what you expected vs. what you received..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
                disabled={daysSincePurchase > 30}
              />
              <p className="text-xs text-gray-500 mt-1">
                Detailed explanations help us resolve disputes faster
              </p>
            </div>

            {/* Refund Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <DollarSign className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">Refund Process</h4>
                  <p className="text-blue-700 text-sm">
                    If approved, refunds are processed back to your original payment method within 5-10 business days. 
                    You'll lose access to the resource upon refund approval.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
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
                disabled={loading || !reason || !details.trim() || daysSincePurchase > 30}
                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                {loading ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Dispute
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DisputeModal;