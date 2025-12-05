// Custom hook for membership management

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserMembership, MembershipStatus } from '../lib/membership';
import { getApiUrl } from '../lib/apiConfig';

export function useMembership() {
  const { user } = useAuth();
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadMembership();
    } else {
      setMembership(null);
      setLoading(false);
    }
  }, [user]);

  const loadMembership = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Try API first
      try {
        const response = await fetch(getApiUrl(`/api/membership/${user.id}`));
        const result = await response.json();

        if (result.data) {
          setMembership({
            membershipStatus: result.data.membership_status as MembershipStatus,
            membershipTrialEndsAt: result.data.membership_trial_ends_at,
            membershipCurrentPeriodEnd: result.data.membership_current_period_end,
            isCreatorEnabled: result.data.is_creator_enabled || false,
            stripeCustomerId: result.data.stripe_customer_id,
            stripeConnectId: result.data.stripe_connect_id
          });
          return;
        }
      } catch (apiError) {
        console.warn('API membership fetch failed, trying Supabase:', apiError);
      }

      // Fallback to Supabase
      if (supabase) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            membership_status,
            membership_trial_ends_at,
            membership_current_period_end,
            is_creator_enabled,
            stripe_customer_id,
            stripe_connect_id
          `)
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (profile) {
          setMembership({
            membershipStatus: profile.membership_status as MembershipStatus,
            membershipTrialEndsAt: profile.membership_trial_ends_at,
            membershipCurrentPeriodEnd: profile.membership_current_period_end,
            isCreatorEnabled: profile.is_creator_enabled,
            stripeCustomerId: profile.stripe_customer_id,
            stripeConnectId: profile.stripe_connect_id
          });
          return;
        }
      }

      // No membership found
      console.warn('No membership data found');
      setMembership({
        membershipStatus: 'none',
        isCreatorEnabled: false
      });
    } catch (err) {
      console.error('Error loading membership:', err);
      setError(err instanceof Error ? err.message : 'Failed to load membership');

      // No fallback - set to none
      setMembership({
        membershipStatus: 'none',
        isCreatorEnabled: false
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshMembership = () => {
    if (user) {
      loadMembership();
    }
  };

  return {
    membership,
    loading,
    error,
    refreshMembership
  };
}