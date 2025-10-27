-- ============================================================================
-- GLOW CHECK APP - CONVERSION OPTIMIZED DATABASE SETUP
-- Version: 3.0 - Conversion Optimizations Applied
-- Changes: 7→4 day cooldown, 24→72 hour results viewing
-- Run this entire script in Supabase SQL Editor
-- ============================================================================

-- =====================================================
-- CONVERSION OPTIMIZATION UPDATES
-- These functions have been optimized for better conversion
-- =====================================================

-- Update: Check if user can do a free scan (4-DAY COOLDOWN instead of 7)
CREATE OR REPLACE FUNCTION public.can_do_free_scan(user_uuid UUID, scan_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  last_scan TIMESTAMP WITH TIME ZONE;
  scans_used INTEGER;
BEGIN
  -- Premium users can always scan
  IF public.has_active_subscription(user_uuid) THEN
    RETURN TRUE;
  END IF;
  
  -- Trial users can always scan
  IF public.is_in_trial_period(user_uuid) THEN
    RETURN TRUE;
  END IF;
  
  -- Free users: check specific scan type
  IF scan_type = 'glow_analysis' THEN
    SELECT last_glow_scan_at, total_glow_scans
    INTO last_scan, scans_used
    FROM public.trial_tracking
    WHERE id = user_uuid;
  ELSIF scan_type = 'style_analysis' THEN
    SELECT last_style_scan_at, total_style_scans
    INTO last_scan, scans_used
    FROM public.trial_tracking
    WHERE id = user_uuid;
  ELSE
    RETURN FALSE;
  END IF;
  
  -- First scan of this type is always free
  IF scans_used = 0 OR last_scan IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- CONVERSION OPTIMIZATION: 4-day wait instead of 7 days
  IF last_scan + INTERVAL '4 days' > NOW() THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Update: Record a free scan (72-HOUR RESULTS VIEWING instead of 24)
CREATE OR REPLACE FUNCTION public.record_free_scan(user_uuid UUID, scan_type TEXT)
RETURNS VOID AS $$
BEGIN
  IF scan_type = 'glow_analysis' THEN
    UPDATE public.trial_tracking
    SET 
      first_scan_at = COALESCE(first_scan_at, NOW()),
      last_free_scan_at = NOW(),
      last_glow_scan_at = NOW(),
      free_scans_used = free_scans_used + 1,
      total_glow_scans = total_glow_scans + 1,
      -- CONVERSION OPTIMIZATION: 72 hours instead of 24 hours
      results_unlocked_until = NOW() + INTERVAL '72 hours',
      updated_at = NOW()
    WHERE id = user_uuid;
  ELSIF scan_type = 'style_analysis' THEN
    UPDATE public.trial_tracking
    SET 
      first_scan_at = COALESCE(first_scan_at, NOW()),
      last_free_scan_at = NOW(),
      last_style_scan_at = NOW(),
      free_scans_used = free_scans_used + 1,
      total_style_scans = total_style_scans + 1,
      -- CONVERSION OPTIMIZATION: 72 hours instead of 24 hours
      results_unlocked_until = NOW() + INTERVAL '72 hours',
      updated_at = NOW()
    WHERE id = user_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Update: Get next free scan timestamp helper
CREATE OR REPLACE FUNCTION public.get_next_free_scan_time(user_uuid UUID, scan_type TEXT)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  last_scan TIMESTAMP WITH TIME ZONE;
BEGIN
  IF scan_type = 'glow_analysis' THEN
    SELECT last_glow_scan_at INTO last_scan
    FROM public.trial_tracking
    WHERE id = user_uuid;
  ELSIF scan_type = 'style_analysis' THEN
    SELECT last_style_scan_at INTO last_scan
    FROM public.trial_tracking
    WHERE id = user_uuid;
  ELSE
    RETURN NULL;
  END IF;
  
  IF last_scan IS NULL THEN
    RETURN NOW(); -- Can scan now
  END IF;
  
  -- Return the timestamp when next scan will be available (4 days from last scan)
  RETURN last_scan + INTERVAL '4 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Update subscription status function to include conversion-friendly data
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(user_uuid UUID)
RETURNS TABLE (
  is_premium BOOLEAN,
  subscription_status TEXT,
  subscription_product_id TEXT,
  expires_at TIMESTAMPTZ,
  is_trial BOOLEAN,
  trial_days_remaining INTEGER,
  auto_renewing BOOLEAN,
  can_scan_glow BOOLEAN,
  can_scan_style BOOLEAN,
  can_view_results BOOLEAN,
  can_access_beauty_coach BOOLEAN,
  can_access_progress_photos BOOLEAN,
  can_access_product_shelf BOOLEAN,
  free_scans_used INTEGER,
  total_glow_scans INTEGER,
  total_style_scans INTEGER,
  next_free_glow_scan_at TIMESTAMPTZ,
  next_free_style_scan_at TIMESTAMPTZ,
  results_unlocked_until TIMESTAMPTZ,
  hours_until_results_expire INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.is_premium,
    p.subscription_status,
    p.subscription_product_id,
    p.subscription_expires_at as expires_at,
    p.is_trial_period as is_trial,
    p.trial_days_remaining,
    p.auto_renewing,
    public.can_do_free_scan(user_uuid, 'glow_analysis') as can_scan_glow,
    public.can_do_free_scan(user_uuid, 'style_analysis') as can_scan_style,
    public.can_view_results(user_uuid) as can_view_results,
    public.can_access_beauty_coach(user_uuid) as can_access_beauty_coach,
    public.can_access_progress_photos(user_uuid) as can_access_progress_photos,
    public.can_access_product_shelf(user_uuid) as can_access_product_shelf,
    tt.free_scans_used,
    tt.total_glow_scans,
    tt.total_style_scans,
    public.get_next_free_scan_time(user_uuid, 'glow_analysis') as next_free_glow_scan_at,
    public.get_next_free_scan_time(user_uuid, 'style_analysis') as next_free_style_scan_at,
    tt.results_unlocked_until,
    CASE 
      WHEN tt.results_unlocked_until IS NOT NULL AND tt.results_unlocked_until > NOW()
      THEN EXTRACT(HOURS FROM (tt.results_unlocked_until - NOW()))::INTEGER
      ELSE 0 
    END as hours_until_results_expire
  FROM public.profiles p
  LEFT JOIN public.trial_tracking tt ON p.id = tt.id
  WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.can_do_free_scan(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_free_scan(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_free_scan_time(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status(UUID) TO authenticated;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CONVERSION OPTIMIZATION UPDATES APPLIED!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Key Changes:';
  RAISE NOTICE '✅ Free scan cooldown: 7 days → 4 days';
  RAISE NOTICE '✅ Results viewing window: 24 hours → 72 hours';
  RAISE NOTICE '✅ Added helper function for next scan time calculation';
  RAISE NOTICE '✅ Enhanced subscription status with hours until expiry';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Monetization Flow (Optimized):';
  RAISE NOTICE '📱 FREE TIER:';
  RAISE NOTICE '   - 1 Glow Analysis + 1 Style Check (instant)';
  RAISE NOTICE '   - Results visible for 72 hours (not 24h!)';
  RAISE NOTICE '   - Next free scan: 4 days (not 7!)';
  RAISE NOTICE '';
  RAISE NOTICE '💎 7-DAY TRIAL:';
  RAISE NOTICE '   - Unlimited scans + All features';
  RAISE NOTICE '';
  RAISE NOTICE '💰 PREMIUM:';
  RAISE NOTICE '   - Everything unlimited';
  RAISE NOTICE '============================================================================';
END $$;
