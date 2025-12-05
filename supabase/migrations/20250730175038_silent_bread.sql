/*
  # Initial Schema for Coach2Coach Platform

  1. New Tables
    - `coach_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `first_name` (text)
      - `last_name` (text)
      - `title` (text)
      - `bio` (text)
      - `location` (text)
      - `years_experience` (text)
      - `sports` (text array)
      - `levels` (text array)
      - `specialties` (text array)
      - `achievements` (text array)
      - `website` (text)
      - `social_links` (jsonb)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `resources`
      - `id` (uuid, primary key)
      - `coach_id` (uuid, references coach_profiles)
      - `title` (text)
      - `description` (text)
      - `price` (decimal)
      - `sports` (text array)
      - `levels` (text array)
      - `category` (text)
      - `file_url` (text)
      - `preview_images` (text array)
      - `status` (text)
      - `downloads` (integer)
      - `rating` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `purchases`
      - `id` (uuid, primary key)
      - `buyer_id` (uuid, references auth.users)
      - `resource_id` (uuid, references resources)
      - `amount` (decimal)
      - `commission_rate` (decimal)
      - `coach_earnings` (decimal)
      - `platform_fee` (decimal)
      - `status` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create coach_profiles table
CREATE TABLE IF NOT EXISTS coach_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  title text NOT NULL,
  bio text NOT NULL,
  location text NOT NULL,
  years_experience text NOT NULL,
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

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES coach_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  sports text[] DEFAULT '{}',
  levels text[] DEFAULT '{}',
  category text NOT NULL,
  file_url text DEFAULT '',
  preview_images text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'inactive')),
  downloads integer DEFAULT 0,
  rating decimal(3,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL,
  commission_rate decimal(5,2) NOT NULL,
  coach_earnings decimal(10,2) NOT NULL,
  platform_fee decimal(10,2) NOT NULL,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Policies for coach_profiles
CREATE POLICY "Users can read all coach profiles"
  ON coach_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON coach_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON coach_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for resources
CREATE POLICY "Anyone can read active resources"
  ON resources
  FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Coaches can read their own resources"
  ON resources
  FOR SELECT
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can create resources"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update their own resources"
  ON resources
  FOR UPDATE
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );

-- Policies for purchases
CREATE POLICY "Users can read their own purchases"
  ON purchases
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Coaches can read purchases of their resources"
  ON purchases
  FOR SELECT
  TO authenticated
  USING (
    resource_id IN (
      SELECT r.id FROM resources r
      JOIN coach_profiles cp ON r.coach_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create purchases"
  ON purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON coach_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_coach_id ON resources(coach_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_resource_id ON purchases(resource_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();