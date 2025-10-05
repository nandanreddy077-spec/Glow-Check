-- ============================================
-- COMPLETE FRESH SUPABASE SETUP FOR GLOW APP
-- ============================================
-- This script will drop all existing tables and recreate them
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: DROP ALL EXISTING TABLES AND FUNCTIONS
-- ============================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_skincare_plans_updated_at ON public.skincare_plans;
DROP TRIGGER IF EXISTS update_user_stats_updated_at ON public.user_stats;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS update_trial_tracking_updated_at ON public.trial_tracking;
DROP TRIGGER IF EXISTS update_circles_updated_at ON public.circles;
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.has_active_subscription(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_in_trial_period(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.increment_trial_usage(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_subscription_status(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_subscription_status(UUID) CASCADE;

-- Drop all tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.user_memberships CASCADE;
DROP TABLE IF EXISTS public.circles CASCADE;
DROP TABLE IF EXISTS public.trial_tracking CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.skincare_plans CASCADE;
DROP TABLE IF EXISTS public.style_analyses CASCADE;
DROP TABLE IF EXISTS public.glow_analyses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================
-- STEP 2: CREATE ALL TABLES
-- ============================================

-- 1. Profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Glow analyses table
CREATE TABLE public.glow_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  skin_score INTEGER CHECK (skin_score >= 0 AND skin_score <= 100),
  makeup_score INTEGER CHECK (makeup_score >= 0 AND makeup_score <= 100),
  hair_score INTEGER CHECK (hair_score >= 0 AND hair_score <= 100),
  recommendations JSONB,
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.glow_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses" ON public.glow_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.glow_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Style analyses table
CREATE TABLE public.style_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT,
  occasion TEXT,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  color_harmony_score INTEGER CHECK (color_harmony_score >= 0 AND color_harmony_score <= 100),
  fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
  style_score INTEGER CHECK (style_score >= 0 AND style_score <= 100),
  dominant_colors JSONB,
  recommended_colors JSONB,
  recommendations JSONB,
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.style_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own style analyses" ON public.style_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own style analyses" ON public.style_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Skincare plans table
CREATE TABLE public.skincare_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  plan_data JSONB,
  progress JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.skincare_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skincare plans" ON public.skincare_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skincare plans" ON public.skincare_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skincare plans" ON public.skincare_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own skincare plans" ON public.skincare_plans
  FOR DELETE USING (auth.uid() = user_id);

-- 5. User stats table
CREATE TABLE public.user_stats (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_analyses INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  glow_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  last_analysis_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own stats" ON public.user_stats
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own stats" ON public.user_stats
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  product_id TEXT NOT NULL,
  transaction_id TEXT UNIQUE,
  original_transaction_id TEXT,
  purchase_token TEXT,
  receipt_data TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending', 'grace_period', 'on_hold')),
  expires_at TIMESTAMP WITH TIME ZONE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  auto_renew BOOLEAN DEFAULT TRUE,
  is_trial BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Trial tracking table
CREATE TABLE public.trial_tracking (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 days'),
  glow_analyses_used INTEGER DEFAULT 0,
  style_analyses_used INTEGER DEFAULT 0,
  max_analyses INTEGER DEFAULT 3,
  is_trial_expired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.trial_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trial tracking" ON public.trial_tracking
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own trial tracking" ON public.trial_tracking
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own trial tracking" ON public.trial_tracking
  FOR UPDATE USING (auth.uid() = id);

-- 8. Circles table
CREATE TABLE public.circles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_count INTEGER DEFAULT 1,
  is_private BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  location_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public circles" ON public.circles
  FOR SELECT USING (NOT is_private OR creator_id = auth.uid());

CREATE POLICY "Users can create circles" ON public.circles
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their circles" ON public.circles
  FOR UPDATE USING (auth.uid() = creator_id);

-- 9. User memberships table
CREATE TABLE public.user_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, circle_id)
);

ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their memberships" ON public.user_memberships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join circles" ON public.user_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. Posts table
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  caption TEXT NOT NULL,
  image_url TEXT,
  location_name TEXT,
  coords JSONB,
  reactions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view circle posts" ON public.posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_memberships 
      WHERE user_id = auth.uid() AND circle_id = posts.circle_id
    )
  );

CREATE POLICY "Members can create posts" ON public.posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.user_memberships 
      WHERE user_id = auth.uid() AND circle_id = posts.circle_id
    )
  );

