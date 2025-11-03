-- ============================================================================
-- GLOW FORECAST FEATURE - DATABASE SETUP
-- Add this table to your existing Supabase database
-- ============================================================================

-- Create glow_forecasts table
CREATE TABLE IF NOT EXISTS public.glow_forecasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Forecast metadata
  timeframe TEXT NOT NULL CHECK (timeframe IN ('1week', '2weeks', '1month', '3months')),
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Overall prediction
  overall_glow_score JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Detailed metrics
  metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Milestones
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Insights
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Confidence and data quality
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  based_on_photos INTEGER DEFAULT 0,
  based_on_days INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.glow_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own forecasts" ON public.glow_forecasts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own forecasts" ON public.glow_forecasts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own forecasts" ON public.glow_forecasts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own forecasts" ON public.glow_forecasts
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_glow_forecasts_user_id ON public.glow_forecasts(user_id);
CREATE INDEX IF NOT EXISTS idx_glow_forecasts_timeframe ON public.glow_forecasts(user_id, timeframe);
CREATE INDEX IF NOT EXISTS idx_glow_forecasts_created_at ON public.glow_forecasts(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_glow_forecasts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS update_glow_forecasts_updated_at ON public.glow_forecasts;
CREATE TRIGGER update_glow_forecasts_updated_at
  BEFORE UPDATE ON public.glow_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_glow_forecasts_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.glow_forecasts TO authenticated;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'GLOW FORECAST FEATURE DATABASE SETUP COMPLETE!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Table Created: glow_forecasts';
  RAISE NOTICE '✅ Stores AI-powered predictions for users future glow';
  RAISE NOTICE '✅ Tracks multiple timeframes (1 week, 2 weeks, 1 month, 3 months)';
  RAISE NOTICE '✅ Premium feature only (trial + paid users)';
  RAISE NOTICE '============================================================================';
END $$;
