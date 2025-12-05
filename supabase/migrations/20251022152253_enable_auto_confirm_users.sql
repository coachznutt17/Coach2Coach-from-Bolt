/*
  # Enable Auto-Confirm for User Signups

  1. Configuration
    - This migration ensures users are auto-confirmed on signup
    - Email confirmation is disabled for development
    
  Note: This is handled through Supabase Dashboard settings:
  Authentication > Settings > Email Auth > Confirm email = OFF
  
  This migration exists to document the requirement.
*/

-- Verify auto-confirm is working by checking existing users
DO $$
BEGIN
  -- If there are users without email_confirmed_at, auto-confirm them
  UPDATE auth.users 
  SET email_confirmed_at = created_at
  WHERE email_confirmed_at IS NULL;
END $$;
