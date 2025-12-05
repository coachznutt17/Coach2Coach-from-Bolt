/*
  # Fix Resources Foreign Key Constraint with Data Cleanup
  
  ## Problem
  The resources table has a foreign key constraint pointing to coach_profiles(id),
  but the application uses the profiles table. Additionally, there are orphaned
  resources with owner_ids that don't exist in profiles.
  
  ## Solution
  1. Clean up orphaned resources (invalid data)
  2. Drop the old foreign key constraint pointing to coach_profiles
  3. Create a new foreign key constraint pointing to profiles(id)
  
  ## Impact
  - Removes invalid test data
  - Allows users with profiles to upload resources
  - Aligns with MVP schema design
*/

-- Step 1: Delete orphaned resources that reference non-existent profiles
DELETE FROM resources
WHERE owner_id NOT IN (SELECT id FROM profiles);

-- Step 2: Drop the old foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'resources_coach_id_fkey'
    AND table_name = 'resources'
  ) THEN
    ALTER TABLE resources DROP CONSTRAINT resources_coach_id_fkey;
  END IF;
END $$;

-- Step 3: Add the correct foreign key constraint to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'resources_owner_id_fkey'
    AND table_name = 'resources'
  ) THEN
    ALTER TABLE resources 
    ADD CONSTRAINT resources_owner_id_fkey 
    FOREIGN KEY (owner_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;
  END IF;
END $$;