-- =====================================================
-- COMPLETE SUPABASE DATABASE SETUP FOR GLOW APP
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. GLOW ANALYSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.glow_analyses (
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

DROP POLICY IF EXISTS "Users can view own analyses" ON public.glow_analyses;
CREATE POLICY "Users can view own analyses" ON public.glow_analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analyses" ON public.glow_analyses;
CREATE POLICY "Users can insert own analyses" ON public.glow_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. STYLE ANALYSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.style_analyses (
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

DROP POLICY IF EXISTS "Users can view own style analyses" ON public.style_analyses;
CREATE POLICY "Users can view own style analyses" ON public.style_analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own style analyses" ON public.style_analyses;
CREATE POLICY "Users can insert own style analyses" ON public.style_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. SKINCARE PLANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.skincare_plans (
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

DROP POLICY IF EXISTS "Users can view own skincare plans" ON public.skincare_plans;
CREATE POLICY "Users can view own skincare plans" ON public.skincare_plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own skincare plans" ON public.skincare_plans;
CREATE POLICY "Users can insert own skincare plans" ON public.skincare_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own skincare plans" ON public.skincare_plans;
CREATE POLICY "Users can update own skincare plans" ON public.skincare_plans
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own skincare plans" ON public.skincare_plans;
CREATE POLICY "Users can delete own skincare plans" ON public.skincare_plans
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. USER STATS TABLE (GAMIFICATION)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_stats (
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

DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;
CREATE POLICY "Users can view own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
CREATE POLICY "Users can update own stats" ON public.user_stats
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;
CREATE POLICY "Users can insert own stats" ON public.user_stats
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 6. CIRCLES TABLE (COMMUNITY)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.circles (
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

DROP POLICY IF EXISTS "Anyone can view public circles" ON public.circles;
CREATE POLICY "Anyone can view public circles" ON public.circles
  FOR SELECT USING (NOT is_private OR creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can create circles" ON public.circles;
CREATE POLICY "Users can create circles" ON public.circles
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can update their circles" ON public.circles;
CREATE POLICY "Creators can update their circles" ON public.circles
  FOR UPDATE USING (auth.uid() = creator_id);

-- =====================================================
-- 7. USER MEMBERSHIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, circle_id)
);

ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their memberships" ON public.user_memberships;
CREATE POLICY "Users can view their memberships" ON public.user_memberships
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can join circles" ON public.user_memberships;
CREATE POLICY "Users can join circles" ON public.user_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 8. POSTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.posts (
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

DROP POLICY IF EXISTS "Members can view circle posts" ON public.posts;
CREATE POLICY "Members can view circle posts" ON public.posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_memberships 
      WHERE user_id = auth.uid() AND circle_id = posts.circle_id
    )
  );

DROP POLICY IF EXISTS "Members can create posts" ON public.posts;
CREATE POLICY "Members can create posts" ON public.posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.user_memberships 
      WHERE user_id = auth.uid() AND circle_id = posts.circle_id
    )
  );

-- =====================================================
-- 9. COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view comments" ON public.comments;
CREATE POLICY "Members can view comments" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.user_memberships um ON p.circle_id = um.circle_id
      WHERE p.id = comments.post_id AND um.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can create comments" ON public.comments;
CREATE POLICY "Members can create comments" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.user_memberships um ON p.circle_id = um.circle_id
      WHERE p.id = comments.post_id AND um.user_id = auth.uid()
    )
  );

