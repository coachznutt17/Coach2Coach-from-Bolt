// Membership utilities for Coach2Coach platform with strict access control

export type MembershipStatus = 'none' | 'trial' | 'active' | 'past_due' | 'canceled';

export interface UserMembership {
  membershipStatus: MembershipStatus;
  membershipTrialEndsAt?: string;
  membershipCurrentPeriodEnd?: string;
  isCreatorEnabled: boolean;
  stripeCustomerId?: string;
  stripeConnectId?: string;
}

// Check if user can upload or sell resources (ACTIVE + creator enabled only)
export function canUploadOrSell(membership: UserMembership): boolean {
  return membership.membershipStatus === 'active' && membership.isCreatorEnabled;
}

// Check if user can purchase resources (ACTIVE only)
export function canPurchase(membership: UserMembership): boolean {
  return membership.membershipStatus === 'active';
}

// Check if user can download full resources (ACTIVE only, or within grace period)
export function canDownloadFull(membership: UserMembership, gracePeriodDays: number = 7): boolean {
  if (membership.membershipStatus === 'active') {
    return true;
  }
  
  // Grace period for past_due members
  if (membership.membershipStatus === 'past_due' && membership.membershipCurrentPeriodEnd) {
    const gracePeriodEnd = new Date(membership.membershipCurrentPeriodEnd);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);
    return new Date() <= gracePeriodEnd;
  }
  
  return false;
}

// Check if user is in trial period
export function isInTrial(membership: UserMembership): boolean {
  if (membership.membershipStatus !== 'trial') return false;
  
  if (membership.membershipTrialEndsAt) {
    return new Date(membership.membershipTrialEndsAt) > new Date();
  }
  
  return false;
}

// Check if user has any form of access (trial or active)
export function hasAnyAccess(membership: UserMembership): boolean {
  return isInTrial(membership) || membership.membershipStatus === 'active';
}

// Get days remaining in trial
export function getTrialDaysRemaining(membership: UserMembership): number {
  if (!membership.membershipTrialEndsAt) return 0;
  
  const now = new Date();
  const trialEnd = new Date(membership.membershipTrialEndsAt);
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

// Get membership status display text
export function getMembershipStatusText(status: MembershipStatus): string {
  switch (status) {
    case 'none':
      return 'No Membership';
    case 'trial':
      return 'Free Trial';
    case 'active':
      return 'Active Member';
    case 'past_due':
      return 'Payment Past Due';
    case 'canceled':
      return 'Canceled';
    default:
      return 'Unknown';
  }
}

// Get membership status color classes
export function getMembershipStatusColor(status: MembershipStatus): string {
  switch (status) {
    case 'none':
      return 'text-gray-600 bg-gray-100';
    case 'trial':
      return 'text-blue-600 bg-blue-100';
    case 'active':
      return 'text-green-600 bg-green-100';
    case 'past_due':
      return 'text-red-600 bg-red-100';
    case 'canceled':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Get access level description
export function getAccessDescription(membership: UserMembership): string {
  if (membership.membershipStatus === 'active') {
    return 'Full access to all features';
  }
  
  if (isInTrial(membership)) {
    const daysRemaining = getTrialDaysRemaining(membership);
    return `Trial access - ${daysRemaining} days remaining`;
  }
  
  if (membership.membershipStatus === 'past_due') {
    return 'Limited access - payment required';
  }
  
  return 'Preview access only';
}

// Check if user needs to upgrade
export function needsUpgrade(membership: UserMembership, action: 'upload' | 'purchase' | 'download'): boolean {
  switch (action) {
    case 'upload':
      return !canUploadOrSell(membership);
    case 'purchase':
      return !canPurchase(membership);
    case 'download':
      return !canDownloadFull(membership);
    default:
      return false;
  }
}

// Get upgrade message for specific action
export function getUpgradeMessage(membership: UserMembership, action: 'upload' | 'purchase' | 'download'): string {
  const isTrialUser = isInTrial(membership);
  
  switch (action) {
    case 'upload':
      if (isTrialUser) {
        return 'Upgrade to an active membership to upload and sell resources';
      }
      if (!membership.isCreatorEnabled) {
        return 'Complete seller onboarding to upload resources';
      }
      return 'Active membership required to upload resources';
      
    case 'purchase':
      if (isTrialUser) {
        return 'Upgrade to an active membership to purchase resources';
      }
      return 'Active membership required to purchase resources';
      
    case 'download':
      if (isTrialUser) {
        return 'Upgrade to an active membership for full downloads';
      }
      return 'Active membership required for full downloads';
      
    default:
      return 'Active membership required';
  }
}