-- ============================================================================
-- CONVERSION-OPTIMIZED DATABASE SETUP FOR GLOWCHECK APP
-- ============================================================================
-- This implements a "Freemium Hook" model designed to maximize conversions
-- 
-- STRATEGY:
-- 1. Free tier: 1 scan/week (results visible for 24h only)
-- 2. After first scan: Show value, then gate advanced features
-- 3. 7-day trial: Unlocked ONLY after payment method added
-- 4. Psychology: Create "aha moment" then strategic friction
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- DROP EXISTING TABLES (if needed for fresh setup)
-- ============================================================================
-- Uncomment these lines if you want to start fresh:
-- DROP TABLE IF EXISTS public.trial_tracking CASCADE;
-- DROP TABLE IF EXISTS public.subscriptions CASCADE;
-- DROP TABLE IF EXISTS public.usage_tracking CASCADE;

-- ============================================================================
-- TRIAL TRACKING TABLE (Updated for conversion optimization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.trial_tracking (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Trial status
  trial_started_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  is_trial_active BOOLEAN DEFAULT FALSE,
  is_trial_expired BOOLEAN DEFAULT FALSE,
  
  -- Payment tracking (key for conversion)
  has_added_payment BOOLEAN DEFAULT FALSE,
  payment_added_at TIMESTAMP WITH TIME ZONE,
  
  -- Free tier usage (weekly reset)
  weekly_scans_used INTEGER DEFAULT 0,
  max_weekly_scans INTEGER DEFAULT 1,
  last_scan_reset_date DATE,
  
  -- Trial usage (unlimited during trial)
  trial_scans_used INTEGER DEFAULT 0,
  
  -- Results access tracking
  first_scan_completed_at TIMESTAMP WITH TIME ZONE,
  results_unlocked_until TIMESTAMP WITH TIME ZONE,
  
  -- Conversion tracking
  shown_paywall_count INTEGER DEFAULT 0,
  last_paywall_shown_at TIMESTAMP WITH TIME ZONE,
  conversion_source TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_trial_tracking_expires ON public.trial_tracking(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_trial_tracking_payment ON public.trial_tracking(has_added_payment);
CREATE INDEX IF NOT EXISTS idx_trial_tracking_scan_reset ON public.trial_tracking(last_scan_reset_date);
CREATE INDEX IF NOT EXISTS idx_trial_tracking_results_unlock ON public.trial_tracking(results_unlocked_until);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.trial_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own trial tracking" ON public.trial_tracking;
CREATE POLICY "Users can view own trial tracking" ON public.trial_tracking
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own trial tracking" ON public.trial_tracking;
CREATE POLICY "Users can insert own trial tracking" ON public.trial_tracking
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own trial tracking" ON public.trial_tracking;
CREATE POLICY "Users can update own trial tracking" ON public.trial_tracking
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- FUNCTIONS FOR CONVERSION OPTIMIZATION
-- ============================================================================

-- Function to check if user can scan (free tier or trial)
CREATE OR REPLACE FUNCTION public.can_user_scan(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_premium BOOLEAN;
  trial_active BOOLEAN;
  weekly_scans INTEGER;
  max_scans INTEGER;
  last_reset DATE;
  week_start DATE;
BEGIN
  -- Check if user is premium
  SELECT is_premium INTO is_premium
  FROM public.profiles
  WHERE id = user_uuid;
  
  IF is_premium THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has active trial
  SELECT 
    (trial_ends_at > NOW() AND is_trial_active AND NOT is_trial_expired),
    weekly_scans_used,
    max_weekly_scans,
    last_scan_reset_date
  INTO trial_active, weekly_scans, max_scans, last_reset
  FROM public.trial_tracking
  WHERE id = user_uuid;
  
  IF trial_active THEN
    RETURN TRUE;
  END IF;
  
  -- Check free tier weekly limit
  week_start := DATE_TRUNC('week', CURRENT_DATE);
  
  IF last_reset IS NULL OR last_reset < week_start THEN
    -- Week has reset, user can scan
    RETURN TRUE;
  END IF;
  
  -- Check if user has scans left this week
  RETURN COALESCE(weekly_scans, 0) < COALESCE(max_scans, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view results
CREATE OR REPLACE FUNCTION public.can_user_view_results(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_premium BOOLEAN;
  trial_active BOOLEAN;
  results_unlock TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is premium
  SELECT is_premium INTO is_premium
  FROM public.profiles
  WHERE id = user_uuid;
  
  IF is_premium THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has active trial
  SELECT 
    (trial_ends_at > NOW() AND is_trial_active AND NOT is_trial_expired),
    results_unlocked_until
  INTO trial_active, results_unlock
  FROM public.trial_tracking
  WHERE id = user_uuid;
  
  IF trial_active THEN
    RETURN TRUE;
  END IF;
  
  -- Check if results are still unlocked (24h window for free users)
  IF results_unlock IS NOT NULL AND results_unlock > NOW() THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment scan count (handles weekly reset)
CREATE OR REPLACE FUNCTION public.increment_scan_count(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  last_reset DATE;
  week_start DATE;
  current_scans INTEGER;
BEGIN
  week_start := DATE_TRUNC('week', CURRENT_DATE);
  
  SELECT last_scan_reset_date, weekly_scans_used
  INTO last_reset, current_scans
  FROM public.trial_tracking
  WHERE id = user_uuid;
  
  -- Reset weekly count if new week
  IF last_reset IS NULL OR last_reset < week_start THEN
    UPDATE public.trial_tracking
    SET 
      weekly_scans_used = 1,
      last_scan_reset_date = CURRENT_DATE,
      first_scan_completed_at = COALESCE(first_scan_completed_at, NOW()),
      results_unlocked_until = NOW() + INTERVAL '24 hours',
      updated_at = NOW()
    WHERE id = user_uuid;
  ELSE
    -- Increment scan count
    UPDATE public.trial_tracking
    SET 
      weekly_scans_used = weekly_scans_used + 1,
      first_scan_completed_at = COALESCE(first_scan_completed_at, NOW()),
      results_unlocked_until = NOW() + INTERVAL '24 hours',
      updated_at = NOW()
    WHERE id = user_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start trial (requires payment method)
CREATE OR REPLACE FUNCTION public.start_user_trial(user_uuid UUID, trial_days INTEGER DEFAULT 7)
RETURNS VOID AS $$
BEGIN
  UPDATE public.trial_tracking
  SET 
    trial_started_at = NOW(),
    trial_ends_at = NOW() + (trial_days || ' days')::INTERVAL,
    is_trial_active = TRUE,
    is_trial_expired = FALSE,
    has_added_payment = TRUE,
    payment_added_at = NOW(),
    weekly_scans_used = 0,
    trial_scans_used = 0,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track paywall views (for conversion analytics)
CREATE OR REPLACE FUNCTION public.track_paywall_view(user_uuid UUID, source TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.trial_tracking
  SET 
    shown_paywall_count = shown_paywall_count + 1,
    last_paywall_shown_at = NOW(),
    conversion_source = COALESCE(source, conversion_source),
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user conversion status
CREATE OR REPLACE FUNCTION public.get_user_conversion_status(user_uuid UUID)
RETURNS TABLE (
  is_premium BOOLEAN,
  in_trial BOOLEAN,
  trial_days_left INTEGER,
  can_scan BOOLEAN,
  can_view_results BOOLEAN,
  scans_left_this_week INTEGER,
  results_expire_in_hours INTEGER,
  has_payment_method BOOLEAN,
  paywall_views INTEGER,
  conversion_stage TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.is_premium,
    (tt.trial_ends_at > NOW() AND tt.is_trial_active AND NOT tt.is_trial_expired) as in_trial,
    CASE 
      WHEN tt.trial_ends_at IS NOT NULL 
      THEN EXTRACT(DAY FROM (tt.trial_ends_at - NOW()))::INTEGER
      ELSE 0 
    END as trial_days_left,
    public.can_user_scan(user_uuid) as can_scan,
    public.can_user_view_results(user_uuid) as can_view_results,
    GREATEST(0, tt.max_weekly_scans - tt.weekly_scans_used) as scans_left_this_week,
    CASE 
      WHEN tt.results_unlocked_until IS NOT NULL 
      THEN EXTRACT(HOUR FROM (tt.results_unlocked_until - NOW()))::INTEGER
      ELSE 0 
    END as results_expire_in_hours,
    tt.has_added_payment as has_payment_method,
    tt.shown_paywall_count as paywall_views,
    CASE 
      WHEN p.is_premium THEN 'converted'
      WHEN tt.is_trial_active THEN 'in_trial'
      WHEN tt.has_added_payment THEN 'payment_added'
      WHEN tt.first_scan_completed_at IS NOT NULL THEN 'engaged'
      ELSE 'new'
    END as conversion_stage
  FROM public.profiles p
  LEFT JOIN public.trial_tracking tt ON p.id = tt.id
  WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_trial_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trial_tracking_updated_at ON public.trial_tracking;
CREATE TRIGGER update_trial_tracking_updated_at
  BEFORE UPDATE ON public.trial_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_trial_tracking_timestamp();

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.can_user_scan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_view_results(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_scan_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_user_trial(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_paywall_view(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversion_status(UUID) TO authenticated;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CONVERSION-OPTIMIZED DATABASE SETUP COMPLETE!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Your GlowCheck database now includes:';
  RAISE NOTICE '- Freemium model: 1 scan/week with 24h results access';
  RAISE NOTICE '- 7-day trial: Unlocked after payment method added';
  RAISE NOTICE '- Conversion tracking: Paywall views and user journey stages';
  RAISE NOTICE '- Strategic friction: Results expire to drive upgrades';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CONVERSION FUNNEL:';
  RAISE NOTICE '1. New user → First free scan (aha moment)';
  RAISE NOTICE '2. Results visible for 24h → Creates urgency';
  RAISE NOTICE '3. Paywall after 24h or 2nd scan → Add payment for trial';
  RAISE NOTICE '4. 7-day trial → Full access to build habit';
  RAISE NOTICE '5. Trial ends → Convert to paid subscription';
  RAISE NOTICE '============================================================================';
END $$;
