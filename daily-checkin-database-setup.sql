-- Daily Check-In System Database Setup
-- This enhances GlowCheck with daily ritual tracking for better retention

-- =====================================================
-- DAILY CHECK-INS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    ritual_type TEXT NOT NULL CHECK (ritual_type IN ('morning', 'evening', 'full')),
    
    -- Checklist items (boolean)
    skincare BOOLEAN DEFAULT false,
    water BOOLEAN DEFAULT false,
    sunscreen BOOLEAN DEFAULT false,
    makeup_removal BOOLEAN DEFAULT false,
    sleep BOOLEAN DEFAULT false,
    vitamins BOOLEAN DEFAULT false,
    
    -- Ratings (1-5 scale)
    mood INTEGER CHECK (mood >= 0 AND mood <= 5),
    energy INTEGER CHECK (energy >= 0 AND energy <= 5),
    skin_feeling INTEGER CHECK (skin_feeling >= 0 AND skin_feeling <= 5),
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 5),
    
    -- Optional fields
    selfie_url TEXT,
    notes TEXT,
    
    -- Calculated fields
    completeness INTEGER DEFAULT 0 CHECK (completeness >= 0 AND completeness <= 100),
    reward_points INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one check-in per user per date
    UNIQUE(user_id, date)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON public.daily_checkins(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_created ON public.daily_checkins(user_id, created_at DESC);

-- =====================================================
-- DAILY HABITS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT '✨',
    ritual_time TEXT NOT NULL CHECK (ritual_time IN ('morning', 'evening', 'both')),
    streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    total_completions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_habits_user ON public.daily_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_habits_active ON public.daily_habits(user_id, is_active);

-- =====================================================
-- CHECK-IN REWARDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.checkin_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('streak', 'consistency', 'milestone', 'perfect_week', 'comeback')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    badge_icon TEXT,
    badge_color TEXT,
    badge_rarity TEXT CHECK (badge_rarity IN ('common', 'rare', 'epic', 'legendary')),
    claimed BOOLEAN DEFAULT false,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkin_rewards_user ON public.checkin_rewards(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkin_rewards_unclaimed ON public.checkin_rewards(user_id, claimed) WHERE claimed = false;

-- =====================================================
-- WEEKLY INSIGHTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.weekly_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    summary TEXT NOT NULL,
    highlights JSONB DEFAULT '[]'::jsonb,
    concerns JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    progress_score INTEGER DEFAULT 0 CHECK (progress_score >= 0 AND progress_score <= 100),
    checkins_completed INTEGER DEFAULT 0,
    target_checkins INTEGER DEFAULT 14,
    average_mood DECIMAL(3,2),
    average_energy DECIMAL(3,2),
    average_skin_feeling DECIMAL(3,2),
    average_confidence DECIMAL(3,2),
    total_points INTEGER DEFAULT 0,
    perfect_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_insights_user ON public.weekly_insights(user_id, week_start_date DESC);

-- =====================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_insights ENABLE ROW LEVEL SECURITY;

-- Daily Check-ins Policies
CREATE POLICY "Users can view their own check-ins"
    ON public.daily_checkins FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own check-ins"
    ON public.daily_checkins FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-ins"
    ON public.daily_checkins FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own check-ins"
    ON public.daily_checkins FOR DELETE
    USING (auth.uid() = user_id);

-- Daily Habits Policies
CREATE POLICY "Users can view their own habits"
    ON public.daily_habits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits"
    ON public.daily_habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
    ON public.daily_habits FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
    ON public.daily_habits FOR DELETE
    USING (auth.uid() = user_id);

-- Check-in Rewards Policies
CREATE POLICY "Users can view their own rewards"
    ON public.checkin_rewards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards"
    ON public.checkin_rewards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards"
    ON public.checkin_rewards FOR UPDATE
    USING (auth.uid() = user_id);

-- Weekly Insights Policies
CREATE POLICY "Users can view their own insights"
    ON public.weekly_insights FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights"
    ON public.weekly_insights FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
    ON public.weekly_insights FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate current streak
CREATE OR REPLACE FUNCTION calculate_checkin_streak(p_user_id UUID)
RETURNS TABLE(current_streak INTEGER, longest_streak INTEGER, total_checkins INTEGER, last_checkin_date DATE) AS $$
DECLARE
    v_current_streak INTEGER := 0;
    v_longest_streak INTEGER := 0;
    v_temp_streak INTEGER := 0;
    v_total INTEGER := 0;
    v_last_date DATE;
    v_prev_date DATE;
    checkin_record RECORD;
BEGIN
    -- Get total check-ins
    SELECT COUNT(*) INTO v_total
    FROM public.daily_checkins
    WHERE user_id = p_user_id;
    
    -- Get last check-in date
    SELECT date INTO v_last_date
    FROM public.daily_checkins
    WHERE user_id = p_user_id
    ORDER BY date DESC
    LIMIT 1;
    
    -- If no check-ins, return zeros
    IF v_total = 0 THEN
        RETURN QUERY SELECT 0, 0, 0, NULL::DATE;
        RETURN;
    END IF;
    
    -- Calculate streaks
    v_prev_date := NULL;
    FOR checkin_record IN 
        SELECT DISTINCT date
        FROM public.daily_checkins
        WHERE user_id = p_user_id
        ORDER BY date DESC
    LOOP
        IF v_prev_date IS NULL THEN
            v_current_streak := 1;
            v_temp_streak := 1;
            v_prev_date := checkin_record.date;
        ELSE
            IF checkin_record.date = v_prev_date - INTERVAL '1 day' THEN
                v_current_streak := v_current_streak + 1;
                v_temp_streak := v_temp_streak + 1;
            ELSE
                v_temp_streak := 1;
            END IF;
            v_prev_date := checkin_record.date;
        END IF;
        
        v_longest_streak := GREATEST(v_longest_streak, v_temp_streak);
    END LOOP;
    
    -- Check if streak is broken (more than 1 day gap)
    IF v_last_date < CURRENT_DATE - INTERVAL '1 day' THEN
        v_current_streak := 0;
    END IF;
    
    RETURN QUERY SELECT v_current_streak, v_longest_streak, v_total, v_last_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unclaimed rewards
CREATE OR REPLACE FUNCTION get_unclaimed_rewards(p_user_id UUID)
RETURNS SETOF public.checkin_rewards AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.checkin_rewards
    WHERE user_id = p_user_id
      AND claimed = false
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim a reward
CREATE OR REPLACE FUNCTION claim_reward(p_reward_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.checkin_rewards
    SET claimed = true,
        claimed_at = NOW()
    WHERE id = p_reward_id
      AND user_id = p_user_id
      AND claimed = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get weekly progress
CREATE OR REPLACE FUNCTION get_weekly_progress(p_user_id UUID, p_week_start DATE)
RETURNS TABLE(
    checkins_count INTEGER,
    avg_mood DECIMAL,
    avg_energy DECIMAL,
    avg_skin DECIMAL,
    avg_confidence DECIMAL,
    total_points INTEGER,
    perfect_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as checkins_count,
        ROUND(AVG(mood), 2) as avg_mood,
        ROUND(AVG(energy), 2) as avg_energy,
        ROUND(AVG(skin_feeling), 2) as avg_skin,
        ROUND(AVG(confidence), 2) as avg_confidence,
        SUM(reward_points)::INTEGER as total_points,
        COUNT(CASE WHEN ritual_type = 'full' THEN 1 END)::INTEGER as perfect_days
    FROM public.daily_checkins
    WHERE user_id = p_user_id
      AND date >= p_week_start
      AND date < p_week_start + INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_checkins_updated_at
    BEFORE UPDATE ON public.daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_habits_updated_at
    BEFORE UPDATE ON public.daily_habits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant authenticated users access to tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_checkins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_habits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.checkin_rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.weekly_insights TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION calculate_checkin_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unclaimed_rewards(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_reward(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_progress(UUID, DATE) TO authenticated;

-- =====================================================
-- SAMPLE DATA FOR TESTING (Optional - Remove in production)
-- =====================================================

-- This is commented out by default. Uncomment to insert sample data for testing.

/*
-- Create a test check-in
INSERT INTO public.daily_checkins (
    user_id,
    date,
    ritual_type,
    skincare,
    water,
    sunscreen,
    mood,
    energy,
    skin_feeling,
    confidence,
    completeness,
    reward_points
) VALUES (
    auth.uid(),
    CURRENT_DATE,
    'morning',
    true,
    true,
    true,
    4,
    4,
    4,
    4,
    85,
    120
);
*/

-- =====================================================
-- NOTES
-- =====================================================

/*
USAGE INSTRUCTIONS:

1. Run this SQL in your Supabase SQL Editor
2. All tables will be created with proper RLS policies
3. Users can only access their own data
4. Helper functions are available for:
   - calculate_checkin_streak(user_id) - Get current and longest streak
   - get_unclaimed_rewards(user_id) - Get unclaimed rewards
   - claim_reward(reward_id, user_id) - Claim a reward
   - get_weekly_progress(user_id, week_start_date) - Get weekly stats

MOBILE APP INTEGRATION:
- Store data locally using AsyncStorage for offline support
- Sync with Supabase when online
- Use optimistic updates for better UX

RETENTION STRATEGY:
- Daily check-ins create habit loops
- Streaks provide motivation
- Weekly insights show transformation
- Rewards gamify the experience
- Morning/Evening rituals = 2x daily opens

TARGET METRICS:
- 60%+ 7-day retention (from daily habit)
- 40%+ 30-day retention (from weekly insights)
- 15%+ conversion (from transformation proof)
*/
