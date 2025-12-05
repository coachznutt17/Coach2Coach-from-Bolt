/*
  # Add Reviews System

  1. New Tables
    - `reviews` - Resource reviews and ratings
      - `id` (uuid, primary key)
      - `resource_id` (uuid, foreign key to resources)
      - `buyer_id` (uuid, foreign key to profiles)
      - `rating` (integer, 1-5 stars)
      - `title` (text)
      - `comment` (text)
      - `helpful_count` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on reviews table
    - Anyone can read reviews for active resources
    - Only buyers who purchased can create/update their own review
    - Users can only have one review per resource
*/

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  comment text NOT NULL DEFAULT '',
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(resource_id, buyer_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Anyone can read reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

-- Only buyers who purchased can create review
CREATE POLICY "Buyers can create reviews for purchased resources"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.buyer_id = buyer_id
        AND purchases.resource_id = reviews.resource_id
        AND purchases.status = 'completed'
    )
    AND buyer_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    buyer_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (
    buyer_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_resource_id ON reviews(resource_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer_id ON reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update resource rating stats
CREATE OR REPLACE FUNCTION update_resource_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE resources
  SET
    rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE resource_id = NEW.resource_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE resource_id = NEW.resource_id),
    updated_at = now()
  WHERE id = NEW.resource_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update resource stats when review added/updated
CREATE TRIGGER update_resource_rating_on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_rating_stats();

CREATE TRIGGER update_resource_rating_on_review_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_rating_stats();

-- Trigger to update resource stats when review deleted
CREATE OR REPLACE FUNCTION update_resource_rating_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE resources
  SET
    rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE resource_id = OLD.resource_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE resource_id = OLD.resource_id),
    updated_at = now()
  WHERE id = OLD.resource_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_resource_rating_on_review_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_rating_stats_on_delete();
