/*
  # Update Referral System for 3-Month Discount

  1. New Fields
    - `referral_discount_expires_at` (timestamptz) - When the 3-month discount expires
    - Update existing `referral_discount_active` logic to check expiration

  2. Changes
    - Referral discount is now limited to 3 months instead of forever
    - Add expiration tracking for automatic discount removal
*/

-- Create function to check if referral discount is currently active
CREATE OR REPLACE FUNCTION is_referral_discount_active(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT 
      referral_discount_active = true 
      AND (referral_discount_expires_at IS NULL OR referral_discount_expires_at > now())
    FROM profiles 
    WHERE user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to expire referral discounts
CREATE OR REPLACE FUNCTION expire_referral_discounts()
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET referral_discount_active = false
  WHERE referral_discount_active = true 
    AND referral_discount_expires_at IS NOT NULL 
    AND referral_discount_expires_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;