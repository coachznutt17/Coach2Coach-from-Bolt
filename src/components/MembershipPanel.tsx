import React, { useState } from 'react';
import { Crown, CreditCard, Calendar, Users, ArrowRight, Loader, CheckCircle, AlertCircle, Share2, Upload, Download, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMembership } from '../hooks/useMembership';
import { 
  getMembershipStatusText, 
  getMembershipStatusColor, 
  canUploadOrSell, 
  canPurchase,
  canDownloadFull,
  isInTrial,
  getTrialDaysRemaining,
  getAccessDescription
} from '../lib/membership';
import { api } from '../lib/api';

const MembershipPanel: React.FC = () => {
  const { user } = useAuth();
  const { membership, loading: membershipLoading, refreshMembership } = useMembership();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!user || membershipLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Join Coach2Coach</h3>
          <p className="text-gray-600 mb-4">Sign in to start your 7-day free trial</p>
        </div>
      </div>
    );
  }

  const canUpload = canUploadOrSell(membership);
  const canBuy = canPurchase(membership);
  const canDownload = canDownloadFull(membership);
  const inTrial = isInTrial(membership);
  const trialDaysRemaining = getTrialDaysRemaining(membership);

  const referralLink = user?.id ? `${window.location.origin}/signup?ref=${user.id}` : '';

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

  const handleStartTrial = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api.createSubscriptionCheckout(user.id);
      
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start trial');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api.createBillingPortal(user.id);
      
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      } else {
        throw new Error(result.error || 'Failed to create portal session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
            <Crown className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Membership</h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMembershipStatusColor(membership.membershipStatus)}`}>
              {getMembershipStatusText(membership.membershipStatus)}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Trial Status */}
      {inTrial && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center mb-2">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-semibold text-blue-800">Free Trial Active</span>
          </div>
          <p className="text-blue-700 text-sm mb-3">
            {trialDaysRemaining} days remaining in your trial
          </p>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((7 - trialDaysRemaining) / 7) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Active Membership */}
      {membership.membershipStatus === 'active' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-semibold text-green-800">Active Membership</span>
          </div>
          <p className="text-green-700 text-sm">
            {membership.membershipCurrentPeriodEnd 
              ? `Your membership renews on ${new Date(membership.membershipCurrentPeriodEnd).toLocaleDateString()}`
              : 'Active membership with full access'
            }
          </p>
        </div>
      )}

      {/* Past Due Status */}
      {membership.membershipStatus === 'past_due' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="font-semibold text-red-800">Payment Past Due</span>
          </div>
          <p className="text-red-700 text-sm">
            Update your payment method to restore full access
          </p>
        </div>
      )}

      {/* Features */}
      <div className="mb-6">
        <h4 className="font-semibold text-slate-900 mb-3">Your Access</h4>
        <p className="text-sm text-gray-600 mb-3">{getAccessDescription(membership)}</p>
        <div className="space-y-2">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            <span className="text-sm text-gray-700">Browse and preview resources</span>
          </div>
          <div className="flex items-center">
            <MessageCircle className="w-4 h-4 text-green-500 mr-2" />
            <span className="text-sm text-gray-700">Community discussions & messaging</span>
          </div>
          <div className="flex items-center">
            {canDownload ? (
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            ) : (
              <Download className="w-4 h-4 text-gray-400 mr-2" />
            )}
            <span className={`text-sm ${canDownload ? 'text-gray-700' : 'text-gray-400'}`}>
              Unlimited downloads
              {!canDownload && ' (Active membership required)'}
            </span>
          </div>
          <div className="flex items-center">
            {canUpload ? (
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            ) : (
              <Upload className="w-4 h-4 text-gray-400 mr-2" />
            )}
            <span className={`text-sm ${canUpload ? 'text-gray-700' : 'text-gray-400'}`}>
              Upload & sell resources
              {!canUpload && ' (Active membership + creator setup required)'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {(membership.membershipStatus === 'trial' || membership.membershipStatus === 'none') && (
          <button
            onClick={handleStartTrial}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
          >
            {loading ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Crown className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Starting...' : membership.membershipStatus === 'none' ? 'Start Free Trial' : 'Upgrade to Full Access'}
          </button>
        )}

        {membership.membershipStatus !== 'none' && membership.membershipStatus !== 'trial' && (
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="w-full border border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
          >
            {loading ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Loading...' : 'Manage Subscription'}
          </button>
        )}

        {/* Referral Link */}
        {user?.id && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Share & Earn</span>
              <span className="text-xs text-emerald-600 font-medium">
                0/5 qualified
              </span>
            </div>
            <button
              onClick={copyReferralLink}
              className="w-full flex items-center justify-center px-3 py-2 border border-emerald-300 text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-medium transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Copy Referral Link
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Upgrade Benefits */}
      {inTrial && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            Upgrade for unlimited downloads, creator tools, and the ability to upload & sell resources
          </p>
        </div>
      )}
    </div>
  );
};

export default MembershipPanel;