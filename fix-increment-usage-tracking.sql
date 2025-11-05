-- Fix: Add missing increment_usage_tracking function
-- This function is called by FreemiumContext but was missing from the database

-- Drop existing function if it exists (to handle any signature mismatches)
DROP FUNCTION IF EXISTS public.increment_usage_tracking(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.increment_usage_tracking(TEXT, UUID) CASCADE;

-- Create the increment_usage_tracking function with correct signature
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

-- Verify the function was created
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'increment_usage_tracking function created successfully!';
  RAISE NOTICE 'Function signature: increment_usage_tracking(p_user_id UUID, p_feature_type TEXT)';
  RAISE NOTICE '============================================================================';
END $$;
