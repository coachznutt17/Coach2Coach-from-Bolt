import { supabase } from './supabase';
import { query } from './db';

export interface Resource {
  id: string;
  coach_id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  is_listed: boolean;
  file_url: string;
  [key: string]: any;
}

export interface Profile {
  id: string;
  user_id: string;
  stripe_connect_id: string | null;
  stripe_onboarded: boolean;
  first_name: string;
  last_name: string;
  email: string;
  [key: string]: any;
}

export interface Purchase {
  id: string;
  buyer_id: string;
  resource_id: string;
  amount_cents: number;
  currency: string;
  payment_status: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  stripe_transfer_id: string | null;
  platform_fee_cents: number;
  created_at: string;
}

export class ResourceAdapter {
  static async getById(resourceId: string): Promise<Resource | null> {
    const result = await query(
      'SELECT * FROM resources WHERE id = $1',
      [resourceId]
    );
    return result.rows[0] || null;
  }

  static async getOwnerId(resourceId: string): Promise<string | null> {
    const result = await query(`
      SELECT p.user_id
      FROM resources r
      JOIN profiles p ON r.owner_id = p.id
      WHERE r.id = $1
    `, [resourceId]);
    return result.rows[0]?.user_id || null;
  }

  static getPriceCents(resource: Resource): number {
    return Math.round(Number(resource.price) * 100);
  }

  static isPublished(resource: Resource): boolean {
    return resource.status === 'active' && resource.is_listed === true;
  }

  static getStoragePath(resource: Resource): string {
    return resource.file_url;
  }
}

export class ProfileAdapter {
  static async getByUserId(userId: string): Promise<Profile | null> {
    const result = await query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  static async getById(profileId: string): Promise<Profile | null> {
    const result = await query(
      'SELECT * FROM profiles WHERE id = $1',
      [profileId]
    );
    return result.rows[0] || null;
  }

  static getStripeAccountId(profile: Profile): string | null {
    return profile.stripe_connect_id;
  }

  static isOnboarded(profile: Profile): boolean {
    return profile.stripe_onboarded === true && !!profile.stripe_connect_id;
  }

  static async setStripeAccount(
    userId: string,
    stripeAccountId: string,
    onboarded: boolean = false
  ): Promise<void> {
    await query(
      `UPDATE profiles
       SET stripe_connect_id = $1, stripe_onboarded = $2, updated_at = NOW()
       WHERE user_id = $3`,
      [stripeAccountId, onboarded, userId]
    );
  }

  static async markOnboarded(userId: string): Promise<void> {
    await query(
      `UPDATE profiles
       SET stripe_onboarded = true, updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
  }
}

export class PurchaseAdapter {
  static async upsertFree(buyerUserId: string, resourceId: string): Promise<Purchase> {
    const result = await query(`
      INSERT INTO purchases (
        buyer_id,
        resource_id,
        amount,
        amount_cents,
        currency,
        payment_status,
        status,
        commission_rate,
        coach_earnings,
        platform_fee,
        platform_fee_cents,
        created_at
      ) VALUES ($1, $2, 0, 0, 'usd', 'free', 'completed', 0, 0, 0, 0, NOW())
      ON CONFLICT (buyer_id, resource_id)
      DO UPDATE SET
        payment_status = 'free',
        status = 'completed',
        updated_at = NOW()
      RETURNING *
    `, [buyerUserId, resourceId]);

    return result.rows[0];
  }

  static async upsertPaid(
    buyerUserId: string,
    resourceId: string,
    data: {
      amount_cents: number;
      currency: string;
      payment_status: string;
      stripe_session_id: string;
      stripe_payment_intent: string;
      stripe_transfer_id?: string;
      platform_fee_cents: number;
    }
  ): Promise<Purchase> {
    const amountDollars = data.amount_cents / 100;
    const platformFeeDollars = data.platform_fee_cents / 100;
    const coachEarnings = amountDollars - platformFeeDollars;

    const result = await query(`
      INSERT INTO purchases (
        buyer_id,
        resource_id,
        amount,
        amount_cents,
        currency,
        payment_status,
        stripe_session_id,
        stripe_payment_intent,
        stripe_transfer_id,
        platform_fee,
        platform_fee_cents,
        coach_earnings,
        commission_rate,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'completed', NOW())
      ON CONFLICT (buyer_id, resource_id)
      DO UPDATE SET
        amount = $3,
        amount_cents = $4,
        currency = $5,
        payment_status = $6,
        stripe_session_id = $7,
        stripe_payment_intent = $8,
        stripe_transfer_id = $9,
        platform_fee = $10,
        platform_fee_cents = $11,
        coach_earnings = $12,
        status = 'completed',
        updated_at = NOW()
      RETURNING *
    `, [
      buyerUserId,
      resourceId,
      amountDollars,
      data.amount_cents,
      data.currency,
      data.payment_status,
      data.stripe_session_id,
      data.stripe_payment_intent,
      data.stripe_transfer_id || null,
      platformFeeDollars,
      data.platform_fee_cents,
      coachEarnings,
      platformFeeDollars / amountDollars
    ]);

    return result.rows[0];
  }

  static async userOwnsResource(buyerUserId: string, resourceId: string): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM purchases
       WHERE buyer_id = $1 AND resource_id = $2 AND status = 'completed'`,
      [buyerUserId, resourceId]
    );
    return result.rows.length > 0;
  }

  static async getBySessionId(sessionId: string): Promise<Purchase | null> {
    const result = await query(
      'SELECT * FROM purchases WHERE stripe_session_id = $1',
      [sessionId]
    );
    return result.rows[0] || null;
  }
}
