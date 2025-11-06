-- ============================================================================
-- FIX: Drop and recreate get_user_subscription_status function
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop ALL possible versions of the function
DROP FUNCTION IF EXISTS public.get_user_subscription_status(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_subscription_status(user_uuid UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_subscription_status(UUID) CASCADE;

-- Now create the correct version
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
    CASE 
      WHEN tt.last_glow_scan_at IS NOT NULL 
      THEN tt.last_glow_scan_at + INTERVAL '4 days'
      ELSE NULL 
    END as next_free_glow_scan_at,
    CASE 
      WHEN tt.last_style_scan_at IS NOT NULL 
      THEN tt.last_style_scan_at + INTERVAL '4 days'
      ELSE NULL 
    END as next_free_style_scan_at,
    CASE
      WHEN tt.results_unlocked_until IS NOT NULL AND tt.results_unlocked_until > NOW()
      THEN EXTRACT(EPOCH FROM (tt.results_unlocked_until - NOW()))::INTEGER / 3600
      ELSE 0
    END as hours_until_results_expire
  FROM public.profiles p
  LEFT JOIN public.trial_tracking tt ON p.id = tt.id
  WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status(UUID) TO authenticated;

-- Verify it was created
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ get_user_subscription_status function fixed!';
  RAISE NOTICE '============================================================================';
END $$;
