// Global membership status banner

import React from 'react';
import { AlertTriangle, Crown, Calendar, CreditCard, X } from 'lucide-react';
import { UserMembership, getMembershipStatusText, getTrialDaysRemaining } from '../lib/membership';
import { api } from '../lib/api';

interface MembershipBannerProps {
  membership: UserMembership;
  onDismiss?: () => void;
}

const MembershipBanner: React.FC<MembershipBannerProps> = ({ membership, onDismiss }) => {
  const [loading, setLoading] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed || membership.membershipStatus === 'active') {
    return null;
  }

  const handleUpgrade = async () => {
    setLoading(true);
    
    try {
      const result = await api.createSubscriptionCheckout('current-user-id');
      
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    
    try {
      const result = await api.createBillingPortal('current-user-id');
      
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (error) {
      console.error('Billing portal error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Trial banner
  if (membership.membershipStatus === 'trial') {
    const daysRemaining = getTrialDaysRemaining(membership);
    
    return (
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-3" />
              <span className="font-medium">
                Free Trial: {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
              </span>
              <span className="ml-2 text-blue-200">
                • Upgrade for unlimited downloads and creator tools
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-1 rounded-lg font-semibold text-sm transition-colors"
              >
                {loading ? 'Loading...' : 'Upgrade Now'}
              </button>
              <button
                onClick={handleDismiss}
                className="text-blue-200 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Past due banner
  if (membership.membershipStatus === 'past_due') {
    return (
      <div className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-3" />
              <span className="font-medium">
                Payment Past Due - Update your payment method to restore access
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleManageBilling}
                disabled={loading}
                className="bg-white text-red-600 hover:bg-red-50 px-4 py-1 rounded-lg font-semibold text-sm transition-colors flex items-center"
              >
                <CreditCard className="w-4 h-4 mr-1" />
                {loading ? 'Loading...' : 'Update Payment'}
              </button>
              <button
                onClick={handleDismiss}
                className="text-red-200 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Canceled banner
  if (membership.membershipStatus === 'canceled') {
    return (
      <div className="bg-gray-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <Crown className="w-5 h-5 mr-3" />
              <span className="font-medium">
                Membership Canceled - Reactivate to regain full access
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-1 rounded-lg font-semibold text-sm transition-colors"
              >
                {loading ? 'Loading...' : 'Reactivate'}
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-200 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MembershipBanner;