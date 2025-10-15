-- ============================================================================
-- CONVERSION-OPTIMIZED DATABASE SETUP
-- Psychology-Driven Trial & Conversion Tracking
-- ============================================================================

-- Drop existing conversion tables if they exist
DROP TABLE IF EXISTS public.conversion_events CASCADE;
DROP TABLE IF EXISTS public.scan_results_preview CASCADE;
DROP FUNCTION IF EXISTS public.track_conversion_event(UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.get_conversion_funnel_stats() CASCADE;

-- ============================================================================
-- STEP 1: UPDATE TRIAL TRACKING FOR 3-DAY TRIAL
-- ============================================================================

-- Update trial_tracking table to use 3 days
ALTER TABLE public.trial_tracking 
ALTER COLUMN trial_ends_at SET DEFAULT (NOW() + INTERVAL '3 days');

-- Update any existing trials to 3 days (if needed)
UPDATE public.trial_tracking 
SET trial_ends_at = trial_started_at + INTERVAL '3 days'
WHERE trial_ends_at > trial_started_at + INTERVAL '3 days';

-- ============================================================================
-- STEP 2: CREATE CONVERSION TRACKING TABLE
-- ============================================================================

CREATE TABLE public.conversion_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'app_opened',
    'scan_started',
    'scan_completed',
    'results_preview_viewed',
    'results_blur_tapped',
    'paywall_viewed',
    'trial_started',
    'trial_reminder_set',
    'trial_goal_set',
    'payment_method_added',
    'subscription_started',
    'trial_converted',
    'trial_cancelled',
    'result_shared',
    'second_scan_attempted'
  )),
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own conversion events" ON public.conversion_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversion events" ON public.conversion_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for analytics
CREATE INDEX idx_conversion_events_user_id ON public.conversion_events(user_id);
CREATE INDEX idx_conversion_events_type ON public.conversion_events(event_type);
CREATE INDEX idx_conversion_events_created_at ON public.conversion_events(created_at DESC);

-- ============================================================================
-- STEP 3: CREATE SCAN RESULTS PREVIEW TABLE (FOR BLURRED TEASERS)
-- ============================================================================

CREATE TABLE public.scan_results_preview (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis_id UUID,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('glow', 'style')),
  preview_data JSONB NOT NULL, -- Contains teaser info, blurred scores, etc.
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlock_timestamp TIMESTAMPTZ,
  times_viewed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.scan_results_preview ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own previews" ON public.scan_results_preview
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own previews" ON public.scan_results_preview
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own previews" ON public.scan_results_preview
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_scan_preview_user_id ON public.scan_results_preview(user_id);
CREATE INDEX idx_scan_preview_unlocked ON public.scan_results_preview(user_id, is_unlocked);

-- Update timestamp trigger
CREATE TRIGGER update_scan_preview_updated_at
  BEFORE UPDATE ON public.scan_results_preview
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 4: UPDATE PROFILES WITH CONVERSION DATA
-- ============================================================================

-- Add conversion tracking fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_scan_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_goal TEXT,
ADD COLUMN IF NOT EXISTS trial_reminder_time TIME,
ADD COLUMN IF NOT EXISTS conversion_source TEXT,
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- STEP 5: CREATE CONVERSION TRACKING FUNCTIONS
-- ============================================================================

-- Function to track conversion events
CREATE OR REPLACE FUNCTION public.track_conversion_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.conversion_events (user_id, event_type, event_data)
  VALUES (p_user_id, p_event_type, p_event_data)
  RETURNING id INTO v_event_id;
  
  -- Update first_scan_at if this is first scan
  IF p_event_type = 'scan_completed' THEN
    UPDATE public.profiles
    SET first_scan_at = NOW()
    WHERE id = p_user_id AND first_scan_at IS NULL;
  END IF;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversion funnel statistics
CREATE OR REPLACE FUNCTION public.get_conversion_funnel_stats()
RETURNS TABLE (
  total_signups BIGINT,
  scans_started BIGINT,
  scans_completed BIGINT,
  previews_viewed BIGINT,
  paywalls_viewed BIGINT,
  trials_started BIGINT,
  conversions BIGINT,
  scan_to_trial_rate NUMERIC,
  trial_to_paid_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(DISTINCT id) FROM public.profiles)::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM public.conversion_events WHERE event_type = 'scan_started')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM public.conversion_events WHERE event_type = 'scan_completed')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM public.conversion_events WHERE event_type = 'results_preview_viewed')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM public.conversion_events WHERE event_type = 'paywall_viewed')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM public.conversion_events WHERE event_type = 'trial_started')::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM public.conversion_events WHERE event_type = 'trial_converted')::BIGINT,
    CASE 
      WHEN (SELECT COUNT(DISTINCT user_id) FROM public.conversion_events WHERE event_type = 'scan_completed') > 0
      THEN ROUND(
        (SELECT COUNT(DISTINCT user_id) FROM public.conversion_events WHERE event_type = 'trial_started')::NUMERIC / 
        (SELECT COUNT(DISTINCT user_id) FROM public.conversion_events WHERE event_type = 'scan_completed')::NUMERIC * 100, 
        2
      )
      ELSE 0
    END,
    CASE 
      WHEN (SELECT COUNT(DISTINCT user_id) FROM public.conversion_events WHERE event_type = 'trial_started') > 0
      THEN ROUND(
        (SELECT COUNT(DISTINCT user_id) FROM public.conversion_events WHERE event_type = 'trial_converted')::NUMERIC / 
        (SELECT COUNT(DISTINCT user_id) FROM public.conversion_events WHERE event_type = 'trial_started')::NUMERIC * 100, 
        2
      )
      ELSE 0
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: CREATE VIEW FOR USER CONVERSION STATUS
-- ============================================================================

