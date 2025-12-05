/*
  # MVP Schema Alignment - Safe Migration
  
  1. Schema Changes
    - Rename resources.coach_id → owner_id (SAFE: preserves data)
    - Add resources.is_free boolean (default false)
    - Add resources.file_mime text
    - Add resources.file_size bigint
    - Add profiles.is_founding_coach boolean (default false)
    
  2. Data Safety
    - Uses ALTER COLUMN RENAME to preserve all existing data
    - All new columns have safe defaults
    - No DROP or DELETE operations
    
  3. RLS Updates
    - Update policies to use owner_id instead of coach_id
*/

-- 1. Rename coach_id to owner_id (preserves data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'coach_id'
  ) THEN
    ALTER TABLE resources RENAME COLUMN coach_id TO owner_id;
  END IF;
END $$;

-- 2. Add is_free to resources
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'is_free'
  ) THEN
    ALTER TABLE resources ADD COLUMN is_free boolean DEFAULT false;
  END IF;
END $$;

-- 3. Add file metadata to resources
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'file_mime'
  ) THEN
    ALTER TABLE resources ADD COLUMN file_mime text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE resources ADD COLUMN file_size bigint;
  END IF;
END $$;

-- 4. Add is_founding_coach to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_founding_coach'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_founding_coach boolean DEFAULT false;
  END IF;
END $$;

-- 5. Ensure purchases has currency field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'currency'
  ) THEN
    ALTER TABLE purchases ADD COLUMN currency text DEFAULT 'usd';
  END IF;
END $$;

-- 6. Recreate RLS policies to use owner_id (drop old first)
DROP POLICY IF EXISTS "Owners can read their own resources" ON resources;
DROP POLICY IF EXISTS "Active members can create resources" ON resources;
DROP POLICY IF EXISTS "Owners can update their own resources" ON resources;

-- Recreate with owner_id
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
      AND membership_status IN ('trial', 'active')
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

-- 7. Update purchases policies to allow trial members
DROP POLICY IF EXISTS "Active members can create purchases" ON purchases;

CREATE POLICY "Trial and active members can create purchases"
  ON purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid() 
      AND membership_status IN ('trial', 'active')
    )
  );

-- 8. Create index on owner_id if not exists
CREATE INDEX IF NOT EXISTS idx_resources_owner_id ON resources(owner_id);
