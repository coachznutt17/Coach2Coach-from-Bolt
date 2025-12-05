// Creator/Stripe Connect API routes

import { Router } from 'express';
import { stripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { requireActiveMember, requireCreator, logAuditEvent } from '../lib/api';

const router = Router();

// Create Stripe Connect account and onboarding link
router.post('/connect', async (req, res) => {
  try {
    const { userId } = req.body;

    // Verify user is active member
    const isActive = await requireActiveMember(userId);
    if (!isActive) {
      return res.status(403).json({ error: 'Active membership required to become a creator' });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Check if user already has Connect account
    if (profile.stripe_connect_id) {
      // Create account link for existing account
      const accountLink = await stripe.accountLinks.create({
        account: profile.stripe_connect_id,
        refresh_url: `${process.env.VITE_APP_URL}/seller-onboarding?refresh=true`,
        return_url: `${process.env.VITE_APP_URL}/seller-onboarding?success=true`,
        type: 'account_onboarding',
      });

      return res.json({ 
        accountId: profile.stripe_connect_id, 
        onboardingUrl: accountLink.url 
      });
    }

    // Create new Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email: profile.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_profile: {
        name: `${profile.first_name} ${profile.last_name}`,
        product_description: 'Coaching resources and training materials',
        support_email: profile.email,
      },
      metadata: {
        supabase_user_id: userId,
        profile_id: profile.id
      }
    });

    // Update profile with Connect account ID
    await supabase
      .from('profiles')
      .update({ stripe_connect_id: account.id })
      .eq('id', profile.id);

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.VITE_APP_URL}/seller-onboarding?refresh=true`,
      return_url: `${process.env.VITE_APP_URL}/seller-onboarding?success=true`,
      type: 'account_onboarding',
    });

    // Log audit event
    await logAuditEvent(userId, 'connect_account_created', 'connect_account', account.id);

    res.json({ 
      accountId: account.id, 
      onboardingUrl: accountLink.url 
    });
  } catch (error) {
    console.error('Error creating Connect account:', error);
    res.status(500).json({ error: 'Failed to create Connect account' });
  }
});

// Check Connect account status
router.get('/connect/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_id, is_creator_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile?.stripe_connect_id) {
      return res.json({ 
        hasAccount: false, 
        isEnabled: false,
        onboardingRequired: true 
      });
    }

    // Check account status with Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_connect_id);
    
    const isComplete = account.details_submitted && 
                     account.charges_enabled && 
                     account.payouts_enabled;

    // Update creator enabled status if onboarding is complete
    if (isComplete && !profile.is_creator_enabled) {
      await supabase
        .from('profiles')
        .update({ is_creator_enabled: true })
        .eq('user_id', userId);

      // Log audit event
      await logAuditEvent(userId, 'creator_enabled', 'profile', profile.id);
    }

    res.json({
      hasAccount: true,
      isEnabled: isComplete,
      onboardingRequired: !isComplete,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });
  } catch (error) {
    console.error('Error checking Connect status:', error);
    res.status(500).json({ error: 'Failed to check Connect status' });
  }
});

// Get Connect dashboard link
router.post('/connect/dashboard', async (req, res) => {
  try {
    const { userId } = req.body;

    const isCreator = await requireCreator(userId);
    if (!isCreator) {
      return res.status(403).json({ error: 'Creator account required' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile?.stripe_connect_id) {
      return res.status(400).json({ error: 'No Connect account found' });
    }

    const loginLink = await stripe.accounts.createLoginLink(profile.stripe_connect_id);

    res.json({ url: loginLink.url });
  } catch (error) {
    console.error('Error creating dashboard link:', error);
    res.status(500).json({ error: 'Failed to create dashboard link' });
  }
});

export default router;