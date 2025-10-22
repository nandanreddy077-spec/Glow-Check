-- Freemium Tracking Fix
-- This script fixes the scan tracking to properly separate Glow Analysis and Style Check scans

-- 1. Create or update increment_usage_tracking function
CREATE OR REPLACE FUNCTION public.increment_usage_tracking(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_last_reset_date DATE;
  v_current_count INTEGER;
BEGIN
  -- Get current usage tracking
  SELECT last_reset_date, usage_count
  INTO v_last_reset_date, v_current_count
  FROM public.usage_tracking
  WHERE user_id = p_user_id AND feature_type = p_feature_type;

  -- If record exists
  IF FOUND THEN
    -- Check if we need to reset (new day)
    IF v_last_reset_date < v_today THEN
      -- Reset count for new day
      UPDATE public.usage_tracking
      SET 
        usage_count = 1,
        last_reset_date = v_today,
        updated_at = NOW()
      WHERE user_id = p_user_id AND feature_type = p_feature_type;
    ELSE
      -- Increment count
      UPDATE public.usage_tracking
      SET 
        usage_count = usage_count + 1,
        updated_at = NOW()
      WHERE user_id = p_user_id AND feature_type = p_feature_type;
    END IF;
  ELSE
    -- Create new record
    INSERT INTO public.usage_tracking (user_id, feature_type, usage_count, last_reset_date)
    VALUES (p_user_id, p_feature_type, 1, v_today);
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_usage_tracking(UUID, TEXT) TO authenticated;

-- 2. Ensure usage_tracking table has proper indexes
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_feature 
  ON public.usage_tracking(user_id, feature_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_reset_date 
  ON public.usage_tracking(last_reset_date);

-- 3. Add RLS policies for usage_tracking if not exists
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage tracking" ON public.usage_tracking;
CREATE POLICY "Users can view own usage tracking" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own usage tracking" ON public.usage_tracking;
CREATE POLICY "Users can insert own usage tracking" ON public.usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own usage tracking" ON public.usage_tracking;
CREATE POLICY "Users can update own usage tracking" ON public.usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Verify trial_tracking table structure
-- Make sure trial_tracking has the results_unlocked_until column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trial_tracking' 
    AND column_name = 'results_unlocked_until'
  ) THEN
    ALTER TABLE public.trial_tracking 
    ADD COLUMN results_unlocked_until TIMESTAMP WITH TIME ZONE;
  END IF;
END$$;

-- 5. Test the function (optional, can be commented out in production)
-- This will verify the function works correctly
DO $$
DECLARE
  v_test_user_id UUID;
BEGIN
  -- Get a test user ID (first authenticated user)
  SELECT id INTO v_test_user_id FROM auth.users LIMIT 1;
  
  IF v_test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing increment_usage_tracking function with user: %', v_test_user_id;
    -- This will increment or create a usage tracking record
    PERFORM public.increment_usage_tracking(v_test_user_id, 'glow_analysis');
    RAISE NOTICE 'Test successful!';
  ELSE
    RAISE NOTICE 'No users found for testing. Function created successfully but not tested.';
  END IF;
END$$;
