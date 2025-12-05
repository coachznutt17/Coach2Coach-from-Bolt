/*
  # Add Stripe Membership Fields to Users Table

  1. User Extensions
    - Add Stripe customer ID for subscription management
    - Add membership status tracking (TRIAL, ACTIVE, PAST_DUE, CANCELED)
    - Add membership period tracking
    - Add Stripe Connect account ID for sellers
    - Add referral system fields
    - Add first payment tracking

  2. Security
    - These fields will be managed by server-side code with service role key
    - Client-side access controlled via RLS policies
*/

-- Add Stripe and membership fields to auth.users table
DO $$
BEGIN
  -- Add stripe_customer_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN stripe_customer_id text;
  END IF;

  -- Add membership_status if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'membership_status'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN membership_status text CHECK (membership_status IN ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED')) DEFAULT 'TRIAL';
  END IF;

  -- Add membership_current_period_end if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'membership_current_period_end'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN membership_current_period_end timestamptz;
  END IF;

  -- Add stripe_connect_account_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'stripe_connect_account_id'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN stripe_connect_account_id text;
  END IF;

  -- Add referred_by_user_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'referred_by_user_id'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN referred_by_user_id uuid REFERENCES auth.users(id);
  END IF;

  -- Add referral_qualified_count if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'referral_qualified_count'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN referral_qualified_count integer DEFAULT 0;
  END IF;

  -- Add referral_discount_active if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'referral_discount_active'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN referral_discount_active boolean DEFAULT false;
  END IF;

  -- Add first_paid_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'first_paid_at'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN first_paid_at timestamptz;
  END IF;
END $$;

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('DECLARED', 'QUALIFIED', 'REJECTED')) DEFAULT 'DECLARED',
  qualified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(referrer_user_id, referred_user_id)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price_cents integer NOT NULL,
  seller_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_active boolean DEFAULT true,
  file_ref text NOT NULL,
  sports text[] DEFAULT '{}',
  levels text[] DEFAULT '{}',
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  amount_cents integer NOT NULL,
  fee_cents integer NOT NULL,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  status text CHECK (status IN ('SUCCEEDED', 'CANCELED', 'REFUNDED')) DEFAULT 'SUCCEEDED',
  created_at timestamptz DEFAULT now()
);

-- Create webhook_event_log table
CREATE TABLE IF NOT EXISTS webhook_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  stripe_event_id text UNIQUE NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_event_log ENABLE ROW LEVEL SECURITY;

-- Policies for referrals
CREATE POLICY "Users can read their own referrals"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "Users can create referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

-- Policies for products
CREATE POLICY "Anyone can read active products"
  ON products
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Sellers can manage their own products"
  ON products
  FOR ALL
  TO authenticated
  USING (seller_user_id = auth.uid())
  WITH CHECK (seller_user_id = auth.uid());

-- Policies for orders
CREATE POLICY "Users can read their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (buyer_user_id = auth.uid());

CREATE POLICY "Sellers can read orders for their products"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    product_id IN (
      SELECT id FROM products WHERE seller_user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_event_log(type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_event_log(stripe_event_id);

-- Create triggers for updated_at
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();