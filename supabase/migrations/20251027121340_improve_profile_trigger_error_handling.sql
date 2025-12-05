/*
  # Improve Profile Trigger Error Handling

  1. Changes
    - Adds comprehensive error handling to profile creation trigger
    - Logs errors to database instead of failing silently
    - Ensures trigger doesn't block user signup even if profile creation fails

  2. Security
    - Maintains SECURITY DEFINER for RLS bypass
    - Adds error logging for debugging
*/

-- Create error log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.trigger_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_name text NOT NULL,
  error_message text,
  error_detail text,
  user_id uuid,
  created_at timestamptz DEFAULT NOW()
);

-- Update function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (
      user_id,
      email,
      first_name,
      last_name,
      title,
      location,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'title', ''),
      COALESCE(NEW.raw_user_meta_data->>'location', ''),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Profile created successfully for user %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    INSERT INTO public.trigger_error_logs (trigger_name, error_message, error_detail, user_id)
    VALUES ('handle_new_user', SQLERRM, SQLSTATE, NEW.id);
    
    RAISE NOTICE 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on error log table
ALTER TABLE public.trigger_error_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert error logs
CREATE POLICY "Service can insert error logs"
  ON public.trigger_error_logs
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view their own error logs
CREATE POLICY "Users can view own error logs"
  ON public.trigger_error_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);