-- ============================================================================
-- COMPLETE FREEMIUM CONVERSION DATABASE SETUP
-- Run this entire script in Supabase SQL Editor
-- ============================================================================

-- =====================================================
-- STEP 1: DROP ALL EXISTING OBJECTS
-- =====================================================

DROP VIEW IF EXISTS public.user_subscription_status CASCADE;
DROP VIEW IF EXISTS public.subscription_analytics CASCADE;
DROP VIEW IF EXISTS public.conversion_analytics CASCADE;

DROP FUNCTION IF EXISTS public.get_user_subscription_status(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_subscription_status(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_active_subscription(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_in_trial_period(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.can_use_glow_analysis(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.can_use_style_analysis(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.increment_glow_analysis_usage(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.increment_style_analysis_usage(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.increment_trial_usage(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.mark_payment_added(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_revenuecat_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.can_do_free_scan(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.can_view_results(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.record_free_scan(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.start_trial_with_payment(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.track_conversion_prompt(UUID, TEXT) CASCADE;

DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.user_memberships CASCADE;
DROP TABLE IF EXISTS public.circles CASCADE;
DROP TABLE IF EXISTS public.revenuecat_events CASCADE;
DROP TABLE IF EXISTS public.usage_tracking CASCADE;
DROP TABLE IF EXISTS public.trial_tracking CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.skincare_plans CASCADE;
DROP TABLE IF EXISTS public.style_analyses CASCADE;
DROP TABLE IF EXISTS public.glow_analyses CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =====================================================
-- STEP 2: ENABLE EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STEP 3: CREATE ALL TABLES
-- =====================================================

-- 1. Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  revenuecat_user_id TEXT,
  subscription_status TEXT DEFAULT 'free',
  subscription_product_id TEXT,
  subscription_expires_at TIMESTAMPTZ,
  is_trial_period BOOLEAN DEFAULT FALSE,
  auto_renewing BOOLEAN DEFAULT TRUE,
  original_transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Glow Analyses Table
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

-- 3. Style Analyses Table
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

-- 4. Skincare Plans Table
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

-- 5. User Stats Table
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

-- 6. Subscriptions Table
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

-- 7. Trial Tracking Table (CRITICAL FOR FREEMIUM FLOW)
CREATE TABLE public.trial_tracking (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Free tier tracking
  first_scan_at TIMESTAMP WITH TIME ZONE,
  last_free_scan_at TIMESTAMP WITH TIME ZONE,
  free_scans_used INTEGER DEFAULT 0,
  results_unlocked_until TIMESTAMP WITH TIME ZONE,
  
  -- Trial tracking
  trial_started_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  has_payment_method BOOLEAN DEFAULT FALSE,
  payment_added_at TIMESTAMP WITH TIME ZONE,
  
  -- Conversion tracking
  conversion_prompts_shown INTEGER DEFAULT 0,
  last_prompt_shown_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  conversion_source TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Usage Tracking Table
CREATE TABLE public.usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('glow_analysis', 'style_analysis', 'skincare_plan', 'ai_coach')),
  usage_count INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_type)
);

-- 9. RevenueCat Events Table
CREATE TABLE public.revenuecat_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  app_user_id TEXT,
  original_app_user_id TEXT,
  product_id TEXT,
  entitlement_id TEXT,
  transaction_id TEXT,
  original_transaction_id TEXT,
  purchase_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  is_trial_period BOOLEAN DEFAULT FALSE,
  auto_renewing BOOLEAN DEFAULT TRUE,
  store TEXT,
  environment TEXT,
  raw_event JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Circles Table (Community Feature)
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

-- 11. User Memberships Table
CREATE TABLE public.user_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, circle_id)
);

-- 12. Posts Table
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

-- 13. Comments Table
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glow_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skincare_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenuecat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: CREATE ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Glow Analyses Policies
CREATE POLICY "Users can view own analyses" ON public.glow_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.glow_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Style Analyses Policies
CREATE POLICY "Users can view own style analyses" ON public.style_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own style analyses" ON public.style_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Skincare Plans Policies
CREATE POLICY "Users can view own skincare plans" ON public.skincare_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skincare plans" ON public.skincare_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skincare plans" ON public.skincare_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own skincare plans" ON public.skincare_plans
  FOR DELETE USING (auth.uid() = user_id);

-- User Stats Policies
CREATE POLICY "Users can view own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own stats" ON public.user_stats
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own stats" ON public.user_stats
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions Policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Trial Tracking Policies
CREATE POLICY "Users can view own trial tracking" ON public.trial_tracking
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own trial tracking" ON public.trial_tracking
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own trial tracking" ON public.trial_tracking
  FOR UPDATE USING (auth.uid() = id);

-- Usage Tracking Policies
CREATE POLICY "Users can view own usage tracking" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage tracking" ON public.usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage tracking" ON public.usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- RevenueCat Events Policies
CREATE POLICY "Service role can insert webhook events" ON public.revenuecat_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view own events" ON public.revenuecat_events
  FOR SELECT USING (
    app_user_id = auth.uid()::text OR 
    original_app_user_id = auth.uid()::text
  );

-- Circles Policies
CREATE POLICY "Anyone can view public circles" ON public.circles
  FOR SELECT USING (NOT is_private OR creator_id = auth.uid());

CREATE POLICY "Users can create circles" ON public.circles
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their circles" ON public.circles
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their circles" ON public.circles
  FOR DELETE USING (auth.uid() = creator_id);

-- User Memberships Policies
CREATE POLICY "Users can view their memberships" ON public.user_memberships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join circles" ON public.user_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave circles" ON public.user_memberships
  FOR DELETE USING (auth.uid() = user_id);

-- Posts Policies
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

CREATE POLICY "Authors can update their posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- Comments Policies
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

CREATE POLICY "Authors can delete their comments" ON public.comments
  FOR DELETE USING (auth.uid() = author_id);

-- =====================================================
-- STEP 6: CREATE FUNCTIONS
-- =====================================================

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
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  INSERT INTO public.user_stats (id)
  VALUES (NEW.id);
  
  INSERT INTO public.trial_tracking (id)
  VALUES (NEW.id);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
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
  SELECT (trial_ends_at > NOW() AND has_payment_method)
  INTO trial_valid
  FROM public.trial_tracking
  WHERE id = user_uuid;
  
  RETURN COALESCE(trial_valid, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform a free scan
CREATE OR REPLACE FUNCTION public.can_do_free_scan(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_scan TIMESTAMP WITH TIME ZONE;
  scans_used INTEGER;
BEGIN
  SELECT last_free_scan_at, free_scans_used
  INTO last_scan, scans_used
  FROM public.trial_tracking
  WHERE id = user_uuid;
  
  -- First scan is always free
  IF scans_used = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- After first scan, must wait 7 days
  IF last_scan IS NOT NULL AND last_scan + INTERVAL '7 days' > NOW() THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view results
CREATE OR REPLACE FUNCTION public.can_view_results(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  unlocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Premium users can always view
  IF public.has_active_subscription(user_uuid) THEN
    RETURN TRUE;
  END IF;
  
  -- Trial users can always view
  IF public.is_in_trial_period(user_uuid) THEN
    RETURN TRUE;
  END IF;
  
  -- Free users can view for 24 hours after scan
  SELECT results_unlocked_until
  INTO unlocked_until
  FROM public.trial_tracking
  WHERE id = user_uuid;
  
  RETURN unlocked_until IS NOT NULL AND unlocked_until > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a free scan
CREATE OR REPLACE FUNCTION public.record_free_scan(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.trial_tracking
  SET 
    first_scan_at = COALESCE(first_scan_at, NOW()),
    last_free_scan_at = NOW(),
    free_scans_used = free_scans_used + 1,
    results_unlocked_until = NOW() + INTERVAL '24 hours',
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start trial with payment
CREATE OR REPLACE FUNCTION public.start_trial_with_payment(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.trial_tracking
  SET 
    trial_started_at = NOW(),
    trial_ends_at = NOW() + INTERVAL '3 days',
    has_payment_method = TRUE,
    payment_added_at = NOW(),
    results_unlocked_until = NULL,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track conversion prompt
CREATE OR REPLACE FUNCTION public.track_conversion_prompt(user_uuid UUID, prompt_source TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.trial_tracking
  SET 
    conversion_prompts_shown = conversion_prompts_shown + 1,
    last_prompt_shown_at = NOW(),
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle RevenueCat webhook events
CREATE OR REPLACE FUNCTION public.handle_revenuecat_webhook()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type IN ('INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE') THEN
    UPDATE public.profiles 
    SET 
      subscription_status = 'premium',
      subscription_product_id = NEW.product_id,
      subscription_expires_at = NEW.expiration_date,
      is_trial_period = NEW.is_trial_period,
      auto_renewing = NEW.auto_renewing,
      original_transaction_id = NEW.original_transaction_id,
      revenuecat_user_id = NEW.app_user_id,
      is_premium = TRUE,
      updated_at = NOW()
    WHERE id::text = NEW.app_user_id OR revenuecat_user_id = NEW.app_user_id;
    
    -- Track conversion
    UPDATE public.trial_tracking
    SET 
      converted_at = NOW(),
      conversion_source = 'revenuecat_' || NEW.event_type,
      updated_at = NOW()
    WHERE id::text = NEW.app_user_id;
    
  ELSIF NEW.event_type IN ('CANCELLATION', 'EXPIRATION') THEN
    UPDATE public.profiles 
    SET 
      subscription_status = 'free',
      subscription_product_id = NULL,
      subscription_expires_at = NULL,
      is_trial_period = FALSE,
      auto_renewing = FALSE,
      is_premium = FALSE,
      updated_at = NOW()
    WHERE id::text = NEW.app_user_id OR revenuecat_user_id = NEW.app_user_id;
    
  ELSIF NEW.event_type = 'UNCANCELLATION' THEN
    UPDATE public.profiles 
    SET 
      subscription_status = 'premium',
      auto_renewing = TRUE,
      is_premium = TRUE,
      updated_at = NOW()
    WHERE id::text = NEW.app_user_id OR revenuecat_user_id = NEW.app_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(user_id UUID)
RETURNS TABLE (
  is_premium BOOLEAN,
  subscription_product_id TEXT,
  expires_at TIMESTAMPTZ,
  is_trial BOOLEAN,
  auto_renewing BOOLEAN,
  days_remaining INTEGER,
  can_scan BOOLEAN,
  can_view_results BOOLEAN,
  free_scans_used INTEGER,
  next_free_scan_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN up.subscription_status = 'premium' AND 
           (up.subscription_expires_at IS NULL OR up.subscription_expires_at > NOW())
      THEN TRUE 
      ELSE FALSE 
    END as is_premium,
    up.subscription_product_id,
    up.subscription_expires_at as expires_at,
    up.is_trial_period as is_trial,
    up.auto_renewing,
    CASE 
      WHEN up.subscription_expires_at IS NOT NULL 
      THEN EXTRACT(DAY FROM (up.subscription_expires_at - NOW()))::INTEGER
      ELSE NULL 
    END as days_remaining,
    public.can_do_free_scan(user_id) OR public.has_active_subscription(user_id) OR public.is_in_trial_period(user_id) as can_scan,
    public.can_view_results(user_id) as can_view_results,
    tt.free_scans_used,
    CASE 
      WHEN tt.last_free_scan_at IS NOT NULL 
      THEN tt.last_free_scan_at + INTERVAL '7 days'
      ELSE NULL 
    END as next_free_scan_at
  FROM public.profiles up
  LEFT JOIN public.trial_tracking tt ON up.id = tt.id
  WHERE up.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 7: CREATE TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON public.usage_tracking;
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
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

DROP TRIGGER IF EXISTS trigger_handle_revenuecat_webhook ON public.revenuecat_events;
CREATE TRIGGER trigger_handle_revenuecat_webhook
  AFTER INSERT ON public.revenuecat_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_revenuecat_webhook();

-- =====================================================
-- STEP 8: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_revenuecat_user_id ON public.profiles(revenuecat_user_id);
CREATE INDEX IF NOT EXISTS idx_glow_analyses_user_id ON public.glow_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_glow_analyses_created_at ON public.glow_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_style_analyses_user_id ON public.style_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_style_analyses_created_at ON public.style_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skincare_plans_user_id ON public.skincare_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_skincare_plans_active ON public.skincare_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_feature ON public.usage_tracking(user_id, feature_type);
CREATE INDEX IF NOT EXISTS idx_trial_tracking_results_unlock ON public.trial_tracking(results_unlocked_until);
CREATE INDEX IF NOT EXISTS idx_trial_tracking_last_scan ON public.trial_tracking(last_free_scan_at);
CREATE INDEX IF NOT EXISTS idx_revenuecat_events_app_user_id ON public.revenuecat_events(app_user_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_events_event_type ON public.revenuecat_events(event_type);
CREATE INDEX IF NOT EXISTS idx_revenuecat_events_product_id ON public.revenuecat_events(product_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_events_created_at ON public.revenuecat_events(created_at);
CREATE INDEX IF NOT EXISTS idx_circles_creator ON public.circles(creator_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_user ON public.user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_circle ON public.user_memberships(circle_id);
CREATE INDEX IF NOT EXISTS idx_posts_circle ON public.posts(circle_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);

-- =====================================================
-- STEP 9: CREATE VIEWS
-- =====================================================

CREATE OR REPLACE VIEW public.conversion_analytics AS
SELECT 
  DATE_TRUNC('day', tt.created_at) as signup_date,
  COUNT(*) as total_signups,
  COUNT(CASE WHEN tt.free_scans_used > 0 THEN 1 END) as users_who_scanned,
  COUNT(CASE WHEN tt.has_payment_method THEN 1 END) as users_with_payment,
  COUNT(CASE WHEN tt.converted_at IS NOT NULL THEN 1 END) as converted_users,
  AVG(tt.conversion_prompts_shown) as avg_prompts_shown,
  AVG(EXTRACT(EPOCH FROM (tt.converted_at - tt.created_at)) / 3600) as avg_hours_to_conversion
FROM public.trial_tracking tt
GROUP BY DATE_TRUNC('day', tt.created_at)
ORDER BY signup_date DESC;

-- =====================================================
-- STEP 10: GRANTS
-- =====================================================

GRANT SELECT ON public.revenuecat_events TO authenticated;
GRANT INSERT ON public.revenuecat_events TO service_role;
GRANT SELECT ON public.conversion_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_revenuecat_webhook() TO service_role;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_in_trial_period(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_do_free_scan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_results(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_free_scan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_trial_with_payment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_conversion_prompt(UUID, TEXT) TO authenticated;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'FREEMIUM DATABASE SETUP COMPLETE!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Conversion Strategy:';
  RAISE NOTICE '✅ FREE: 1 scan immediately (glow or style)';
  RAISE NOTICE '✅ Full results visible for 24 hours after scan';
  RAISE NOTICE '✅ After 24h: Blur tips 5-8, Glow Coach content';
  RAISE NOTICE '⏰ Next free scan: 7 days after first scan';
  RAISE NOTICE '💎 TRIAL: 3-day with payment, 2 scans/day';
  RAISE NOTICE '💰 PAID: Unlimited everything';
  RAISE NOTICE '============================================================================';
END $$;
