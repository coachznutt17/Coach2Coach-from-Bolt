-- Add preview job table and preview columns

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS processing_status text CHECK (processing_status IN ('queued','processing','ready','failed')) DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS preview_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS is_preview_ready boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.preview_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  original_path text NOT NULL,
  mime_type text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('queued','processing','done','failed')) DEFAULT 'queued',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on preview_jobs
ALTER TABLE preview_jobs ENABLE ROW LEVEL SECURITY;

-- Policies for preview_jobs (admin/system access only)
CREATE POLICY "System can manage preview jobs"
  ON preview_jobs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_preview_jobs_status ON preview_jobs(status);
CREATE INDEX IF NOT EXISTS idx_preview_jobs_resource_id ON preview_jobs(resource_id);
CREATE INDEX IF NOT EXISTS idx_resources_processing_status ON resources(processing_status);

-- Trigger for updated_at
CREATE TRIGGER update_preview_jobs_updated_at
  BEFORE UPDATE ON preview_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();