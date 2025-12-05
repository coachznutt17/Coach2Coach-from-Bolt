import { loadStripe } from '@stripe/stripe-js';
import { getApiUrl } from './apiConfig';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export { stripePromise };

// Stripe configuration
export const stripeConfig = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  currency: 'usd',
  country: 'US'
};

// Commission rates based on membership tier
export const commissionRates = {
  member: 0.15,    // 15% platform fee, creators keep 85%
};

// Calculate commission breakdown
export const calculateCommission = (price: number, tier: 'member' = 'member') => {
  const rate = commissionRates.member;
  const platformFee = price * rate;
  const coachEarnings = price - platformFee;
  
  return {
    totalPrice: price,
    platformFee: Number(platformFee.toFixed(2)),
    coachEarnings: Number(coachEarnings.toFixed(2)),
    commissionRate: rate
  };
};

// Create checkout session
export const createCheckoutSession = async (resourceId: string, price: number, title: string) => {
  try {
    const response = await fetch(getApiUrl('/api/create-checkout-session'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resourceId,
        price,
        title,
        currency: stripeConfig.currency
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Redirect to Stripe Checkout
export const redirectToCheckout = async (sessionId: string) => {
  const stripe = await stripePromise;
  
  if (!stripe) {
    throw new Error('Stripe failed to initialize');
  }

  const { error } = await stripe.redirectToCheckout({
    sessionId: sessionId,
  });

  if (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
};