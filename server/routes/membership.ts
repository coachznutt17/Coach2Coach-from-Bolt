// Membership API routes

import { Router } from 'express';
import { query } from '../lib/db';
import { stripe } from '../lib/stripe';
import { requireActiveMember, logAuditEvent } from '../lib/api';

const router = Router();

// Get user membership status
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(`
      SELECT
        membership_status,
        membership_trial_ends_at,
        membership_current_period_end,
        is_creator_enabled,
        stripe_customer_id,
        stripe_connect_id
      FROM profiles
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ data: result.rows[0], error: null });
  } catch (error: any) {
    console.error('Error fetching membership:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create subscription checkout session
router.post('/checkout/subscription', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Create or get Stripe customer
    let customerId = profile.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: `${profile.first_name} ${profile.last_name}`,
        metadata: { 
          supabase_user_id: userId,
          profile_id: profile.id
        }
      });
      customerId = customer.id;

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', profile.id);
    }

    // Determine if user should get trial
    const shouldGetTrial = profile.membership_status === 'none' || 
                          profile.membership_status === 'canceled';

    // Create checkout session
    const sessionData: any = {
      customer: customerId,
      mode: 'subscription',
      line_items: [{
        price: process.env.MEMBERSHIP_PRICE_ID!,
        quantity: 1,
      }],
      success_url: `${process.env.VITE_APP_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL}/pricing`,
      metadata: {
        user_id: userId,
        profile_id: profile.id
      }
    };

    // Add trial if eligible
    if (shouldGetTrial) {
      sessionData.subscription_data = {
        trial_period_days: 7,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    // Log audit event
    await logAuditEvent(userId, 'subscription_checkout_created', 'subscription', session.id);

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating subscription checkout:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create billing portal session
router.post('/portal', async (req, res) => {
  try {
    const { userId } = req.body;

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.VITE_APP_URL}/account`,
    });

    // Log audit event
    await logAuditEvent(userId, 'billing_portal_accessed', 'subscription');

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

export default router;