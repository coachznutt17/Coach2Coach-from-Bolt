/*
  # Quality & Trust System for Coach2Coach

  1. New Tables
    - `moderation_queue` - Content review queue with automated scanning
    - `reports` - User reports for inappropriate content
    - `disputes` - Purchase disputes and refund requests
    - `verification_requests` - Coach verification submissions

  2. Profile Extensions
    - Add verification status and role fields
    - Add moderation tracking fields

  3. Resource Extensions
    - Add moderation status and notes
    - Add automated scanning results

  4. Security
    - Enable RLS on all tables
    - Admin-only access for moderation
    - User access for own reports/disputes
*/

-- Extend profiles table with verification and role fields
DO $$
BEGIN
  -- Add is_verified_coach if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_verified_coach'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_verified_coach boolean DEFAULT false;
  END IF;

  -- Add verification_status if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verification_status text CHECK (verification_status IN ('none','pending','approved','rejected')) DEFAULT 'none';
  END IF;

  -- Add verification_notes if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'verification_notes'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verification_notes text DEFAULT '';
  END IF;

  -- Add role if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user','admin'));
  END IF;
END $$;

-- Extend resources table with moderation fields
DO $$
BEGIN
  -- Add moderation_status if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'moderation_status'
  ) THEN
    ALTER TABLE resources ADD COLUMN moderation_status text CHECK (moderation_status IN ('pending','approved','rejected')) DEFAULT 'pending';
  END IF;

  -- Add moderation_notes if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'moderation_notes'
  ) THEN
    ALTER TABLE resources ADD COLUMN moderation_notes text DEFAULT '';
  END IF;

  -- Add scanner_flags if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'scanner_flags'
  ) THEN
    ALTER TABLE resources ADD COLUMN scanner_flags jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add risk_score if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'risk_score'
  ) THEN
    ALTER TABLE resources ADD COLUMN risk_score integer DEFAULT 0;
  END IF;
END $$;

-- Create moderation_queue table
CREATE TABLE IF NOT EXISTS moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE UNIQUE NOT NULL,
  uploader_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  flags jsonb DEFAULT '[]'::jsonb,
  risk_score integer DEFAULT 0,
  notes text DEFAULT '',
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL CHECK (reason IN ('copyright','spam','low_quality','malware','inappropriate','other')),
  details text NOT NULL,
  status text CHECK (status IN ('open','investigating','resolved','dismissed')) DEFAULT 'open',
  admin_notes text DEFAULT '',
  resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL CHECK (reason IN ('not_as_described','technical_issue','copyright_claim','quality_issue','other')),
  details text NOT NULL,
  status text CHECK (status IN ('open','refund_approved','refund_denied','resolved')) DEFAULT 'open',
  refund_amount_cents integer,
  stripe_refund_id text,
  decision_notes text DEFAULT '',
  resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  credentials_text text NOT NULL,
  proof_documents text[] DEFAULT '{}',
  status text CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  admin_notes text DEFAULT '',
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Policies for moderation_queue (admin only)
CREATE POLICY "Admins can manage moderation queue"
  ON moderation_queue
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

-- Policies for reports
CREATE POLICY "Users can read their own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (
    reporter_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update reports"
  ON reports
  FOR UPDATE
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

-- Policies for disputes
CREATE POLICY "Users can read their own disputes"
  ON disputes
  FOR SELECT
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all disputes"
  ON disputes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Buyers can create disputes for their purchases"
  ON disputes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update disputes"
  ON disputes
  FOR UPDATE
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

-- Policies for verification_requests
CREATE POLICY "Users can read their own verification requests"
  ON verification_requests
  FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all verification requests"
  ON verification_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create verification requests"
  ON verification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update verification requests"
  ON verification_requests
  FOR UPDATE
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
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_risk_score ON moderation_queue(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_resource_id ON reports(resource_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_buyer_id ON disputes(buyer_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(is_verified_coach);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_resources_moderation_status ON resources(moderation_status);

-- Create triggers for updated_at
CREATE TRIGGER update_moderation_queue_updated_at
  BEFORE UPDATE ON moderation_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_requests_updated_at
  BEFORE UPDATE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create moderation queue entry on resource upload
CREATE OR REPLACE FUNCTION create_moderation_queue_entry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO moderation_queue (resource_id, uploader_id)
  VALUES (NEW.id, NEW.owner_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create moderation queue entry on resource insert
CREATE TRIGGER create_moderation_queue_on_resource_insert
  AFTER INSERT ON resources
  FOR EACH ROW
  EXECUTE FUNCTION create_moderation_queue_entry();

-- Function to sync moderation status with listing
CREATE OR REPLACE FUNCTION sync_moderation_listing()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow listing if moderation is approved
  IF NEW.moderation_status = 'approved' THEN
    UPDATE resources 
    SET is_listed = true 
    WHERE id = NEW.resource_id;
  ELSE
    UPDATE resources 
    SET is_listed = false 
    WHERE id = NEW.resource_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync moderation status with listing
CREATE TRIGGER sync_moderation_listing_trigger
  AFTER UPDATE OF status ON moderation_queue
  FOR EACH ROW
  EXECUTE FUNCTION sync_moderation_listing();

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-approve low-risk uploads (configurable)
CREATE OR REPLACE FUNCTION auto_approve_if_safe()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve if risk score is very low and no flags
  IF NEW.risk_score <= 10 AND jsonb_array_length(NEW.flags) = 0 THEN
    NEW.status := 'approved';
    
    -- Update resource moderation status
    UPDATE resources 
    SET moderation_status = 'approved', is_listed = true 
    WHERE id = NEW.resource_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-approval (can be disabled via config)
CREATE TRIGGER auto_approve_safe_uploads
  BEFORE INSERT ON moderation_queue
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_if_safe();