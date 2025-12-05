import { Router, Request, Response } from 'express';
import { config } from '../lib/config';
import { stripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { query } from '../lib/db';
import { ResourceAdapter, ProfileAdapter, PurchaseAdapter } from '../lib/adapters';

const router = Router();
// Simple health check for v2
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', source: 'v2.ts', time: new Date().toISOString() });
});

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

async function authenticate(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user.id;
}

function errorResponse(res: Response, code: number, message: string) {
  return res.status(code).json({ error: message, code });
}

router.get('/health', async (req: Request, res: Response) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, supabase: true, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Database connection failed' });
  }
});

router.post('/stripe/connect/link', async (req: Request, res: Response) => {
  try {
    const userId = await authenticate(req);
    if (!userId) {
      return errorResponse(res, 401, 'Login required');
    }

    const profile = await ProfileAdapter.getByUserId(userId);
    if (!profile) {
      return errorResponse(res, 404, 'Profile not found');
    }

    let accountId = ProfileAdapter.getStripeAccountId(profile);

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
        metadata: {
          user_id: userId,
          profile_id: profile.id
        }
      });
      accountId = account.id;
      await ProfileAdapter.setStripeAccount(userId, accountId, false);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${config.site.url}/onboarding/stripe/return?refresh=true`,
      return_url: `${config.site.url}/onboarding/stripe/return`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Error creating Connect link:', error);
    errorResponse(res, 500, error.message || 'Failed to create Connect link');
  }
});

router.post('/checkout/session', async (req: Request, res: Response) => {
  try {
    if (!config.features.enablePaid) {
      return errorResponse(res, 403, 'Paid features are not enabled');
    }

    const userId = await authenticate(req);
    if (!userId) {
      return errorResponse(res, 401, 'Login required');
    }

    const { resourceId } = req.body;
    if (!resourceId) {
      return errorResponse(res, 400, 'resourceId is required');
    }

    const resource = await ResourceAdapter.getById(resourceId);
    if (!resource) {
      return errorResponse(res, 404, 'Resource not found');
    }

    if (!ResourceAdapter.isPublished(resource)) {
      return errorResponse(res, 400, 'Resource is not available for purchase');
    }

    const priceCents = ResourceAdapter.getPriceCents(resource);
    if (priceCents <= 0) {
      return errorResponse(res, 400, 'This resource is free. Use /api/v2/purchase/free instead');
    }

    const ownerUserId = await ResourceAdapter.getOwnerId(resourceId);
    if (!ownerUserId) {
      return errorResponse(res, 500, 'Resource owner not found');
    }

    const ownerProfile = await ProfileAdapter.getByUserId(ownerUserId);
    if (!ownerProfile) {
      return errorResponse(res, 500, 'Seller profile not found');
    }

    if (!ProfileAdapter.isOnboarded(ownerProfile)) {
      return errorResponse(res, 422, 'Seller has not completed onboarding yet');
    }

    const stripeAccountId = ProfileAdapter.getStripeAccountId(ownerProfile);
    if (!stripeAccountId) {
      return errorResponse(res, 422, 'Seller has not connected their Stripe account');
    }

    const alreadyOwns = await PurchaseAdapter.userOwnsResource(userId, resourceId);
    if (alreadyOwns) {
      return errorResponse(res, 400, 'You already own this resource');
    }

    const platformFeeCents = Math.floor(priceCents * (config.stripe.connectAppFeeBps / 10000));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: resource.title,
            description: resource.description?.substring(0, 500) || ''
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: stripeAccountId,
        },
        metadata: {
          resourceId,
          buyerUserId: userId,
          ownerUserId
        }
      },
      success_url: `${config.site.url}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.site.url}/resource/${resourceId}`,
      metadata: {
        resourceId,
        buyerUserId: userId,
        ownerUserId
      }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    errorResponse(res, 500, error.message || 'Failed to create checkout session');
  }
});

router.post('/stripe/webhook', async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      return errorResponse(res, 400, 'Missing stripe-signature header');
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const { resourceId, buyerUserId } = session.metadata;

      if (!resourceId || !buyerUserId) {
        console.warn('Webhook missing metadata:', session.id);
        return res.json({ received: true });
      }

      const amountCents = session.amount_total;
      const currency = session.currency;
      const paymentIntentId = session.payment_intent;

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const transferId = (paymentIntent as any).transfer;
      const applicationFee = (paymentIntent as any).application_fee_amount || 0;

      await PurchaseAdapter.upsertPaid(buyerUserId, resourceId, {
        amount_cents: amountCents,
        currency,
        payment_status: 'paid',
        stripe_session_id: session.id,
        stripe_payment_intent: paymentIntentId,
        stripe_transfer_id: transferId,
        platform_fee_cents: applicationFee
      });

      console.log(`✅ Purchase recorded: ${buyerUserId} bought ${resourceId}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    errorResponse(res, 400, error.message || 'Webhook verification failed');
  }
});

router.post('/purchase/free', async (req: Request, res: Response) => {
  try {
    const userId = await authenticate(req);
    if (!userId) {
      return errorResponse(res, 401, 'Login required');
    }

    const { resourceId } = req.body;
    if (!resourceId) {
      return errorResponse(res, 400, 'resourceId is required');
    }

    const resource = await ResourceAdapter.getById(resourceId);
    if (!resource) {
      return errorResponse(res, 404, 'Resource not found');
    }

    if (!ResourceAdapter.isPublished(resource)) {
      return errorResponse(res, 400, 'Resource is not available');
    }

    const priceCents = ResourceAdapter.getPriceCents(resource);
    if (priceCents > 0) {
      return errorResponse(res, 400, 'This resource is not free. Use checkout to purchase');
    }

    const purchase = await PurchaseAdapter.upsertFree(userId, resourceId);

    res.json({ success: true, purchase });
  } catch (error: any) {
    console.error('Error creating free purchase:', error);
    errorResponse(res, 500, error.message || 'Failed to complete free purchase');
  }
});

router.post('/download-url', async (req: Request, res: Response) => {
  try {
    const userId = await authenticate(req);
    if (!userId) {
      return errorResponse(res, 401, 'Login required');
    }

    const { resourceId } = req.body;
    if (!resourceId) {
      return errorResponse(res, 400, 'resourceId is required');
    }

    const resource = await ResourceAdapter.getById(resourceId);
    if (!resource) {
      return errorResponse(res, 404, 'Resource not found');
    }

    const ownerUserId = await ResourceAdapter.getOwnerId(resourceId);
    const isOwner = ownerUserId === userId;
    const hasPurchased = await PurchaseAdapter.userOwnsResource(userId, resourceId);

    if (!isOwner && !hasPurchased) {
      return errorResponse(res, 403, 'You do not have access to this resource');
    }

    const storagePath = ResourceAdapter.getStoragePath(resource);
    if (!storagePath) {
      return errorResponse(res, 404, 'Resource file not found');
    }

    const pathParts = storagePath.split('/');
    let bucket = 'resources';
    let path = storagePath;

    if (storagePath.startsWith('http')) {
      res.json({ url: storagePath, expiresAt: null });
      return;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 300);

    if (error) {
      console.error('Error creating signed URL:', error);
      return errorResponse(res, 500, 'Failed to generate download link');
    }

    const expiresAt = new Date(Date.now() + 300 * 1000).toISOString();

    res.json({ url: data.signedUrl, expiresAt });
  } catch (error: any) {
    console.error('Error generating download URL:', error);
    errorResponse(res, 500, error.message || 'Failed to generate download URL');
  }
});

export default router;
