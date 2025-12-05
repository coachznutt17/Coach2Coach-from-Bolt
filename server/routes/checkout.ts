// Stripe Checkout routes for resource purchases and subscriptions

import { Router } from 'express';
import { stripe, PLATFORM_FEE_PERCENT, MEMBERSHIP_PRICE_ID } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { logAuditEvent } from '../lib/api';

const router = Router();

// Create checkout session for resource purchase
router.post('/resource', async (req, res) => {
  try {
    const { userId, resourceId } = req.body;

    if (!userId || !resourceId) {
      return res.status(400).json({ error: 'userId and resourceId required' });
    }

    // Get buyer profile
    const { data: buyer, error: buyerError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id, email, membership_status')
      .eq('user_id', userId)
      .maybeSingle();

    if (buyerError || !buyer) {
      return res.status(404).json({ error: 'Buyer profile not found' });
    }

    // Verify membership
    if (!['trial', 'active'].includes(buyer.membership_status)) {
      return res.status(403).json({ error: 'Active membership required to purchase resources' });
    }

    // Get resource and owner
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select(`
        *,
        owner:profiles!owner_id(id, stripe_connect_id, first_name, last_name)
      `)
      .eq('id', resourceId)
      .eq('is_listed', true)
      .eq('status', 'active')
      .single();

    if (resourceError || !resource) {
      return res.status(404).json({ error: 'Resource not found or not available' });
    }

    // Check if already purchased
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('buyer_id', buyer.id)
      .eq('resource_id', resourceId)
      .maybeSingle();

    if (existingPurchase) {
      return res.status(400).json({ error: 'You already own this resource' });
    }

    // Calculate platform fee (15% = 1500 basis points)
    const applicationFeeAmount = Math.round(resource.price_cents * (PLATFORM_FEE_PERCENT));

    // Create or get Stripe customer
    let customerId = buyer.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: buyer.email,
        metadata: { user_id: userId, profile_id: buyer.id }
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', buyer.id);
    }

    // Create checkout session
    const sessionParams: any = {
      customer: customerId,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: resource.title,
            description: resource.description?.substring(0, 500),
          },
          unit_amount: resource.price_cents,
        },
        quantity: 1,
      }],
      success_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/purchase-success?session_id={CHECKOUT_SESSION_ID}&resource_id=${resourceId}`,
      cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/browse`,
      metadata: {
        resource_id: resourceId,
        buyer_user_id: userId,
        buyer_profile_id: buyer.id
      }
    };

    // Add Connect transfer if seller has Connect account
    if (resource.owner.stripe_connect_id) {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: resource.owner.stripe_connect_id,
        },
        metadata: {
          resource_id: resourceId,
          buyer_user_id: userId,
          seller_connect_id: resource.owner.stripe_connect_id
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    await logAuditEvent(userId, 'checkout_created', 'resource', resourceId, {
      amount_cents: resource.price_cents,
      session_id: session.id
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error: any) {
    console.error('Error creating resource checkout:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
});

// Create checkout session for membership subscription
router.post('/subscription', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Create or get Stripe customer
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: `${profile.first_name} ${profile.last_name}`,
        metadata: { user_id: userId, profile_id: profile.id }
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', profile.id);
    }

    // Determine if user should get trial (7 days)
    const shouldGetTrial = ['none', 'canceled'].includes(profile.membership_status);

    const sessionParams: any = {
      customer: customerId,
      mode: 'subscription',
      line_items: [{
        price: MEMBERSHIP_PRICE_ID,
        quantity: 1,
      }],
      success_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/pricing`,
      metadata: {
        user_id: userId,
        profile_id: profile.id
      }
    };

    // Add 7-day trial if eligible
    if (shouldGetTrial) {
      sessionParams.subscription_data = {
        trial_period_days: 7,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    await logAuditEvent(userId, 'subscription_checkout_created', 'subscription', session.id);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error: any) {
    console.error('Error creating subscription checkout:', error);
    res.status(500).json({ error: error.message || 'Failed to create subscription checkout' });
  }
});

export default router;
