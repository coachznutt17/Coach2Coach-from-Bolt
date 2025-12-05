/*
  # Enable Testing Mode - Bypass Membership Restrictions
  
  1. Changes
    - Add permissive INSERT policy for resources table to allow testing
    - This allows authenticated users to create resources without membership checks
  
  2. Security
    - This is for TESTING ONLY
    - Should be removed or disabled in production
*/

-- Drop the restrictive membership policy temporarily
DROP POLICY IF EXISTS "Active members can create resources" ON resources;

-- Create a permissive testing policy for inserting resources
CREATE POLICY "Testing - Allow authenticated users to create resources"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );
