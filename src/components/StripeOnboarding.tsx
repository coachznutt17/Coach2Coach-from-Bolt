import { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { mvpApi } from '../lib/mvp-api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function StripeOnboarding() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  async function checkOnboardingStatus() {
    if (!user) {
      setChecking(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_onboarded, stripe_connect_id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setOnboarded(data?.stripe_onboarded === true);
    } catch (err: any) {
      console.error('Error checking onboarding status:', err);
    } finally {
      setChecking(false);
    }
  }

  async function handleConnect() {
    setLoading(true);
    setError(null);

    try {
      const { url } = await mvpApi.createConnectLink();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Failed to create Stripe Connect link');
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-400">Checking Stripe connection...</p>
      </div>
    );
  }

  if (onboarded) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Stripe Connected
            </h3>
            <p className="text-gray-300 mb-4">
              Your Stripe account is connected and ready to receive payments.
            </p>
            <p className="text-sm text-gray-400">
              You can now create paid resources and receive payouts directly to your Stripe account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">
            Get Paid with Stripe
          </h3>
          <p className="text-gray-300 mb-4">
            Connect your Stripe account to receive payments for your resources.
          </p>

          <ul className="text-sm text-gray-400 mb-6 space-y-2">
            <li>• Receive payments directly to your bank account</li>
            <li>• Platform fee: 15% per transaction</li>
            <li>• Fast and secure payouts</li>
            <li>• Full transaction history</li>
          </ul>

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={loading}
            className="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              'Connecting...'
            ) : (
              <>
                Connect with Stripe
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            You'll be redirected to Stripe to complete the onboarding process.
          </p>
        </div>
      </div>
    </div>
  );
}
