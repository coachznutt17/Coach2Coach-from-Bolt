// Authentication and subscription utilities for Coach2Coach platform
import { supabase } from './supabase';

export interface UserSubscription {
  id: string;
  userId: string;
  status: 'trial' | 'active' | 'canceled' | 'expired';
  trialEndsAt?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

// Check if user has active subscription or trial
export const hasActiveAccess = (subscription: UserSubscription | null): boolean => {
  if (!subscription) return false;
  
  const now = new Date();
  
  // Check trial access
  if (subscription.status === 'trial' && subscription.trialEndsAt) {
    return new Date(subscription.trialEndsAt) > now;
  }
  
  // Check paid subscription
  if (subscription.status === 'active') {
    return new Date(subscription.currentPeriodEnd) > now;
  }
  
  return false;
};

// Check if user is in trial period
export const isInTrial = (subscription: UserSubscription | null): boolean => {
  if (!subscription || subscription.status !== 'trial') return false;
  
  if (subscription.trialEndsAt) {
    return new Date(subscription.trialEndsAt) > new Date();
  }
  
  return false;
};

// Get days remaining in trial
export const getTrialDaysRemaining = (subscription: UserSubscription | null): number => {
  if (!subscription || !subscription.trialEndsAt) return 0;
  
  const now = new Date();
  const trialEnd = new Date(subscription.trialEndsAt);
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

// Create trial subscription for new users
export const createTrialSubscription = (userId: string): UserSubscription => {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
  
  return {
    id: `trial_${userId}_${Date.now()}`,
    userId,
    status: 'trial',
    trialEndsAt: trialEnd.toISOString(),
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: trialEnd.toISOString(),
    cancelAtPeriodEnd: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
};

// Mock subscription data for demo
export const getMockSubscription = (userId: string): UserSubscription => {
  // Check if user already has a trial in localStorage
  const existingTrial = localStorage.getItem(`coach2coach_subscription_${userId}`);
  
  if (existingTrial) {
    return JSON.parse(existingTrial);
  }
  
  // Create new trial
  const trial = createTrialSubscription(userId);
  localStorage.setItem(`coach2coach_subscription_${userId}`, JSON.stringify(trial));
  
  return trial;
};

// Update subscription status
export const updateSubscriptionStatus = (userId: string, updates: Partial<UserSubscription>): UserSubscription => {
  const existing = getMockSubscription(userId);
  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  localStorage.setItem(`coach2coach_subscription_${userId}`, JSON.stringify(updated));
  return updated;
};