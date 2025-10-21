-- Freemium Flow Database Migration
-- Add daily scan tracking columns to user_scan_usage table

-- Add new columns for daily scan tracking
ALTER TABLE user_scan_usage 
ADD COLUMN IF NOT EXISTS today_glow_scans INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS today_style_scans INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scan_date TIMESTAMPTZ;

-- Create index for efficient daily reset queries
CREATE INDEX IF NOT EXISTS idx_user_scan_usage_last_scan_date 
ON user_scan_usage(last_scan_date);

-- Function to reset daily scans (optional - can be done in app logic)
CREATE OR REPLACE FUNCTION reset_daily_scans()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_scan_usage
  SET today_glow_scans = 0,
      today_style_scans = 0
  WHERE last_scan_date < CURRENT_DATE;
END;
$$;

-- Optional: Create a scheduled job to reset daily scans at midnight
-- Note: This requires pg_cron extension
-- SELECT cron.schedule('reset-daily-scans', '0 0 * * *', 'SELECT reset_daily_scans()');

COMMENT ON COLUMN user_scan_usage.today_glow_scans IS 'Number of glow analysis scans performed today (resets daily)';
COMMENT ON COLUMN user_scan_usage.today_style_scans IS 'Number of style guide scans performed today (resets daily)';
COMMENT ON COLUMN user_scan_usage.last_scan_date IS 'Date of last scan (used for daily reset logic)';
