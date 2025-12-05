/*
  # Search & Discovery System for Coach2Coach

  1. New Tables
    - `resource_stats_daily` - Daily rollup for trending calculations
    - `trending_cache` - Materialized trending scores for fast access
    - `search_analytics` - Track search queries and results

  2. Resource Extensions
    - Add search-related fields to resources table
    - Add view/purchase counters
    - Add file type tracking

  3. Functions
    - Increment view/purchase counters
    - Compute trending scores
    - Search analytics tracking

  4. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Add search-related columns to resources table
DO $$
BEGIN
  -- Add tags array if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'tags'
  ) THEN
    ALTER TABLE resources ADD COLUMN tags text[] DEFAULT '{}';
  END IF;

  -- Add file_type if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE resources ADD COLUMN file_type text DEFAULT '';
  END IF;

  -- Add purchase_count if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'purchase_count'
  ) THEN
    ALTER TABLE resources ADD COLUMN purchase_count integer DEFAULT 0;
  END IF;

  -- Add view_count if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE resources ADD COLUMN view_count integer DEFAULT 0;
  END IF;

  -- Add uploaded_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'uploaded_at'
  ) THEN
    ALTER TABLE resources ADD COLUMN uploaded_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create resource_stats_daily table for trending calculations
CREATE TABLE IF NOT EXISTS resource_stats_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  views integer DEFAULT 0,
  purchases integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(resource_id, date)
);

-- Create trending_cache table for fast trending queries
CREATE TABLE IF NOT EXISTS trending_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE NOT NULL,
  trending_score decimal(10,4) NOT NULL,
  rank_position integer NOT NULL,
  computed_at timestamptz DEFAULT now(),
  UNIQUE(resource_id)
);

-- Create search_analytics table for tracking search behavior
CREATE TABLE IF NOT EXISTS search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  query text NOT NULL,
  filters jsonb DEFAULT '{}',
  results_count integer DEFAULT 0,
  clicked_resource_id uuid REFERENCES resources(id) ON DELETE SET NULL,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE resource_stats_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for resource_stats_daily
CREATE POLICY "Anyone can read resource stats"
  ON resource_stats_daily
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage resource stats"
  ON resource_stats_daily
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for trending_cache
CREATE POLICY "Anyone can read trending cache"
  ON trending_cache
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage trending cache"
  ON trending_cache
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for search_analytics
CREATE POLICY "Users can read their own search analytics"
  ON search_analytics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert search analytics"
  ON search_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resource_stats_daily_resource_date ON resource_stats_daily(resource_id, date);
CREATE INDEX IF NOT EXISTS idx_resource_stats_daily_date ON resource_stats_daily(date);
CREATE INDEX IF NOT EXISTS idx_trending_cache_score ON trending_cache(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_cache_rank ON trending_cache(rank_position);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON resources USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_resources_view_count ON resources(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_resources_purchase_count ON resources(purchase_count DESC);
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_at ON resources(uploaded_at DESC);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view(resource_uuid uuid)
RETURNS void AS $$
BEGIN
  -- Increment resource view count
  UPDATE resources 
  SET view_count = view_count + 1 
  WHERE id = resource_uuid;
  
  -- Insert or update daily stats
  INSERT INTO resource_stats_daily (resource_id, date, views)
  VALUES (resource_uuid, CURRENT_DATE, 1)
  ON CONFLICT (resource_id, date)
  DO UPDATE SET 
    views = resource_stats_daily.views + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment purchase count
CREATE OR REPLACE FUNCTION increment_purchase(resource_uuid uuid)
RETURNS void AS $$
BEGIN
  -- Increment resource purchase count
  UPDATE resources 
  SET purchase_count = purchase_count + 1 
  WHERE id = resource_uuid;
  
  -- Insert or update daily stats
  INSERT INTO resource_stats_daily (resource_id, date, purchases)
  VALUES (resource_uuid, CURRENT_DATE, 1)
  ON CONFLICT (resource_id, date)
  DO UPDATE SET 
    purchases = resource_stats_daily.purchases + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to compute trending score
CREATE OR REPLACE FUNCTION compute_trending_score(
  purchases_count integer,
  views_count integer,
  upload_date timestamptz
)
RETURNS decimal AS $$
DECLARE
  raw_score decimal;
  age_days decimal;
  decay_factor decimal;
  final_score decimal;
BEGIN
  -- Raw engagement score
  raw_score := purchases_count * 3.0 + views_count * 0.5;
  
  -- Age in days (minimum 1 to avoid division by zero)
  age_days := GREATEST(1, EXTRACT(EPOCH FROM (now() - upload_date)) / 86400);
  
  -- Decay factor (divide by 1 + age_days/7)
  decay_factor := 1.0 + (age_days / 7.0);
  
  -- Final trending score
  final_score := raw_score / decay_factor;
  
  RETURN final_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to refresh trending cache
CREATE OR REPLACE FUNCTION refresh_trending_cache()
RETURNS void AS $$
BEGIN
  -- Clear existing cache
  DELETE FROM trending_cache;
  
  -- Compute and insert new trending scores
  INSERT INTO trending_cache (resource_id, trending_score, rank_position)
  SELECT 
    r.id,
    compute_trending_score(r.purchase_count, r.view_count, r.uploaded_at) as score,
    ROW_NUMBER() OVER (ORDER BY compute_trending_score(r.purchase_count, r.view_count, r.uploaded_at) DESC) as rank_pos
  FROM resources r
  WHERE r.status = 'active' 
    AND r.is_listed = true
  ORDER BY score DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at
CREATE TRIGGER update_resource_stats_daily_updated_at
  BEFORE UPDATE ON resource_stats_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Initialize trending cache (safe to fail if no resources yet)
DO $$
BEGIN
  PERFORM refresh_trending_cache();
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors on initial run
  NULL;
END $$;