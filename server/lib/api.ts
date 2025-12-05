// Server-side API utilities with membership verification

import { query } from './db';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Verify user is active member
export async function requireActiveMember(userId: string): Promise<boolean> {
  try {
    const result = await query(
      'SELECT membership_status, membership_current_period_end FROM profiles WHERE user_id = $1',
      [userId]
    );

    const profile = result.rows[0];
    if (!profile) return false;

    if (profile.membership_status === 'active') {
      if (profile.membership_current_period_end) {
        return new Date(profile.membership_current_period_end) > new Date();
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking membership:', error);
    return false;
  }
}

// Verify user is active creator
export async function requireCreator(userId: string): Promise<boolean> {
  try {
    const result = await query(
      'SELECT membership_status, is_creator_enabled, membership_current_period_end FROM profiles WHERE user_id = $1',
      [userId]
    );

    const profile = result.rows[0];
    if (!profile) return false;

    const isActiveMember = profile.membership_status === 'active' &&
      (!profile.membership_current_period_end || new Date(profile.membership_current_period_end) > new Date());

    return isActiveMember && profile.is_creator_enabled;
  } catch (error) {
    console.error('Error checking creator status:', error);
    return false;
  }
}

// Check if user can download a specific resource
export async function canDownloadResource(userId: string, resourceId: string): Promise<boolean> {
  try {
    const isActive = await requireActiveMember(userId);
    if (!isActive) return false;

    const profileResult = await query(
      'SELECT id FROM profiles WHERE user_id = $1',
      [userId]
    );
    if (!profileResult.rows[0]) return false;

    const userProfileId = profileResult.rows[0].id;

    const resourceResult = await query(
      'SELECT owner_id FROM resources WHERE id = $1',
      [resourceId]
    );

    if (resourceResult.rows[0]?.owner_id === userProfileId) {
      return true;
    }

    const purchaseResult = await query(
      'SELECT id FROM purchases WHERE buyer_id = $1 AND resource_id = $2 AND status = $3',
      [userProfileId, resourceId, 'succeeded']
    );

    return purchaseResult.rows.length > 0;
  } catch (error) {
    console.error('Error checking download permission:', error);
    return false;
  }
}

// Log audit event
export async function logAuditEvent(
  actorId: string,
  action: string,
  subjectType: string,
  subjectId?: string,
  metadata?: any
): Promise<void> {
  try {
    await query(
      'INSERT INTO audit_events (actor_id, action, subject_type, subject_id, metadata) VALUES ($1, $2, $3, $4, $5)',
      [actorId, action, subjectType, subjectId || null, metadata || {}]
    );
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}