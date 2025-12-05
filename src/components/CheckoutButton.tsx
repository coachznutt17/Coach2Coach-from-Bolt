import React, { useState } from 'react';
import { ShoppingCart, CreditCard, Loader, Lock, Crown, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMembership } from '../hooks/useMembership';
import { canPurchase, canDownloadFull, isInTrial, needsUpgrade } from '../lib/membership';
import { api } from '../lib/api';
import CheckoutModal from './CheckoutModal';
import MembershipGate from './MembershipGate';

interface CheckoutButtonProps {
  resource: {
    id: string;
    coachId: string;
    title: string;
    description: string;
    price: number;
    sports: string[];
    levels: string[];
    rating: number;
    downloads: number;
  };
  className?: string;
  variant?: 'primary' | 'secondary';
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  resource,
  className = '',
  variant = 'primary'
}) => {
  const { user } = useAuth();
  const { membership } = useMembership();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Define styles first
  const baseClasses = "flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:transform-none disabled:opacity-50";

  const variantClasses = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
    secondary: "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
  };

  if (!user || !membership) {
    return (
      <button
        onClick={() => alert('Please sign in to purchase resources')}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      >
        <CreditCard className="w-4 h-4 mr-2" />
        Sign In to Purchase
      </button>
    );
  }

  const canBuy = canPurchase(membership);
  const canDownload = canDownloadFull(membership);
  const inTrial = isInTrial(membership);

  const handlePurchase = async () => {
    if (!canBuy) {
      // Show upgrade prompt
      alert('Active membership required to purchase resources. Please upgrade to continue.');
      return;
    }

    setLoading(true);

    try {
      const result = await api.purchaseResource(resource.id);

      if (result.success && result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else {
        throw new Error(result.error || 'Failed to create checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show different button based on membership status
  if (!canBuy) {
    return (
      <button
        onClick={() => alert('Active membership required to purchase resources')}
        className={`${baseClasses} bg-gray-400 text-white cursor-not-allowed ${className}`}
        disabled
      >
        <Lock className="w-4 h-4 mr-2" />
        {inTrial ? 'Upgrade to Purchase' : 'Membership Required'}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handlePurchase}
        disabled={loading}
        className={`${baseClasses} ${variantClasses[variant]} ${loading ? 'opacity-50' : ''} ${className}`}
      >
        {loading ? (
          'Processing...'
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Purchase ${resource.price}
          </>
        )}
      </button>
      
      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        resource={resource}
      />
    </>
  );
};

export default CheckoutButton;