-- =====================================================
-- 10. SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
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

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 11. TRIAL TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.trial_tracking (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 days'),
  glow_analyses_used INTEGER DEFAULT 0,
  style_analyses_used INTEGER DEFAULT 0,
  max_glow_analyses INTEGER DEFAULT 1,
  max_style_analyses INTEGER DEFAULT 1,
  is_trial_expired BOOLEAN DEFAULT FALSE,
  has_added_payment BOOLEAN DEFAULT FALSE,
  payment_added_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.trial_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own trial tracking" ON public.trial_tracking;
CREATE POLICY "Users can view own trial tracking" ON public.trial_tracking
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own trial tracking" ON public.trial_tracking;
CREATE POLICY "Users can insert own trial tracking" ON public.trial_tracking
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own trial tracking" ON public.trial_tracking;
CREATE POLICY "Users can update own trial tracking" ON public.trial_tracking
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- 12. FUNCTIONS
-- =====================================================

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

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_skincare_plans_updated_at ON public.skincare_plans;
CREATE TRIGGER update_skincare_plans_updated_at
  BEFORE UPDATE ON public.skincare_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_stats_updated_at ON public.user_stats;
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trial_tracking_updated_at ON public.trial_tracking;
CREATE TRIGGER update_trial_tracking_updated_at
  BEFORE UPDATE ON public.trial_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_circles_updated_at ON public.circles;
CREATE TRIGGER update_circles_updated_at
  BEFORE UPDATE ON public.circles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
  SELECT (trial_ends_at > NOW() AND NOT is_trial_expired AND has_added_payment)
  INTO trial_valid
  FROM public.trial_tracking
  WHERE id = user_uuid;
  
  RETURN COALESCE(trial_valid, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use glow analysis
CREATE OR REPLACE FUNCTION public.can_use_glow_analysis(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_subscription BOOLEAN;
  in_trial BOOLEAN;
  analyses_remaining INTEGER;
BEGIN
  has_subscription := public.has_active_subscription(user_uuid);
  
  IF has_subscription THEN
    RETURN TRUE;
  END IF;
  
  SELECT 
    (trial_ends_at > NOW() AND NOT is_trial_expired AND has_added_payment),
    (max_glow_analyses - glow_analyses_used)
  INTO in_trial, analyses_remaining
  FROM public.trial_tracking
  WHERE id = user_uuid;
  
  RETURN COALESCE(in_trial AND analyses_remaining > 0, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use style analysis
CREATE OR REPLACE FUNCTION public.can_use_style_analysis(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_subscription BOOLEAN;
  in_trial BOOLEAN;
  analyses_remaining INTEGER;
BEGIN
  has_subscription := public.has_active_subscription(user_uuid);
  
  IF has_subscription THEN
    RETURN TRUE;
  END IF;
  
  SELECT 
    (trial_ends_at > NOW() AND NOT is_trial_expired AND has_added_payment),
    (max_style_analyses - style_analyses_used)
  INTO in_trial, analyses_remaining
  FROM public.trial_tracking
  WHERE id = user_uuid;
  
  RETURN COALESCE(in_trial AND analyses_remaining > 0, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment glow analysis usage
CREATE OR REPLACE FUNCTION public.increment_glow_analysis_usage(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.trial_tracking
  SET 
    glow_analyses_used = glow_analyses_used + 1,
    is_trial_expired = CASE
      WHEN (glow_analyses_used + 1 >= max_glow_analyses AND style_analyses_used >= max_style_analyses) 
           OR NOW() > trial_ends_at THEN TRUE
      ELSE FALSE
    END,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment style analysis usage
CREATE OR REPLACE FUNCTION public.increment_style_analysis_usage(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.trial_tracking
  SET 
    style_analyses_used = style_analyses_used + 1,
    is_trial_expired = CASE
      WHEN (style_analyses_used + 1 >= max_style_analyses AND glow_analyses_used >= max_glow_analyses) 
           OR NOW() > trial_ends_at THEN TRUE
      ELSE FALSE
    END,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark payment as added
CREATE OR REPLACE FUNCTION public.mark_payment_added(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.trial_tracking
  SET 
    has_added_payment = TRUE,
    payment_added_at = NOW(),
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user subscription status (MAIN FUNCTION USED BY APP)
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(user_uuid UUID)
RETURNS TABLE (
  is_premium BOOLEAN,
  subscription_product_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  in_trial BOOLEAN,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  glow_analyses_remaining INTEGER,
  style_analyses_remaining INTEGER,
  has_added_payment BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    public.has_active_subscription(user_uuid) as is_premium,
    s.product_id as subscription_product_id,
    s.expires_at,
    public.is_in_trial_period(user_uuid) as in_trial,
    tt.trial_ends_at,
    GREATEST(0, tt.max_glow_analyses - tt.glow_analyses_used) as glow_analyses_remaining,
    GREATEST(0, tt.max_style_analyses - tt.style_analyses_used) as style_analyses_remaining,
    COALESCE(tt.has_added_payment, FALSE) as has_added_payment
  FROM public.trial_tracking tt
  LEFT JOIN public.subscriptions s ON s.user_id = tt.id 
    AND s.status = 'active' 
    AND (s.expires_at IS NULL OR s.expires_at > NOW())
  WHERE tt.id = user_uuid
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 13. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_glow_analyses_user_id ON public.glow_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_glow_analyses_created_at ON public.glow_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_style_analyses_user_id ON public.style_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_style_analyses_created_at ON public.style_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skincare_plans_user_id ON public.skincare_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_skincare_plans_active ON public.skincare_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_trial_tracking_expires ON public.trial_tracking(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_circles_creator ON public.circles(creator_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_user ON public.user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_circle ON public.user_memberships(circle_id);
CREATE INDEX IF NOT EXISTS idx_posts_circle ON public.posts(circle_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
