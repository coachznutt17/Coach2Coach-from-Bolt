import Stripe from 'stripe';

// Validate required Stripe environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY – set this in your environment configuration.');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn('Warning: STRIPE_WEBHOOK_SECRET not set – webhook signature verification will fail.');
}

if (!process.env.MEMBERSHIP_PRICE_ID) {
  console.warn('Warning: MEMBERSHIP_PRICE_ID not set – subscription checkouts will fail.');
}

// Initialize Stripe with API version
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Export configuration constants
export const PLATFORM_FEE_PERCENT = (parseInt(process.env.PLATFORM_FEE_PERCENT || '15') / 100);
export const REFERRAL_DISCOUNT_PERCENT = parseInt(process.env.REFERRAL_DISCOUNT_PERCENT || '10');
export const MEMBERSHIP_PRICE_ID = process.env.MEMBERSHIP_PRICE_ID!;

// Helper to calculate platform fee
export function calculatePlatformFee(amountCents: number): number {
  return Math.round(amountCents * PLATFORM_FEE_PERCENT);
}

// Helper to calculate seller earnings
export function calculateSellerEarnings(amountCents: number): number {
  return amountCents - calculatePlatformFee(amountCents);
}