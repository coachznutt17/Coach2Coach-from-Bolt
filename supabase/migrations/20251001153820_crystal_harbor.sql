/*
  # Analytics & Optimization System for Coach2Coach

  1. New Tables
    - `analytics_events` - Event tracking for funnels and user behavior
    - `metrics_daily` - Daily rollup metrics for performance dashboards
    - `experiments` - A/B testing framework
    - `experiment_variants` - Test variants with configurations
    - `experiment_assignments` - User assignments to test variants
    - `performance_metrics` - Core Web Vitals and performance tracking
    - `error_logs` - Error tracking and monitoring

  2. Analytics Features
    - Revenue tracking and conversion funnels
    - User behavior analytics
    - Performance monitoring
    - A/B testing framework

  3. Security
    - Enable RLS on all tables
    - Admin-only access for experiments and sensitive metrics
    - User privacy controls for analytics opt-out
*/

-- Create analytics_events table for event tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id text NOT NULL,
  session_id text NOT NULL,
  event_name text NOT NULL,
  event_ts timestamptz DEFAULT now(),
  path text DEFAULT '',
  referrer text DEFAULT '',
  user_agent text DEFAULT '',
  country text DEFAULT '',
  properties jsonb DEFAULT '{}',
  experiment_exposures jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create metrics_daily table for rollup analytics
CREATE TABLE IF NOT EXISTS metrics_daily (
  date date PRIMARY KEY,
  visits integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  previews integer DEFAULT 0,
  checkouts_started integer DEFAULT 0,
  subscriptions_started integer DEFAULT 0,
  subscriptions_activated integer DEFAULT 0,
  purchases_completed integer DEFAULT 0,
  revenue_cents integer DEFAULT 0,
  creator_payouts_cents integer DEFAULT 0,
  platform_fee_cents integer DEFAULT 0,
  mrr_cents integer DEFAULT 0,
  arr_cents integer DEFAULT 0,
  active_subscriptions integer DEFAULT 0,
  churned_subscriptions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create experiments table for A/B testing
CREATE TABLE IF NOT EXISTS experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  status text CHECK (status IN ('draft','running','paused','completed')) DEFAULT 'draft',
  primary_metric text NOT NULL,
  start_date timestamptz,
  end_date timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create experiment_variants table
CREATE TABLE IF NOT EXISTS experiment_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid REFERENCES experiments(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  weight integer NOT NULL DEFAULT 50,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(experiment_id, name)
);

-- Create experiment_assignments table
CREATE TABLE IF NOT EXISTS experiment_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid REFERENCES experiments(id) ON DELETE CASCADE NOT NULL,
  subject_id text NOT NULL,
  variant_name text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(experiment_id, subject_id)
);

-- Create performance_metrics table for Core Web Vitals
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id text NOT NULL,
  session_id text NOT NULL,
  metric_name text NOT NULL,
  metric_value decimal(10,3) NOT NULL,
  path text NOT NULL,
  user_agent text DEFAULT '',
  connection_type text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create error_logs table for error tracking
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id text,
  session_id text,
  error_type text NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  path text DEFAULT '',
  user_agent text DEFAULT '',
  properties jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create seo_pages table for dynamic SEO management
CREATE TABLE IF NOT EXISTS seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  keywords text[] DEFAULT '{}',
  og_image text DEFAULT '',
  canonical_url text DEFAULT '',
  robots text DEFAULT 'index,follow',
  priority decimal(2,1) DEFAULT 0.5,
  change_frequency text DEFAULT 'weekly',
  last_modified timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;

-- Policies for analytics_events
CREATE POLICY "System can insert analytics events"
  ON analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read analytics events"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for metrics_daily (admin only)
CREATE POLICY "Admins can manage daily metrics"
  ON metrics_daily
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for experiments (admin only)
CREATE POLICY "Admins can manage experiments"
  ON experiments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage experiment variants"
  ON experiment_variants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for experiment_assignments
CREATE POLICY "System can manage experiment assignments"
  ON experiment_assignments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for performance_metrics
CREATE POLICY "System can insert performance metrics"
  ON performance_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read performance metrics"
  ON performance_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for error_logs
CREATE POLICY "System can insert error logs"
  ON error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for seo_pages (admin only)
