-- Create user_scan_usage table to track free user scans
CREATE TABLE IF NOT EXISTS user_scan_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  glow_analysis_scans INTEGER DEFAULT 0,
  style_guide_scans INTEGER DEFAULT 0,
  last_glow_scan TIMESTAMPTZ,
  last_style_scan TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_scan_usage_user_id ON user_scan_usage(user_id);

-- Enable Row Level Security
ALTER TABLE user_scan_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own scan usage
CREATE POLICY "Users can view own scan usage"
  ON user_scan_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan usage"
  ON user_scan_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scan usage"
  ON user_scan_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scan_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_scan_usage_updated_at
  BEFORE UPDATE ON user_scan_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_scan_usage_updated_at();
