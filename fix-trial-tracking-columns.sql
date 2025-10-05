-- Fix trial_tracking table columns
-- Run this in your Supabase SQL Editor

-- Check if old columns exist and drop them if needed
DO $$ 
BEGIN
    -- Drop old columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'trial_tracking' AND column_name = 'analyses_used') THEN
        ALTER TABLE public.trial_tracking DROP COLUMN analyses_used;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'trial_tracking' AND column_name = 'max_analyses') THEN
        ALTER TABLE public.trial_tracking DROP COLUMN max_analyses;
    END IF;
END $$;

-- Add new columns if they don't exist
ALTER TABLE public.trial_tracking 
ADD COLUMN IF NOT EXISTS glow_analyses_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS style_analyses_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_glow_analyses INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_style_analyses INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS has_added_payment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_added_at TIMESTAMP WITH TIME ZONE;

-- Update existing rows to have the new default values
UPDATE public.trial_tracking
SET 
    glow_analyses_used = COALESCE(glow_analyses_used, 0),
    style_analyses_used = COALESCE(style_analyses_used, 0),
    max_glow_analyses = COALESCE(max_glow_analyses, 1),
    max_style_analyses = COALESCE(max_style_analyses, 1),
    has_added_payment = COALESCE(has_added_payment, FALSE)
WHERE glow_analyses_used IS NULL 
   OR style_analyses_used IS NULL 
   OR max_glow_analyses IS NULL 
   OR max_style_analyses IS NULL
   OR has_added_payment IS NULL;

-- Verify the columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'trial_tracking'
  AND table_schema = 'public'
ORDER BY ordinal_position;
