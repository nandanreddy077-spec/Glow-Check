-- ============================================================================
-- FIX CONVERSION ANALYTICS VIEW SECURITY
-- ============================================================================
-- This script adds proper Row Level Security to the conversion_analytics view
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Drop the existing unrestricted view
DROP VIEW IF EXISTS public.conversion_analytics CASCADE;

-- Recreate the view with proper structure
CREATE VIEW public.conversion_analytics AS
SELECT 
  p.id as user_id,
  p.created_at as signup_date,
  p.subscription_status,
  p.is_premium,
  tt.trial_started_at,
  tt.trial_ends_at,
  tt.analyses_used,
  tt.is_trial_expired,
  s.purchased_at as subscription_purchased_at,
  s.product_id as subscription_product_id,
  CASE 
    WHEN s.id IS NOT NULL THEN 'converted'
    WHEN tt.is_trial_expired THEN 'trial_expired'
    WHEN tt.trial_ends_at > NOW() THEN 'in_trial'
    ELSE 'free'
  END as conversion_status,
  EXTRACT(EPOCH FROM (COALESCE(s.purchased_at, NOW()) - p.created_at)) / 86400 as days_to_conversion
FROM public.profiles p
LEFT JOIN public.trial_tracking tt ON p.id = tt.id
LEFT JOIN public.subscriptions s ON p.id = s.user_id AND s.status = 'active';

-- Enable RLS on the view
ALTER VIEW public.conversion_analytics SET (security_invoker = true);

-- Grant access only to authenticated users for their own data
GRANT SELECT ON public.conversion_analytics TO authenticated;

-- Add comment
COMMENT ON VIEW public.conversion_analytics IS 'Analytics view for tracking user conversion funnel - RLS enabled';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify the view is working:
-- SELECT * FROM public.conversion_analytics WHERE user_id = auth.uid();
-- ============================================================================
