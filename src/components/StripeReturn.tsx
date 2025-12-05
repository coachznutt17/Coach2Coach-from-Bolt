import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function StripeReturn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('Verifying your Stripe connection...');

  const isRefresh = searchParams.get('refresh') === 'true';

  useEffect(() => {
    verifyOnboarding();
  }, [user]);

  async function verifyOnboarding() {
    if (!user) {
      setStatus('error');
      setMessage('Please log in to continue');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_connect_id, stripe_onboarded')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data?.stripe_connect_id) {
        if (!data.stripe_onboarded && !isRefresh) {
          await supabase
            .from('profiles')
            .update({ stripe_onboarded: true })
            .eq('user_id', user.id);
        }

        setStatus('success');
        setMessage(
          isRefresh
            ? 'Stripe connection refreshed. You can close this page.'
            : 'Your Stripe account is connected! You can now receive payments.'
        );

        setTimeout(() => {
          navigate('/account');
        }, 3000);
      } else {
        setStatus('error');
        setMessage('Stripe connection not found. Please try again.');
      }
    } catch (err: any) {
      console.error('Error verifying onboarding:', err);
      setStatus('error');
      setMessage('Failed to verify Stripe connection. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8">
          {status === 'checking' && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-emerald-400 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Verifying Connection
              </h2>
              <p className="text-gray-400">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Success!
              </h2>
              <p className="text-gray-300 mb-6">{message}</p>
              <button
                onClick={() => navigate('/account')}
                className="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Go to Account
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Connection Issue
              </h2>
              <p className="text-gray-300 mb-6">{message}</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate('/account')}
                  className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Back to Account
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
