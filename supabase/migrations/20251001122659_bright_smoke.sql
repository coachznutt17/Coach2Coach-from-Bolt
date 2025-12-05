/*
  # Membership Gating & Access Control System

  1. New Tables
    - `profiles` - Extended user profiles with membership tracking
    - `resources` - Creator resources with storage paths
    - `purchases` - Purchase tracking with Stripe data
    - `audit_events` - Security and compliance logging

  2. Membership Status Tracking
    - Stripe customer ID and Connect account mapping
    - Trial period and billing cycle tracking
    - Creator enablement flags

  3. Security
    - Enable RLS on all tables
    - Strict access control policies
    - Audit logging for all actions
*/

-- Create profiles table with membership tracking
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stripe_customer_id text,
  membership_status text CHECK (membership_status IN ('none', 'trial', 'active', 'past_due', 'canceled')) DEFAULT 'none',
  membership_trial_ends_at timestamptz,
  membership_current_period_end timestamptz,
  is_creator_enabled boolean DEFAULT false,
  stripe_connect_id text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  title text DEFAULT '',
  bio text DEFAULT '',
  location text DEFAULT '',
  years_experience text DEFAULT '',
  sports text[] DEFAULT '{}',
  levels text[] DEFAULT '{}',
  specialties text[] DEFAULT '{}',
  achievements text[] DEFAULT '{}',
  website text DEFAULT '',
  social_links jsonb DEFAULT '{}',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create resources table with storage paths
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  sports text[] DEFAULT '{}',
  levels text[] DEFAULT '{}',
  category text NOT NULL,
  storage_path_original text NOT NULL,
  storage_path_preview text,
  is_listed boolean DEFAULT false,
  downloads integer DEFAULT 0,
  rating decimal(3,2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE NOT NULL,
  amount_cents integer NOT NULL,
  stripe_payment_intent_id text NOT NULL,
  status text DEFAULT 'succeeded' CHECK (status IN ('succeeded', 'canceled', 'refunded')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, resource_id)
);

-- Create audit_events table
CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  subject_type text NOT NULL,
  subject_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for resources (strict membership gating)
CREATE POLICY "Anyone can read listed resource metadata"
  ON resources
  FOR SELECT
  TO authenticated
  USING (is_listed = true AND status = 'active');

CREATE POLICY "Owners can read their own resources"
  ON resources
  FOR SELECT
  TO authenticated
  USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Active members can create resources"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid() 
      AND membership_status = 'active'
      AND is_creator_enabled = true
    )
  );

CREATE POLICY "Owners can update their own resources"
  ON resources
  FOR UPDATE
  TO authenticated
  USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Policies for purchases (active members only)
CREATE POLICY "Users can read their own purchases"
  ON purchases
  FOR SELECT
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Resource owners can read purchases of their resources"
  ON purchases
  FOR SELECT
  TO authenticated
  USING (
    resource_id IN (
      SELECT r.id FROM resources r
      JOIN profiles p ON r.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Active members can create purchases"
  ON purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid() 
      AND membership_status = 'active'
    )
  );

-- Policies for audit_events
CREATE POLICY "Users can read their own audit events"
  ON audit_events
  FOR SELECT
  TO authenticated
  USING (actor_id = auth.uid());

CREATE POLICY "System can insert audit events"
  ON audit_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_status ON profiles(membership_status);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_resources_owner_id ON resources(owner_id);
CREATE INDEX IF NOT EXISTS idx_resources_listed_active ON resources(is_listed, status);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_resource_id ON purchases(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper functions for membership checks
CREATE OR REPLACE FUNCTION is_active_member(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = user_uuid 
    AND membership_status = 'active'
    AND (membership_current_period_end IS NULL OR membership_current_period_end > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_trial_member(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = user_uuid 
    AND membership_status = 'trial'
    AND (membership_trial_ends_at IS NULL OR membership_trial_ends_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_upload_resources(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = user_uuid 
    AND membership_status = 'active'
    AND is_creator_enabled = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  actor_uuid uuid,
  action_text text,
  subject_type_text text,
  subject_uuid uuid DEFAULT NULL,
  metadata_json jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO audit_events (actor_id, action, subject_type, subject_id, metadata)
  VALUES (actor_uuid, action_text, subject_type_text, subject_uuid, metadata_json)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;