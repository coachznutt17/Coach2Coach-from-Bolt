// API utilities for Coach2Coach platform with membership gating

import { supabase } from './supabase';
import { getApiUrl } from './apiConfig';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Get auth headers for API requests
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();

  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      'Authorization': `Bearer ${session.access_token}`
    })
  };
}

// Generic API fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(getApiUrl(endpoint), {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network request failed',
    };
  }
}

// Server-side membership verification
export async function requireActiveMember(userId: string): Promise<boolean> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('membership_status, membership_current_period_end')
      .eq('user_id', userId)
      .single();

    if (!profile) return false;

    if (profile.membership_status === 'active') {
      // Check if period hasn't ended
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

// Server-side creator verification
export async function requireCreator(userId: string): Promise<boolean> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('membership_status, is_creator_enabled')
      .eq('user_id', userId)
      .single();

    if (!profile) return false;

    return profile.membership_status === 'active' && profile.is_creator_enabled;
  } catch (error) {
    console.error('Error checking creator status:', error);
    return false;
  }
}

// Check if user can download a specific resource
export async function canDownloadResource(userId: string, resourceId: string): Promise<boolean> {
  try {
    // Check if user is active member
    const isActive = await requireActiveMember(userId);
    if (!isActive) return false;

    // Check if user owns the resource
    const { data: resource } = await supabase
      .from('resources')
      .select(`
        owner_id,
        profiles!inner(user_id)
      `)
      .eq('id', resourceId)
      .single();

    if (resource?.profiles.user_id === userId) {
      return true; // Owner can always download
    }

    // Check if user has purchased the resource
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('buyer_id', userId)
      .eq('resource_id', resourceId)
      .eq('status', 'succeeded')
      .single();

    return !!purchase;
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
    await supabase
      .from('audit_events')
      .insert({
        actor_id: actorId,
        action,
        subject_type: subjectType,
        subject_id: subjectId,
        metadata: metadata || {}
      });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

// API endpoint helpers
export const api = {
  // Create membership checkout session
  createSubscriptionCheckout: async (userId: string): Promise<ApiResponse<{ url: string }>> => {
    return apiFetch('/api/checkout/subscription', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  // Create billing portal session
  createBillingPortal: async (userId: string): Promise<ApiResponse<{ url: string }>> => {
    return apiFetch('/api/membership/portal', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  // Create Stripe Connect account
  createConnectAccount: async (userId: string): Promise<ApiResponse<{ accountId: string; onboardingUrl: string }>> => {
    return apiFetch('/api/creator/connect', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  // Upload resource
  uploadResource: async (resourceData: any): Promise<ApiResponse<{ resourceId: string }>> => {
    return apiFetch('/api/resources', {
      method: 'POST',
      body: JSON.stringify(resourceData)
    });
  },

  // Create resource purchase
  purchaseResource: async (resourceId: string): Promise<ApiResponse<{ checkoutUrl: string }>> => {
    return apiFetch('/api/purchase', {
      method: 'POST',
      body: JSON.stringify({ resourceId })
    });
  },

  // Get secure download URL
  getDownloadUrl: async (resourceId: string): Promise<ApiResponse<{ downloadUrl: string; filename: string }>> => {
    return apiFetch(`/api/download/${resourceId}`, {
      method: 'GET'
    });
  }
};