CREATE OR REPLACE VIEW public.user_conversion_journey AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.created_at as signup_date,
  p.first_scan_at,
  p.trial_goal,
  p.is_premium,
  t.trial_started_at,
  t.trial_ends_at,
  t.is_trial_expired,
  (SELECT created_at FROM public.conversion_events WHERE user_id = p.id AND event_type = 'scan_completed' ORDER BY created_at LIMIT 1) as first_scan_date,
  (SELECT created_at FROM public.conversion_events WHERE user_id = p.id AND event_type = 'trial_started' ORDER BY created_at LIMIT 1) as trial_start_date,
  (SELECT created_at FROM public.conversion_events WHERE user_id = p.id AND event_type = 'trial_converted' ORDER BY created_at LIMIT 1) as conversion_date,
  CASE 
    WHEN p.is_premium THEN 'converted'
    WHEN t.trial_started_at IS NOT NULL AND t.is_trial_expired = FALSE THEN 'in_trial'
    WHEN t.is_trial_expired = TRUE THEN 'trial_expired'
    WHEN p.first_scan_at IS NOT NULL THEN 'scanned_no_trial'
    ELSE 'signed_up_no_scan'
  END as conversion_stage
FROM public.profiles p
LEFT JOIN public.trial_tracking t ON p.id = t.id;

-- ============================================================================
-- STEP 7: UPDATE TRIAL TRACKING WITH CONVERSION OPTIMIZATION
-- ============================================================================

-- Add conversion optimization fields
ALTER TABLE public.trial_tracking
ADD COLUMN IF NOT EXISTS trial_reminder_set BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_goal_set BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS preview_unlocked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS days_to_conversion INTEGER;

-- ============================================================================
-- STEP 8: CREATE TRIGGER TO AUTO-EXPIRE TRIALS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_trial_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_ends_at <= NOW() AND NEW.is_trial_expired = FALSE THEN
    NEW.is_trial_expired = TRUE;
    
    -- Track trial expiration event
    INSERT INTO public.conversion_events (user_id, event_type, event_data)
    VALUES (NEW.id, 'trial_cancelled', jsonb_build_object(
      'analyses_used', NEW.analyses_used,
      'trial_duration_days', EXTRACT(DAY FROM (NOW() - NEW.trial_started_at))
    ));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_trial_expiration
  BEFORE UPDATE ON public.trial_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.check_trial_expiration();

-- ============================================================================
-- STEP 9: GRANTS
-- ============================================================================

GRANT SELECT, INSERT ON public.conversion_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.scan_results_preview TO authenticated;
GRANT SELECT ON public.user_conversion_journey TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_conversion_event(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversion_funnel_stats() TO authenticated;

-- ============================================================================
-- STEP 10: ADD SAMPLE DATA & COMMENTS
-- ============================================================================

COMMENT ON TABLE public.conversion_events IS 'Tracks every step of user conversion journey for analytics';
COMMENT ON TABLE public.scan_results_preview IS 'Stores blurred/teaser results to create FOMO before paywall';
COMMENT ON VIEW public.user_conversion_journey IS 'Complete view of each user''s conversion funnel progress';
COMMENT ON FUNCTION public.track_conversion_event IS 'Logs conversion events with automatic profile updates';
COMMENT ON FUNCTION public.get_conversion_funnel_stats IS 'Returns conversion rates at each funnel stage';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CONVERSION-OPTIMIZED DATABASE SETUP COMPLETE!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'New Features:';
  RAISE NOTICE '✓ 3-day trial period configured (reduced from 7 days)';
  RAISE NOTICE '✓ Conversion event tracking (12+ event types)';
  RAISE NOTICE '✓ Scan results preview table (for blurred teasers)';
  RAISE NOTICE '✓ Trial goal & reminder tracking';
  RAISE NOTICE '✓ Conversion funnel analytics';
  RAISE NOTICE '✓ Auto-expiring trial trigger';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Psychology Features Enabled:';
  RAISE NOTICE '📊 Track user journey from signup → scan → trial → conversion';
  RAISE NOTICE '🎯 Store trial goals for commitment device effect';
  RAISE NOTICE '⏰ Reminder system for re-engagement';
  RAISE NOTICE '🔒 Blurred results preview for FOMO';
  RAISE NOTICE '📈 Real-time conversion analytics';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Update app to use track_conversion_event() function';
  RAISE NOTICE '2. Implement blurred results screen';
  RAISE NOTICE '3. Add trial goal selection flow';
  RAISE NOTICE '4. Set up reminder notifications';
  RAISE NOTICE '5. Test complete conversion funnel';
  RAISE NOTICE '============================================================================';
END $$;
