/*
  # Fix Profiles Schema - Transform to MVP Structure

  1. Schema Changes
    - Rename profiles.username → Remove (deprecated)
    - Add profiles.user_id (uuid, unique, references auth.users)
    - Add profiles.email (text, unique)
    - Add profiles.first_name (text)
    - Add profiles.last_name (text)
    - Keep existing: bio, avatar_url, is_verified, created_at, updated_at
    - Add profiles.is_creator_enabled (boolean, default false)
    - Add profiles.membership_status (text, default 'inactive')
    
  2. Data Safety
    - Uses IF NOT EXISTS to safely add columns
    - Preserves all existing data
    - No DROP operations on data columns
    
  3. Purpose
    - Align profiles table with MVP requirements
    - Support auto-profile-creation trigger
*/

-- 1. Add user_id column (critical for auth linkage)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Add email column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;
END $$;

-- 3. Add first_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;
END $$;

-- 4. Add last_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;
END $$;

-- 5. Add is_creator_enabled column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_creator_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_creator_enabled boolean DEFAULT false;
  END IF;
END $$;

-- 6. Add membership_status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'membership_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN membership_status text DEFAULT 'inactive';
  END IF;
END $$;

-- 7. Create unique constraint on user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 8. Create unique constraint on email if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_email_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
  END IF;
END $$;

-- 9. Create index on user_id for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
