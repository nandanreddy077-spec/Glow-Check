-- =====================================================
-- FIX SUBSCRIPTION STATUS FUNCTION
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_subscription_status(UUID);

-- Recreate the function with correct column references
CREATE OR REPLACE FUNCTION public.get_subscription_status(user_uuid UUID)
RETURNS TABLE (
  has_subscription BOOLEAN,
  in_trial BOOLEAN,
  trial_expired BOOLEAN,
  glow_analyses_remaining INTEGER,
  style_analyses_remaining INTEGER,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  has_added_payment BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    public.has_active_subscription(user_uuid) as has_subscription,
    public.is_in_trial_period(user_uuid) as in_trial,
    COALESCE(tt.is_trial_expired, FALSE) as trial_expired,
    GREATEST(0, tt.max_glow_analyses - tt.glow_analyses_used) as glow_analyses_remaining,
    GREATEST(0, tt.max_style_analyses - tt.style_analyses_used) as style_analyses_remaining,
    tt.trial_ends_at,
    COALESCE(tt.has_added_payment, FALSE) as has_added_payment
  FROM public.trial_tracking tt
  WHERE tt.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
