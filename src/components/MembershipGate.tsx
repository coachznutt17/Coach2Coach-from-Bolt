// Membership gate component for protecting features

import React from 'react';
import { Crown, Lock, ArrowRight, Calendar, AlertTriangle } from 'lucide-react';
import { UserMembership, getMembershipStatusText, getUpgradeMessage, needsUpgrade } from '../lib/membership';
import { api } from '../lib/api';

interface MembershipGateProps {
  membership: UserMembership;
  action: 'upload' | 'purchase' | 'download';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const MembershipGate: React.FC<MembershipGateProps> = ({
  membership,
  action,
  children,
  fallback,
  className = ''
}) => {
  const [loading, setLoading] = React.useState(false);

  const requiresUpgrade = needsUpgrade(membership, action);

  const handleUpgrade = async () => {
    setLoading(true);
    
    try {
      const result = await api.createSubscriptionCheckout('current-user-id');
      
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      } else {
        alert('Failed to start upgrade process. Please try again.');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!requiresUpgrade) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center ${className}`}>
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {action === 'upload' ? (
          <Crown className="w-8 h-8 text-emerald-600" />
        ) : action === 'purchase' ? (
          <Lock className="w-8 h-8 text-emerald-600" />
        ) : (
          <AlertTriangle className="w-8 h-8 text-emerald-600" />
        )}
      </div>
      
      <h3 className="text-2xl font-bold text-slate-900 mb-2">
        {action === 'upload' ? 'Start Selling Your Expertise' : 
         action === 'purchase' ? 'Unlock Full Access' : 
         'Premium Feature'}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {getUpgradeMessage(membership, action)}
      </p>

      <div className="space-y-4">
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors flex items-center justify-center mx-auto"
        >
          {loading ? (
            'Starting upgrade...'
          ) : (
            <>
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Active Membership
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>

        <div className="text-sm text-gray-500">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4 mr-1" />
            7-day free trial • $5.99/month after
          </div>
          <p>Cancel anytime • Unlimited downloads • Creator tools</p>
        </div>
      </div>
    </div>
  );
};

export default MembershipGate;