/*
  # MVP Payment Fields - Additive Only

  1. Profiles Table Enhancements
    - Add `stripe_onboarded` boolean to track Connect onboarding completion
    - NOTE: stripe_connect_id already exists, no changes needed

  2. Purchases Table Enhancements
    - Add `payment_status` text for tracking payment state (free/paid/refunded)
    - Add `currency` text for multi-currency support
    - Add `stripe_session_id` text for webhook idempotency
    - Add `stripe_payment_intent` text for Stripe reference
    - Add `stripe_transfer_id` text for Connect transfer tracking
    - Add `amount_cents` int for precise cent-based amounts
    - Add `platform_fee_cents` int for platform fee tracking
    - Add UNIQUE constraint on (buyer_id, resource_id) for idempotent purchases
    - Add index on stripe_session_id for fast webhook lookups

  3. Security
    - All changes are ADDITIVE - no DROP or RENAME operations
    - Existing RLS policies remain intact
    - Default values ensure backward compatibility

  ## Important Notes
  - This migration is safe to run multiple times (IF NOT EXISTS)
  - All existing data remains unchanged
  - New columns have sensible defaults
  - Unique constraint prevents duplicate purchases
*/

-- Add stripe_onboarded to profiles (stripe_connect_id already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_onboarded'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_onboarded boolean DEFAULT false;
  END IF;
END $$;

-- Add payment tracking fields to purchases
DO $$
BEGIN
  -- payment_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE purchases ADD COLUMN payment_status text DEFAULT 'free';
  END IF;

  -- currency
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'currency'
  ) THEN
    ALTER TABLE purchases ADD COLUMN currency text DEFAULT 'usd';
  END IF;

  -- stripe_session_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE purchases ADD COLUMN stripe_session_id text;
  END IF;

  -- stripe_payment_intent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'stripe_payment_intent'
  ) THEN
    ALTER TABLE purchases ADD COLUMN stripe_payment_intent text;
  END IF;

  -- stripe_transfer_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'stripe_transfer_id'
  ) THEN
    ALTER TABLE purchases ADD COLUMN stripe_transfer_id text;
  END IF;

  -- amount_cents
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'amount_cents'
  ) THEN
    ALTER TABLE purchases ADD COLUMN amount_cents int DEFAULT 0;
  END IF;

  -- platform_fee_cents
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'platform_fee_cents'
  ) THEN
    ALTER TABLE purchases ADD COLUMN platform_fee_cents int DEFAULT 0;
  END IF;
END $$;

-- Add unique constraint for idempotent purchases (IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'purchases_buyer_resource_unique'
  ) THEN
    ALTER TABLE purchases ADD CONSTRAINT purchases_buyer_resource_unique UNIQUE (buyer_id, resource_id);
  END IF;
END $$;

-- Add index on stripe_session_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session ON purchases(stripe_session_id);

-- Add index on buyer_id + created_at for user purchase history
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_created ON purchases(buyer_id, created_at DESC);