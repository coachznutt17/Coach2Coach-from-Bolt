import { useState, useEffect } from 'react';
import { Download, ShoppingCart, Gift, Loader2 } from 'lucide-react';
import { mvpApi, isPaidFeatureEnabled } from '../lib/mvp-api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ResourcePurchaseProps {
  resourceId: string;
  price: number;
  ownerId: string;
}

export default function ResourcePurchase({ resourceId, price, ownerId }: ResourcePurchaseProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owned, setOwned] = useState(false);
  const [checking, setChecking] = useState(true);

  const priceCents = Math.round(price * 100);
  const isFree = priceCents === 0;
  const isOwner = user?.id === ownerId;
  const paidEnabled = isPaidFeatureEnabled();

  useEffect(() => {
    checkOwnership();
  }, [user, resourceId]);

  async function checkOwnership() {
    if (!user) {
      setChecking(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('resource_id', resourceId)
        .eq('status', 'completed')
        .maybeSingle();

      if (error) throw error;

      setOwned(!!data);
    } catch (err: any) {
      console.error('Error checking ownership:', err);
    } finally {
      setChecking(false);
    }
  }

  async function handleFreePurchase() {
    if (!user) {
      setError('Please log in to get this resource');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await mvpApi.purchaseFree(resourceId);
      setOwned(true);
    } catch (err: any) {
      setError(err.message || 'Failed to complete purchase');
    } finally {
      setLoading(false);
    }
  }

  async function handlePaidPurchase() {
    if (!user) {
      setError('Please log in to purchase this resource');
      return;
    }

    if (!paidEnabled) {
      setError('Paid features are not available yet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { url } = await mvpApi.createCheckoutSession(resourceId);
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Failed to create checkout session');
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!user) {
      setError('Please log in to download');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { url } = await mvpApi.getDownloadUrl(resourceId);
      window.open(url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Failed to generate download link');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isOwner || owned) {
    return (
      <div className="space-y-3">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="w-full bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating link...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    );
  }

  if (isFree) {
    return (
      <div className="space-y-3">
        <button
          onClick={handleFreePurchase}
          disabled={loading}
          className="w-full bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Getting...
            </>
          ) : (
            <>
              <Gift className="w-5 h-5" />
              Get for Free
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    );
  }

  if (!paidEnabled) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <p className="text-gray-400 text-sm text-center">
          Paid resources are not available yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-gray-800 rounded-lg p-4 mb-3">
        <div className="text-center">
          <span className="text-3xl font-bold text-white">
            ${(priceCents / 100).toFixed(2)}
          </span>
          <p className="text-sm text-gray-400 mt-1">One-time purchase</p>
        </div>
      </div>

      <button
        onClick={handlePaidPurchase}
        disabled={loading}
        className="w-full bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Redirecting...
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            Buy Now
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        Secure checkout powered by Stripe
      </p>
    </div>
  );
}
