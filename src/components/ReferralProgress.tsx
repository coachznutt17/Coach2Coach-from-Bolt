import React from 'react';
import { Users, Gift, Crown, Share2, Copy, CheckCircle } from 'lucide-react';
import { calculateReferralProgress } from '../lib/referrals';

interface ReferralProgressProps {
  qualifiedCount: number;
  discountActive: boolean;
  discountExpiresAt?: string;
  userId?: string;
  className?: string;
}

const ReferralProgress: React.FC<ReferralProgressProps> = ({
  qualifiedCount,
  discountActive,
  discountExpiresAt,
  userId,
  className = ''
}) => {
  const progress = calculateReferralProgress(qualifiedCount, discountActive, discountExpiresAt);
  const [copied, setCopied] = React.useState(false);

  const referralLink = userId ? `${window.location.origin}/signup?ref=${userId}` : '';

  const copyReferralLink = async () => {
    if (referralLink) {
      try {
        await navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Referral Program</h3>
            <p className="text-sm text-gray-600">Earn 10% off for 3 months after 5 qualified referrals</p>
          </div>
        </div>
        
        {discountActive && (
          <div className="flex flex-col items-end">
            <div className="flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold mb-1">
            <Crown className="w-4 h-4 mr-1" />
              10% Discount Active
            </div>
            {progress.discountTimeRemaining && (
              <span className="text-xs text-emerald-600">{progress.discountTimeRemaining}</span>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {qualifiedCount} of 5 qualified referrals
          </span>
          <span className="text-sm text-gray-600">
            {progress.remainingReferrals} more needed
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress.progressPercentage}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between mt-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step <= qualifiedCount
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Referral Link */}
      {userId && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Referral Link</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
            />
            <button
              onClick={copyReferralLink}
              className="flex items-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Benefits */}
      <div className="space-y-3">
        <div className="flex items-center p-3 bg-emerald-50 rounded-lg">
          <Gift className="w-5 h-5 text-emerald-600 mr-3" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">10% Discount for 3 Months</p>
            <p className="text-xs text-emerald-700">Unlock 3 months of savings on your membership</p>
          </div>
        </div>
        
        <div className="flex items-center p-3 bg-blue-50 rounded-lg">
          <Share2 className="w-5 h-5 text-blue-600 mr-3" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Help Coaches Succeed</p>
            <p className="text-xs text-blue-700">Share Coach2Coach with fellow coaches</p>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Qualified referrals must pay their first invoice and remain active for 48 hours. 
          Discount applies to next 3 billing cycles.
        </p>
      </div>
    </div>
  );
};

export default ReferralProgress;