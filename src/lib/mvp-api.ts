import { supabase } from './supabase';
import { getApiUrl } from './apiConfig';

const ENABLE_PAID = import.meta.env.VITE_ENABLE_PAID === 'true';

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(getApiUrl(`/api/v2${endpoint}`), {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

export const mvpApi = {
  isPaidEnabled: () => ENABLE_PAID,

  health: async () => {
    return apiCall('/health');
  },

  createConnectLink: async () => {
    return apiCall('/stripe/connect/link', { method: 'POST' });
  },

  createCheckoutSession: async (resourceId: string) => {
    if (!ENABLE_PAID) {
      throw new Error('Paid features are not enabled');
    }
    return apiCall('/checkout/session', {
      method: 'POST',
      body: JSON.stringify({ resourceId }),
    });
  },

  purchaseFree: async (resourceId: string) => {
    return apiCall('/purchase/free', {
      method: 'POST',
      body: JSON.stringify({ resourceId }),
    });
  },

  getDownloadUrl: async (resourceId: string) => {
    return apiCall('/download-url', {
      method: 'POST',
      body: JSON.stringify({ resourceId }),
    });
  },
};

export function isPaidFeatureEnabled(): boolean {
  return ENABLE_PAID;
}
