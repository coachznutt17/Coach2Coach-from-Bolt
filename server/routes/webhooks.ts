// Stripe webhook handlers for membership lifecycle

import { Router } from 'express';
import { stripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { logAuditEvent } from '../lib/api';

const router = Router();

// Stripe webhook endpoint
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: any;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  try {
    // Log all webhook events
    await supabase
      .from('webhook_event_log')
      .insert({
        type: event.type,
        stripe_event_id: event.id,
        payload: event.data,
        processed: false
      });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
    }

    // Mark event as processed
    await supabase
      .from('webhook_event_log')
      .update({ processed: true })
      .eq('stripe_event_id', event.id);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Webhook handler functions
async function handleCheckoutCompleted(session: any) {
  if (session.mode === 'subscription') {
    // Membership subscription
    const userId = session.metadata?.user_id;
    const profileId = session.metadata?.profile_id;
    
    if (userId && profileId) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      // Calculate trial end date
      let trialEndsAt = null;
      let status = 'active';
      
      if (subscription.trial_end) {
        trialEndsAt = new Date(subscription.trial_end * 1000).toISOString();
        status = 'trial';
      }

      await supabase
        .from('profiles')
        .update({
          stripe_customer_id: session.customer,
          membership_status: status,
          membership_trial_ends_at: trialEndsAt,
          membership_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          is_creator_enabled: true
        })
        .eq('id', profileId);

      // Log audit event
      await logAuditEvent(userId, 'subscription_activated', 'subscription', session.subscription, {
        status,
        trial_ends_at: trialEndsAt
      });
    }
  } else if (session.mode === 'payment') {
    // Resource purchase
    const resourceId = session.metadata?.resource_id;
    const buyerUserId = session.metadata?.buyer_user_id;
    const buyerProfileId = session.metadata?.buyer_profile_id;

    if (resourceId && buyerProfileId) {
      const { data: existing } = await supabase
        .from('purchases')
        .select('id')
        .eq('buyer_id', buyerProfileId)
        .eq('resource_id', resourceId)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from('purchases')
          .insert({
            buyer_id: buyerProfileId,
            resource_id: resourceId,
            amount: session.amount_total / 100,
            amount_cents: session.amount_total,
            currency: session.currency || 'usd',
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent,
            status: 'completed',
            payment_status: 'paid'
          });

        if (buyerUserId) {
          await logAuditEvent(buyerUserId, 'resource_purchased', 'resource', resourceId, {
            amount_cents: session.amount_total,
            session_id: session.id
          });
        }
      }
    }
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  const customerId = invoice.customer;
  
  // Find profile by customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) return;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  
  // Update to active status
  await supabase
    .from('profiles')
    .update({
      membership_status: 'active',
      membership_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      membership_trial_ends_at: null // Clear trial end date
    })
    .eq('id', profile.id);

  // Log audit event
  await logAuditEvent(profile.user_id, 'subscription_payment_succeeded', 'subscription', subscription.id);
}

async function handleInvoicePaymentFailed(invoice: any) {
  const customerId = invoice.customer;
  
  // Update to past_due status
  const { data: profile } = await supabase
    .from('profiles')
    .update({ membership_status: 'past_due' })
    .eq('stripe_customer_id', customerId)
    .select('user_id')
    .single();

  if (profile) {
    await logAuditEvent(profile.user_id, 'subscription_payment_failed', 'subscription', invoice.id);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  const customerId = subscription.customer;
  
  let status = 'active';
  if (subscription.status === 'trialing') status = 'trial';
  else if (subscription.status === 'past_due') status = 'past_due';
  else if (subscription.status === 'canceled') status = 'canceled';

  const { data: profile } = await supabase
    .from('profiles')
    .update({
      membership_status: status,
      membership_current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('stripe_customer_id', customerId)
    .select('user_id')
    .single();

  if (profile) {
    await logAuditEvent(profile.user_id, 'subscription_updated', 'subscription', subscription.id, {
      status,
      period_end: subscription.current_period_end
    });
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer;
  
  const { data: profile } = await supabase
    .from('profiles')
    .update({ membership_status: 'canceled' })
    .eq('stripe_customer_id', customerId)
    .select('user_id')
    .single();

  if (profile) {
    await logAuditEvent(profile.user_id, 'subscription_canceled', 'subscription', subscription.id);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const { resource_id, buyer_user_id } = paymentIntent.metadata;
  
  if (resource_id && buyer_user_id) {
    // Get buyer profile
    const { data: buyer } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', buyer_user_id)
      .single();

    if (buyer) {
      // Create purchase record
      await supabase
        .from('purchases')
        .insert({
          buyer_id: buyer.id,
          resource_id,
          amount_cents: paymentIntent.amount,
          stripe_payment_intent_id: paymentIntent.id,
          status: 'succeeded'
        });

      // Log audit event
      await logAuditEvent(buyer_user_id, 'resource_purchased', 'resource', resource_id, {
        amount_cents: paymentIntent.amount,
        payment_intent_id: paymentIntent.id
      });
    }
  }
}

export default router;