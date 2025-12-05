// Purchase API routes with membership gating

import { Router } from 'express';
import { query } from '../lib/db';
import { stripe, calculatePlatformFee } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { requireActiveMember, logAuditEvent } from '../lib/api';

const router = Router();

// Free purchase endpoint for MVP testing (no Stripe required)
router.post('/free', async (req, res) => {
  try {
    const { userId, resourceId } = req.body;

    if (!userId || !resourceId) {
      return res.status(400).json({ error: 'userId and resourceId required' });
    }

    // Check if resource exists
    const resourceCheck = await query(
      'SELECT id, price, coach_id, status FROM resources WHERE id = $1',
      [resourceId]
    );

    if (resourceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const resource = resourceCheck.rows[0];

    if (resource.status !== 'active') {
      return res.status(400).json({ error: 'Resource not available for purchase' });
    }

    // Check if already purchased
    const existingPurchase = await query(
      'SELECT id FROM purchases WHERE user_id = $1 AND resource_id = $2',
      [userId, resourceId]
    );

    if (existingPurchase.rows.length > 0) {
      return res.status(400).json({ error: 'Resource already purchased' });
    }

    // Create free purchase record
    const result = await query(
      `INSERT INTO purchases (
        user_id, resource_id, amount, status, created_at
      ) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [userId, resourceId, 0, 'completed']
    );

    res.json({
      data: result.rows[0],
      error: null,
      message: 'Free purchase completed successfully'
    });
  } catch (error: any) {
    console.error('Error creating free purchase:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Create resource purchase checkout session
router.post('/', async (req, res) => {
  try {
    const { userId, resourceId } = req.body;

    // Verify user is active member
    const isActive = await requireActiveMember(userId);
    if (!isActive) {
      return res.status(403).json({ error: 'Active membership required to purchase resources' });
    }

    // Get buyer profile
    const { data: buyer } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id, email')
      .eq('user_id', userId)
      .single();

    if (!buyer) {
      return res.status(404).json({ error: 'Buyer profile not found' });
    }

    // Get resource and seller info
    const { data: resource } = await supabase
      .from('resources')
      .select(`
        *,
        owner:profiles!inner(stripe_connect_id, first_name, last_name)
      `)
      .eq('id', resourceId)
      .eq('is_listed', true)
      .eq('status', 'active')
      .single();

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found or not available' });
    }

    // Check if user already owns this resource
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('buyer_id', buyer.id)
      .eq('resource_id', resourceId)
      .maybeSingle();

    if (existingPurchase) {
      return res.status(400).json({ error: 'You already own this resource' });
    }

    const sellerConnectId = resource.owner.stripe_connect_id;
    if (!sellerConnectId) {
      return res.status(400).json({ error: 'Seller has not completed onboarding' });
    }

    // Calculate platform fee (15%)
    const applicationFeeAmount = calculatePlatformFee(resource.price_cents);

    // Create checkout session with Connect transfer
    const session = await stripe.checkout.sessions.create({
      customer: buyer.stripe_customer_id,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: resource.title,
            description: resource.description,
            metadata: {
              resource_id: resourceId,
              seller_name: `${resource.owner.first_name} ${resource.owner.last_name}`
            }
          },
          unit_amount: resource.price_cents,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: sellerConnectId,
        },
        metadata: {
          resource_id: resourceId,
          buyer_user_id: userId,
          seller_connect_id: sellerConnectId
        }
      },
      success_url: `${process.env.VITE_APP_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}&resource_id=${resourceId}`,
      cancel_url: `${process.env.VITE_APP_URL}/browse`,
      metadata: {
        resource_id: resourceId,
        buyer_user_id: userId,
        buyer_profile_id: buyer.id
      }
    });

    // Log audit event
    await logAuditEvent(userId, 'purchase_checkout_created', 'resource', resourceId, {
      amount_cents: resource.price_cents,
      seller_connect_id: sellerConnectId
    });

    res.json({ 
      success: true, 
      sessionId: session.id, 
      checkoutUrl: session.url 
    });
  } catch (error) {
    console.error('Error creating purchase checkout:', error);
    res.status(500).json({ error: 'Failed to create purchase checkout' });
  }
});

export default router;