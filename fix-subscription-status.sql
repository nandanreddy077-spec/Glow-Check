-- =====================================================
-- FIX SUBSCRIPTION STATUS FUNCTION
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_subscription_status(UUID);

-- Recreate the function with proper column references
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

-- Verify the trial_tracking table has all required columns
-- If any column is missing, this will add it
DO $$ 
BEGIN
  -- Check and add glow_analyses_used if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trial_tracking' 
    AND column_name = 'glow_analyses_used'
  ) THEN
    ALTER TABLE public.trial_tracking ADD COLUMN glow_analyses_used INTEGER DEFAULT 0;
  END IF;

  -- Check and add style_analyses_used if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trial_tracking' 
    AND column_name = 'style_analyses_used'
  ) THEN
    ALTER TABLE public.trial_tracking ADD COLUMN style_analyses_used INTEGER DEFAULT 0;
  END IF;

  -- Check and add max_glow_analyses if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trial_tracking' 
    AND column_name = 'max_glow_analyses'
  ) THEN
    ALTER TABLE public.trial_tracking ADD COLUMN max_glow_analyses INTEGER DEFAULT 1;
  END IF;

  -- Check and add max_style_analyses if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trial_tracking' 
    AND column_name = 'max_style_analyses'
  ) THEN
    ALTER TABLE public.trial_tracking ADD COLUMN max_style_analyses INTEGER DEFAULT 1;
  END IF;

  -- Check and add has_added_payment if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trial_tracking' 
    AND column_name = 'has_added_payment'
  ) THEN
    ALTER TABLE public.trial_tracking ADD COLUMN has_added_payment BOOLEAN DEFAULT FALSE;
  END IF;

  -- Check and add payment_added_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trial_tracking' 
    AND column_name = 'payment_added_at'
  ) THEN
    ALTER TABLE public.trial_tracking ADD COLUMN payment_added_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Test the function to make sure it works
SELECT * FROM public.get_subscription_status(auth.uid());
