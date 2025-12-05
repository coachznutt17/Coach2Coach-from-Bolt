/*
  # Update Referral System for 3-Month Discount

  1. New Fields
    - `referral_discount_expires_at` (timestamptz) - When the 3-month discount expires
    - Update existing `referral_discount_active` logic to check expiration

  2. Changes
    - Referral discount is now limited to 3 months instead of forever
    - Add expiration tracking for automatic discount removal
*/

-- Add referral discount expiration field
DO $$
BEGIN
  -- Add referral_discount_expires_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'referral_discount_expires_at'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN referral_discount_expires_at timestamptz;
  END IF;
END $$;

-- Create function to check if referral discount is currently active
CREATE OR REPLACE FUNCTION is_referral_discount_active(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT 
      referral_discount_active = true 
      AND (referral_discount_expires_at IS NULL OR referral_discount_expires_at > now())
    FROM auth.users 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to expire referral discounts
CREATE OR REPLACE FUNCTION expire_referral_discounts()
RETURNS void AS $$
BEGIN
  UPDATE auth.users 
  SET referral_discount_active = false
  WHERE referral_discount_active = true 
    AND referral_discount_expires_at IS NOT NULL 
    AND referral_discount_expires_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;