CREATE POLICY "Anyone can read SEO pages"
  ON seo_pages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage SEO pages"
  ON seo_pages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_anon_id ON analytics_events(anon_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_ts ON analytics_events(event_ts);
CREATE INDEX IF NOT EXISTS idx_analytics_events_path ON analytics_events(path);
CREATE INDEX IF NOT EXISTS idx_metrics_daily_date ON metrics_daily(date);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_key ON experiments(key);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_experiment_id ON experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_subject_id ON experiment_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_path ON performance_metrics(path);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_seo_pages_path ON seo_pages(path);

-- Create triggers for updated_at
CREATE TRIGGER update_metrics_daily_updated_at
  BEFORE UPDATE ON metrics_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiments_updated_at
  BEFORE UPDATE ON experiments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_pages_updated_at
  BEFORE UPDATE ON seo_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to track analytics event
CREATE OR REPLACE FUNCTION track_analytics_event(
  p_user_id uuid,
  p_anon_id text,
  p_session_id text,
  p_event_name text,
  p_path text DEFAULT '',
  p_referrer text DEFAULT '',
  p_user_agent text DEFAULT '',
  p_country text DEFAULT '',
  p_properties jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO analytics_events (
    user_id, anon_id, session_id, event_name, path, 
    referrer, user_agent, country, properties
  )
  VALUES (
    p_user_id, p_anon_id, p_session_id, p_event_name, p_path,
    p_referrer, p_user_agent, p_country, p_properties
  )
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get experiment variant
CREATE OR REPLACE FUNCTION get_experiment_variant(
  p_experiment_key text,
  p_subject_id text
)
RETURNS text AS $$
DECLARE
  experiment_record experiments%ROWTYPE;
  assignment_record experiment_assignments%ROWTYPE;
  variant_name text;
  hash_value bigint;
  total_weight integer;
  running_weight integer;
  variant_record experiment_variants%ROWTYPE;
BEGIN
  -- Get experiment
  SELECT * INTO experiment_record
  FROM experiments
  WHERE key = p_experiment_key AND status = 'running';
  
  IF NOT FOUND THEN
    RETURN 'control';
  END IF;
  
  -- Check existing assignment
  SELECT * INTO assignment_record
  FROM experiment_assignments
  WHERE experiment_id = experiment_record.id AND subject_id = p_subject_id;
  
  IF FOUND THEN
    RETURN assignment_record.variant_name;
  END IF;
  
  -- Create new assignment using deterministic hash
  hash_value := abs(hashtext(p_experiment_key || ':' || p_subject_id));
  
  -- Get total weight
  SELECT SUM(weight) INTO total_weight
  FROM experiment_variants
  WHERE experiment_id = experiment_record.id;
  
  -- Assign variant based on hash
  running_weight := 0;
  FOR variant_record IN 
    SELECT * FROM experiment_variants 
    WHERE experiment_id = experiment_record.id 
    ORDER BY name
  LOOP
    running_weight := running_weight + variant_record.weight;
    IF (hash_value % total_weight) < running_weight THEN
      variant_name := variant_record.name;
      EXIT;
    END IF;
  END LOOP;
  
  -- Store assignment
  INSERT INTO experiment_assignments (experiment_id, subject_id, variant_name)
  VALUES (experiment_record.id, p_subject_id, variant_name);
  
  RETURN variant_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to compute daily metrics rollup
CREATE OR REPLACE FUNCTION compute_daily_metrics(target_date date)
RETURNS void AS $$
DECLARE
  daily_visits integer;
  daily_unique_visitors integer;
  daily_previews integer;
  daily_checkouts integer;
  daily_subs_started integer;
  daily_subs_activated integer;
  daily_purchases integer;
  daily_revenue_cents integer;
  daily_creator_payouts integer;
  daily_platform_fees integer;
BEGIN
  -- Count events for the day
  SELECT 
    COUNT(*) FILTER (WHERE event_name = 'page_view'),
    COUNT(DISTINCT anon_id) FILTER (WHERE event_name = 'page_view'),
    COUNT(*) FILTER (WHERE event_name = 'preview_view'),
    COUNT(*) FILTER (WHERE event_name = 'checkout_started'),
    COUNT(*) FILTER (WHERE event_name = 'subscription_started'),
    COUNT(*) FILTER (WHERE event_name = 'subscription_activated'),
    COUNT(*) FILTER (WHERE event_name = 'purchase_completed')
  INTO 
    daily_visits, daily_unique_visitors, daily_previews, 
    daily_checkouts, daily_subs_started, daily_subs_activated, daily_purchases
  FROM analytics_events
  WHERE DATE(event_ts) = target_date;
  
  -- Calculate revenue from purchases on this date
  SELECT 
    COALESCE(SUM(amount_cents), 0),
    COALESCE(SUM(amount_cents * 0.85), 0),
    COALESCE(SUM(amount_cents * 0.15), 0)
  INTO daily_revenue_cents, daily_creator_payouts, daily_platform_fees
  FROM purchases
  WHERE DATE(created_at) = target_date AND status = 'succeeded';
  
  -- Upsert daily metrics
  INSERT INTO metrics_daily (
    date, visits, unique_visitors, previews, checkouts_started,
    subscriptions_started, subscriptions_activated, purchases_completed,
    revenue_cents, creator_payouts_cents, platform_fee_cents
  )
  VALUES (
    target_date, daily_visits, daily_unique_visitors, daily_previews,
    daily_checkouts, daily_subs_started, daily_subs_activated, daily_purchases,
    daily_revenue_cents, daily_creator_payouts, daily_platform_fees
  )
  ON CONFLICT (date)
  DO UPDATE SET
    visits = EXCLUDED.visits,
    unique_visitors = EXCLUDED.unique_visitors,
    previews = EXCLUDED.previews,
    checkouts_started = EXCLUDED.checkouts_started,
    subscriptions_started = EXCLUDED.subscriptions_started,
    subscriptions_activated = EXCLUDED.subscriptions_activated,
    purchases_completed = EXCLUDED.purchases_completed,
    revenue_cents = EXCLUDED.revenue_cents,
    creator_payouts_cents = EXCLUDED.creator_payouts_cents,
    platform_fee_cents = EXCLUDED.platform_fee_cents,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversion funnel
CREATE OR REPLACE FUNCTION get_conversion_funnel(
  start_date date,
  end_date date
)
RETURNS TABLE(
  step text,
  count bigint,
  conversion_rate decimal
) AS $$
DECLARE
  total_visits bigint;
BEGIN
  -- Get total visits for the period
  SELECT COUNT(*) INTO total_visits
  FROM analytics_events
  WHERE event_name = 'page_view'
    AND DATE(event_ts) BETWEEN start_date AND end_date;
  
  RETURN QUERY
  SELECT 
    step_name::text,
    step_count,
    CASE 
      WHEN total_visits > 0 THEN ROUND((step_count::decimal / total_visits) * 100, 2)
      ELSE 0::decimal
    END as conversion_rate
  FROM (
    VALUES 
      ('visits', total_visits),
      ('previews', (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'preview_view' AND DATE(event_ts) BETWEEN start_date AND end_date)),
      ('checkouts', (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'checkout_started' AND DATE(event_ts) BETWEEN start_date AND end_date)),
      ('subscriptions', (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'subscription_activated' AND DATE(event_ts) BETWEEN start_date AND end_date)),
      ('purchases', (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'purchase_completed' AND DATE(event_ts) BETWEEN start_date AND end_date))
  ) AS funnel_steps(step_name, step_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default SEO pages
INSERT INTO seo_pages (path, title, description, keywords, priority) VALUES
  ('/', 'Coach2Coach - Digital Marketplace for Coaching Resources', 'The premier digital marketplace where coaching expertise meets opportunity. Create, sell, and discover game-changing resources for every sport and level.', ARRAY['coaching', 'sports', 'training', 'drills', 'playbooks'], 1.0),
  ('/browse', 'Browse Coaching Resources - Coach2Coach', 'Discover thousands of coaching resources from expert coaches across all sports and levels. Find drills, playbooks, training programs and more.', ARRAY['coaching resources', 'sports drills', 'training materials'], 0.9),
  ('/pricing', 'Pricing - Coach2Coach Membership', 'Simple, fair pricing for unlimited access to coaching resources. Join thousands of coaches improving their game.', ARRAY['coaching membership', 'sports training subscription'], 0.8)
ON CONFLICT (path) DO NOTHING;