import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, ExternalLink, Loader, CreditCard, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SellerOnboarding: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectAccountId, setConnectAccountId] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const success = searchParams.get('success');
  const refresh = searchParams.get('refresh');

  useEffect(() => {
    if (success === 'true') {
      setOnboardingComplete(true);
    }
  }, [success]);

  const handleCreateConnectAccount = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8787/stripe/connect/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Connect account');
      }

      setConnectAccountId(data.accountId);
      
      // Now create account link for onboarding
      await handleStartOnboarding(data.accountId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create seller account');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOnboarding = async (accountId?: string) => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8787/stripe/connect/account-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create onboarding link');
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start onboarding');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to become a seller.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Become a Seller</h1>
            <p className="text-gray-600">Set up your seller account to start earning from your coaching expertise</p>
          </div>

          {/* Success State */}
          {onboardingComplete && (
            <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-green-800">Seller Account Active!</h3>
              </div>
              <p className="text-green-700 mb-4">
                Your seller account has been successfully set up. You can now upload and sell your coaching resources.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="/upload"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
                >
                  Upload Your First Resource
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
                <a 
                  href="/profile"
                  className="border border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  View Profile
                </a>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Onboarding Steps */}
          {!onboardingComplete && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">What You'll Need</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Bank account information for payouts</li>
                  <li>• Tax identification (SSN or EIN)</li>
                  <li>• Business information (if applicable)</li>
                  <li>• Identity verification documents</li>
                </ul>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-emerald-800 mb-2">Seller Benefits</h3>
                <ul className="text-emerald-700 text-sm space-y-1">
                  <li>• Keep 85% of every sale</li>
                  <li>• Automatic payouts to your bank account</li>
                  <li>• Professional seller dashboard</li>
                  <li>• Sales analytics and insights</li>
                  <li>• Marketing support from our team</li>
                </ul>
              </div>

              <div className="text-center">
                <button
                  onClick={handleCreateConnectAccount}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center mx-auto"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Setting up account...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Start Seller Setup
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-3">
                  Powered by Stripe • Secure & trusted by millions
                </p>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Secure & Compliant</h4>
                <p className="text-xs text-gray-600">
                  Your financial information is processed securely by Stripe, our payment partner. 
                  We never store your banking details on our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerOnboarding;