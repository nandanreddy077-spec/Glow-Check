-- Supabase Functions Setup for Glow App
-- Run this in your Supabase SQL Editor to create all necessary functions
-- This should be run AFTER running the main database setup

-- 1. Create function to get user subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(user_uuid UUID)
RETURNS TABLE (
  is_premium BOOLEAN,
  subscription_status TEXT,
  subscription_product_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_trial BOOLEAN,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  analyses_used INTEGER,
  max_analyses INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      (SELECT s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
       FROM public.subscriptions s
       WHERE s.user_id = user_uuid
       ORDER BY s.created_at DESC
       LIMIT 1),
      FALSE
    ) as is_premium,
    (SELECT s.status
     FROM public.subscriptions s
     WHERE s.user_id = user_uuid
     ORDER BY s.created_at DESC
     LIMIT 1) as subscription_status,
    (SELECT s.product_id
     FROM public.subscriptions s
     WHERE s.user_id = user_uuid
     ORDER BY s.created_at DESC
     LIMIT 1) as subscription_product_id,
    (SELECT s.expires_at
     FROM public.subscriptions s
     WHERE s.user_id = user_uuid
     ORDER BY s.created_at DESC
     LIMIT 1) as expires_at,
    COALESCE(
      (SELECT t.trial_ends_at > NOW() AND NOT t.is_trial_expired
       FROM public.trial_tracking t
       WHERE t.id = user_uuid),
      FALSE
    ) as is_trial,
    (SELECT t.trial_ends_at
     FROM public.trial_tracking t
     WHERE t.id = user_uuid) as trial_ends_at,
    COALESCE(
      (SELECT t.analyses_used
       FROM public.trial_tracking t
       WHERE t.id = user_uuid),
      0
    ) as analyses_used,
    COALESCE(
      (SELECT t.max_analyses
       FROM public.trial_tracking t
       WHERE t.id = user_uuid),
      3
    ) as max_analyses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create function to record payment method addition
CREATE OR REPLACE FUNCTION public.record_payment_method_added(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET 
    has_added_payment = TRUE,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to start trial with payment
CREATE OR REPLACE FUNCTION public.start_trial_with_payment(
  user_uuid UUID,
  platform_type TEXT,
  product_id_param TEXT,
  transaction_id_param TEXT DEFAULT NULL,
  purchase_token_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.trial_tracking
  SET 
    trial_started_at = NOW(),
    trial_ends_at = NOW() + INTERVAL '3 days',
    analyses_used = 0,
    is_trial_expired = FALSE,
    updated_at = NOW()
  WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    INSERT INTO public.trial_tracking (id, trial_started_at, trial_ends_at, analyses_used, is_trial_expired)
    VALUES (user_uuid, NOW(), NOW() + INTERVAL '3 days', 0, FALSE);
  END IF;
  
  UPDATE public.profiles
  SET 
    has_added_payment = TRUE,
    updated_at = NOW()
  WHERE id = user_uuid;
  
  INSERT INTO public.subscriptions (
    user_id,
    platform,
    product_id,
    transaction_id,
    purchase_token,
    status,
    is_trial,
    trial_ends_at,
    expires_at
  ) VALUES (
    user_uuid,
    platform_type,
    product_id_param,
    transaction_id_param,
    purchase_token_param,
    'pending',
    TRUE,
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '3 days'
  )
  ON CONFLICT (transaction_id) 
  DO UPDATE SET
    status = 'pending',
    is_trial = TRUE,
    trial_ends_at = NOW() + INTERVAL '3 days',
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to activate subscription after trial
CREATE OR REPLACE FUNCTION public.activate_subscription_after_trial(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.subscriptions
  SET 
    status = 'active',
    is_trial = FALSE,
    expires_at = CASE 
      WHEN product_id LIKE '%annual%' OR product_id LIKE '%yearly%' THEN NOW() + INTERVAL '1 year'
      ELSE NOW() + INTERVAL '1 month'
    END,
    updated_at = NOW()
  WHERE user_id = user_uuid
    AND status = 'pending'
    AND is_trial = TRUE;
    
  UPDATE public.profiles
  SET 
    is_premium = TRUE,
    subscription_status = 'active',
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to check if user can perform analysis
CREATE OR REPLACE FUNCTION public.can_perform_analysis(user_uuid UUID, analysis_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  is_premium_user BOOLEAN;
  in_trial BOOLEAN;
  analyses_count INTEGER;
  max_count INTEGER;
BEGIN
  SELECT 
    EXISTS(
      SELECT 1 FROM public.subscriptions
      WHERE user_id = user_uuid
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
    )
  INTO is_premium_user;
  
  IF is_premium_user THEN
    RETURN TRUE;
  END IF;
  
  SELECT 
    (trial_ends_at > NOW() AND NOT is_trial_expired),
    analyses_used,
    max_analyses
  INTO in_trial, analyses_count, max_count
  FROM public.trial_tracking
  WHERE id = user_uuid;
  
  IF in_trial AND analyses_count < max_count THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_added_payment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_product_id TEXT,
ADD COLUMN IF NOT EXISTS revenuecat_user_id TEXT;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_has_payment ON public.profiles(has_added_payment);

-- 8. Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, has_added_payment, is_premium)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', FALSE, FALSE)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_stats (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.trial_tracking (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to track scan usage
CREATE OR REPLACE FUNCTION public.track_scan_usage(
  user_uuid UUID,
  scan_type TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.trial_tracking
  SET 
    analyses_used = analyses_used + 1,
    is_trial_expired = CASE
      WHEN analyses_used + 1 >= max_analyses OR NOW() > trial_ends_at THEN TRUE
      ELSE FALSE
    END,
    updated_at = NOW()
  WHERE id = user_uuid;
  
  UPDATE public.user_stats
  SET 
    total_analyses = total_analyses + 1,
    last_analysis_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to get trial status
CREATE OR REPLACE FUNCTION public.get_trial_status(user_uuid UUID)
RETURNS TABLE (
  has_started_trial BOOLEAN,
  is_in_trial BOOLEAN,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  analyses_used INTEGER,
  max_analyses INTEGER,
  scans_remaining INTEGER,
  has_added_payment BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(t.trial_started_at IS NOT NULL, FALSE) as has_started_trial,
    COALESCE(t.trial_ends_at > NOW() AND NOT t.is_trial_expired, FALSE) as is_in_trial,
    t.trial_ends_at,
    COALESCE(t.analyses_used, 0) as analyses_used,
    COALESCE(t.max_analyses, 3) as max_analyses,
    GREATEST(0, COALESCE(t.max_analyses, 3) - COALESCE(t.analyses_used, 0)) as scans_remaining,
    COALESCE(p.has_added_payment, FALSE) as has_added_payment
  FROM public.trial_tracking t
  LEFT JOIN public.profiles p ON p.id = t.id
  WHERE t.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify all functions were created successfully
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_subscription_status',
    'record_payment_method_added',
    'start_trial_with_payment',
    'activate_subscription_after_trial',
    'can_perform_analysis',
    'track_scan_usage',
    'get_trial_status',
    'handle_new_user'
  )
ORDER BY routine_name;
