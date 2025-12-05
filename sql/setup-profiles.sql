/*
  # User Profile System Setup

  This script sets up everything needed for the user profile creation system:
  1. Creates the avatars storage bucket for profile pictures
  2. Sets up storage policies for avatar uploads
  3. Verifies profiles table RLS policies

  Run this in your Supabase SQL Editor before using the profile system.
*/

-- Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all avatars
CREATE POLICY "Public can view all avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify profiles table has RLS enabled (should already be enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Note: Your profiles table already has the correct RLS policies:
-- - Users can create their own profile (INSERT)
-- - Users can read all profiles (SELECT)
-- - Users can update their own profile (UPDATE)
