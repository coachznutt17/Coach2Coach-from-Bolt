// Referral system utilities for Coach2Coach platform

export interface ReferralData {
  referrerUserId: string;
  referredUserId: string;
  status: 'DECLARED' | 'QUALIFIED' | 'REJECTED';
  qualifiedAt?: string;
}

export interface ReferralProgress {
  qualifiedCount: number;
  discountActive: boolean;
  discountExpiresAt?: string;
  progressPercentage: number;
  remainingReferrals: number;
  discountTimeRemaining?: string;
}

// Calculate referral progress
export function calculateReferralProgress(
  qualifiedCount: number, 
  discountActive: boolean, 
  discountExpiresAt?: string
): ReferralProgress {
  const targetReferrals = 5;
  const progressPercentage = Math.min((qualifiedCount / targetReferrals) * 100, 100);
  const remainingReferrals = Math.max(targetReferrals - qualifiedCount, 0);

  // Calculate time remaining for discount
  let discountTimeRemaining: string | undefined;
  if (discountActive && discountExpiresAt) {
    const now = new Date();
    const expiresAt = new Date(discountExpiresAt);
    const diffInDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays > 0) {
      if (diffInDays > 30) {
        const months = Math.floor(diffInDays / 30);
        discountTimeRemaining = `${months} month${months !== 1 ? 's' : ''} remaining`;
      } else {
        discountTimeRemaining = `${diffInDays} day${diffInDays !== 1 ? 's' : ''} remaining`;
      }
    } else {
      discountTimeRemaining = 'Expired';
    }
  }

  return {
    qualifiedCount,
    discountActive,
    discountExpiresAt,
    progressPercentage,
    remainingReferrals,
    discountTimeRemaining
  };
}

// Validate referrer (check if user exists and is not self)
export async function validateReferrer(referrerIdentifier: string, newUserId: string): Promise<string | null> {
  // This would typically query your user database
  // For now, return null (no referrer found)
  return null;
}

// Create referral relationship
export async function createReferral(referrerUserId: string, referredUserId: string): Promise<boolean> {
  try {
    // In real implementation, this would create a database record
    // For now, just return success
    return true;
  } catch (error) {
    console.error('Error creating referral:', error);
    return false;
  }
}

// Get referral link for user
export function generateReferralLink(userId: string, baseUrl: string): string {
  return `${baseUrl}/signup?ref=${userId}`;
}

// Apply referral discount (called from server when 5 qualified referrals reached)
export async function applyReferralDiscountIfEligible(referrerUserId: string): Promise<boolean> {
  try {
    // This would be implemented on the server side with Stripe API calls
    // Server would create/apply the 10% forever coupon
    console.log(`Applying referral discount for user: ${referrerUserId}`);
    return true;
  } catch (error) {
    console.error('Error applying referral discount:', error);
    return false;
  }
}