-- 11. Comments table
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view comments" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.user_memberships um ON p.circle_id = um.circle_id
      WHERE p.id = comments.post_id AND um.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create comments" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.user_memberships um ON p.circle_id = um.circle_id
      WHERE p.id = comments.post_id AND um.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 3: CREATE INDEXES
-- ============================================

CREATE INDEX idx_glow_analyses_user_id ON public.glow_analyses(user_id);
CREATE INDEX idx_glow_analyses_created_at ON public.glow_analyses(created_at DESC);
CREATE INDEX idx_style_analyses_user_id ON public.style_analyses(user_id);
CREATE INDEX idx_style_analyses_created_at ON public.style_analyses(created_at DESC);
CREATE INDEX idx_skincare_plans_user_id ON public.skincare_plans(user_id);
CREATE INDEX idx_skincare_plans_active ON public.skincare_plans(user_id, is_active);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_expires_at ON public.subscriptions(expires_at);
CREATE INDEX idx_trial_tracking_expires ON public.trial_tracking(trial_ends_at);
CREATE INDEX idx_circles_creator ON public.circles(creator_id);
CREATE INDEX idx_user_memberships_user ON public.user_memberships(user_id);
CREATE INDEX idx_user_memberships_circle ON public.user_memberships(circle_id);
CREATE INDEX idx_posts_circle ON public.posts(circle_id);
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_comments_post ON public.comments(post_id);

-- ============================================
-- STEP 4: CREATE FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_stats (id)
  VALUES (NEW.id);
  
  INSERT INTO public.trial_tracking (id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  active_sub_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO active_sub_count
  FROM public.subscriptions
  WHERE user_id = user_uuid
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN active_sub_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is in trial period
CREATE OR REPLACE FUNCTION public.is_in_trial_period(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  trial_valid BOOLEAN := FALSE;
BEGIN
  SELECT (trial_ends_at > NOW() AND NOT is_trial_expired)
  INTO trial_valid
  FROM public.trial_tracking
  WHERE id = user_uuid;
  
  RETURN COALESCE(trial_valid, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment trial usage
CREATE OR REPLACE FUNCTION public.increment_trial_usage(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.trial_tracking
  SET 
    glow_analyses_used = glow_analyses_used + 1,
    is_trial_expired = CASE
      WHEN (glow_analyses_used + style_analyses_used + 1) >= max_analyses OR NOW() > trial_ends_at THEN TRUE
      ELSE FALSE
    END,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user subscription status (THIS IS THE KEY FUNCTION)
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(user_uuid UUID)
RETURNS TABLE(
  is_premium BOOLEAN,
  is_trial BOOLEAN,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  glow_analyses_used INTEGER,
  style_analyses_used INTEGER,
  max_analyses INTEGER,
  subscription_status TEXT,
  subscription_expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      (SELECT TRUE FROM public.subscriptions s 
       WHERE s.user_id = user_uuid 
       AND s.status = 'active' 
       AND (s.expires_at IS NULL OR s.expires_at > NOW())
       LIMIT 1),
      FALSE
    ) as is_premium,
    COALESCE(
      (SELECT (tt.trial_ends_at > NOW() AND NOT tt.is_trial_expired)
       FROM public.trial_tracking tt
       WHERE tt.id = user_uuid),
      FALSE
    ) as is_trial,
    (SELECT tt.trial_ends_at FROM public.trial_tracking tt WHERE tt.id = user_uuid) as trial_ends_at,
    COALESCE((SELECT tt.glow_analyses_used FROM public.trial_tracking tt WHERE tt.id = user_uuid), 0) as glow_analyses_used,
    COALESCE((SELECT tt.style_analyses_used FROM public.trial_tracking tt WHERE tt.id = user_uuid), 0) as style_analyses_used,
    COALESCE((SELECT tt.max_analyses FROM public.trial_tracking tt WHERE tt.id = user_uuid), 3) as max_analyses,
    (SELECT s.status FROM public.subscriptions s 
     WHERE s.user_id = user_uuid 
     ORDER BY s.created_at DESC 
     LIMIT 1) as subscription_status,
    (SELECT s.expires_at FROM public.subscriptions s 
     WHERE s.user_id = user_uuid 
     ORDER BY s.created_at DESC 
     LIMIT 1) as subscription_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: CREATE TRIGGERS
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_skincare_plans_updated_at
  BEFORE UPDATE ON public.skincare_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trial_tracking_updated_at
  BEFORE UPDATE ON public.trial_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_circles_updated_at
  BEFORE UPDATE ON public.circles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- All tables, functions, triggers, and policies have been created successfully.
-- Your Glow app database is now ready to use!
