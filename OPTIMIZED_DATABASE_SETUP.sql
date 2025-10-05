-- ============================================================================
-- OPTIMIZED DATABASE SETUP FOR CONVERSION-FOCUSED GLOW APP
-- ============================================================================
-- STRATEGY: Payment required before trial → 7-day full access → Auto-renewal
-- FREE TIER: 1 scan per week, results visible for 24 hours only
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING OBJECTS
-- ============================================================================

DROP VIEW IF EXISTS public.user_subscription_status CASCADE;
DROP VIEW IF EXISTS public.subscription_analytics CASCADE;

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
DROP FUNCTION IF EXISTS public.can_scan(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.can_view_results(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.increment_scan_usage(UUID) CASCADE;

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

-- ============================================================================
-- STEP 2: ENABLE EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 3: CREATE ALL TABLES
-- ============================================================================

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Stats Table
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Glow Analyses Table
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Style Analyses Table
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Skincare Plans Table
CREATE TABLE public.skincare_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  plan_data JSONB,
  progress JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  expires_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  auto_renew BOOLEAN DEFAULT TRUE,
  is_trial BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Trial Tracking Table (OPTIMIZED FOR CONVERSION STRATEGY)
CREATE TABLE public.trial_tracking (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Free tier tracking
  weekly_scans_used INTEGER DEFAULT 0,
  max_weekly_scans INTEGER DEFAULT 1,
  last_scan_reset_date DATE,
  first_scan_completed_at TIMESTAMPTZ,
  results_unlocked_until TIMESTAMPTZ,
  
  -- Trial tracking
  has_added_payment BOOLEAN DEFAULT FALSE,
  payment_added_at TIMESTAMPTZ,
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  is_trial_active BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Usage Tracking Table
CREATE TABLE public.usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('glow_analysis', 'style_analysis', 'skincare_plan', 'ai_coach')),
  usage_count INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. User Memberships Table
CREATE TABLE public.user_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Comments Table
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glow_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skincare_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenuecat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User Stats
CREATE POLICY "Users can view own stats" ON public.user_stats FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own stats" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = id);

-- Glow Analyses
CREATE POLICY "Users can view own analyses" ON public.glow_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.glow_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Style Analyses
CREATE POLICY "Users can view own style analyses" ON public.style_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own style analyses" ON public.style_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Skincare Plans
CREATE POLICY "Users can view own skincare plans" ON public.skincare_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skincare plans" ON public.skincare_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skincare plans" ON public.skincare_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skincare plans" ON public.skincare_plans FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Trial Tracking
CREATE POLICY "Users can view own trial tracking" ON public.trial_tracking FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own trial tracking" ON public.trial_tracking FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own trial tracking" ON public.trial_tracking FOR UPDATE USING (auth.uid() = id);

-- Usage Tracking
CREATE POLICY "Users can view own usage tracking" ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage tracking" ON public.usage_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage tracking" ON public.usage_tracking FOR UPDATE USING (auth.uid() = user_id);

-- RevenueCat Events
CREATE POLICY "Service role can insert webhook events" ON public.revenuecat_events FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users can view own events" ON public.revenuecat_events FOR SELECT USING (app_user_id = auth.uid()::text OR original_app_user_id = auth.uid()::text);

-- Circles
CREATE POLICY "Anyone can view public circles" ON public.circles FOR SELECT USING (NOT is_private OR creator_id = auth.uid());
CREATE POLICY "Users can create circles" ON public.circles FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their circles" ON public.circles FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete their circles" ON public.circles FOR DELETE USING (auth.uid() = creator_id);

-- User Memberships
CREATE POLICY "Users can view their memberships" ON public.user_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join circles" ON public.user_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave circles" ON public.user_memberships FOR DELETE USING (auth.uid() = user_id);

-- Posts
CREATE POLICY "Members can view circle posts" ON public.posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_memberships WHERE user_id = auth.uid() AND circle_id = posts.circle_id)
);
CREATE POLICY "Members can create posts" ON public.posts FOR INSERT WITH CHECK (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.user_memberships WHERE user_id = auth.uid() AND circle_id = posts.circle_id)
);
CREATE POLICY "Authors can update their posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- Comments
CREATE POLICY "Members can view comments" ON public.comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.posts p JOIN public.user_memberships um ON p.circle_id = um.circle_id WHERE p.id = comments.post_id AND um.user_id = auth.uid())
);
CREATE POLICY "Members can create comments" ON public.comments FOR INSERT WITH CHECK (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.posts p JOIN public.user_memberships um ON p.circle_id = um.circle_id WHERE p.id = comments.post_id AND um.user_id = auth.uid())
);
CREATE POLICY "Authors can delete their comments" ON public.comments FOR DELETE USING (auth.uid() = author_id);

-- ============================================================================
-- STEP 6: CREATE FUNCTIONS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user creation
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

-- Check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_premium BOOLEAN;
BEGIN
  SELECT 
    (p.is_premium = TRUE AND 
     (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW()))
  INTO is_premium
  FROM public.profiles p
  WHERE p.id = user_uuid;
  
  RETURN COALESCE(is_premium, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is in trial period
CREATE OR REPLACE FUNCTION public.is_in_trial_period(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  in_trial BOOLEAN;
BEGIN
  SELECT 
    (tt.is_trial_active = TRUE AND 
     tt.trial_ends_at > NOW() AND 
     tt.has_added_payment = TRUE)
  INTO in_trial
  FROM public.trial_tracking tt
  WHERE tt.id = user_uuid;
  
  RETURN COALESCE(in_trial, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can scan (free tier or premium)
CREATE OR REPLACE FUNCTION public.can_scan(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_premium BOOLEAN;
  in_trial BOOLEAN;
  scans_available BOOLEAN;
BEGIN
  is_premium := public.has_active_subscription(user_uuid);
  IF is_premium THEN
    RETURN TRUE;
  END IF;
  
  in_trial := public.is_in_trial_period(user_uuid);
  IF in_trial THEN
    RETURN TRUE;
  END IF;
  
  SELECT 
    (tt.weekly_scans_used < tt.max_weekly_scans OR 
     tt.last_scan_reset_date IS NULL OR 
     tt.last_scan_reset_date < DATE_TRUNC('week', NOW()::date))
  INTO scans_available
  FROM public.trial_tracking tt
  WHERE tt.id = user_uuid;
  
  RETURN COALESCE(scans_available, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can view results (not blurred)
CREATE OR REPLACE FUNCTION public.can_view_results(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_premium BOOLEAN;
  in_trial BOOLEAN;
  results_unlocked BOOLEAN;
BEGIN
  is_premium := public.has_active_subscription(user_uuid);
  IF is_premium THEN
    RETURN TRUE;
  END IF;
  
  in_trial := public.is_in_trial_period(user_uuid);
  IF in_trial THEN
    RETURN TRUE;
  END IF;
  
  SELECT (tt.results_unlocked_until > NOW())
  INTO results_unlocked
  FROM public.trial_tracking tt
  WHERE tt.id = user_uuid;
  
  RETURN COALESCE(results_unlocked, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment scan usage (handles weekly reset)
CREATE OR REPLACE FUNCTION public.increment_scan_usage(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  week_start DATE;
  current_reset_date DATE;
BEGIN
  week_start := DATE_TRUNC('week', NOW()::date);
  
  SELECT last_scan_reset_date INTO current_reset_date
  FROM public.trial_tracking
  WHERE id = user_uuid;
  
  IF current_reset_date IS NULL OR current_reset_date < week_start THEN
    UPDATE public.trial_tracking
    SET 
      weekly_scans_used = 1,
      last_scan_reset_date = NOW()::date,
      first_scan_completed_at = COALESCE(first_scan_completed_at, NOW()),
      results_unlocked_until = NOW() + INTERVAL '24 hours',
      updated_at = NOW()
    WHERE id = user_uuid;
  ELSE
    UPDATE public.trial_tracking
    SET 
      weekly_scans_used = weekly_scans_used + 1,
      first_scan_completed_at = COALESCE(first_scan_completed_at, NOW()),
      results_unlocked_until = NOW() + INTERVAL '24 hours',
      updated_at = NOW()
    WHERE id = user_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark payment as added and start trial
CREATE OR REPLACE FUNCTION public.mark_payment_added(user_uuid UUID, trial_days INTEGER DEFAULT 7)
RETURNS VOID AS $$
BEGIN
  UPDATE public.trial_tracking
  SET 
    has_added_payment = TRUE,
    payment_added_at = NOW(),
    trial_started_at = NOW(),
    trial_ends_at = NOW() + (trial_days || ' days')::INTERVAL,
    is_trial_active = TRUE,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle RevenueCat webhook events
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
    
    IF NEW.is_trial_period THEN
      PERFORM public.mark_payment_added(NEW.app_user_id::UUID, 7);
    END IF;
    
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
    
    UPDATE public.trial_tracking
    SET 
      is_trial_active = FALSE,
      updated_at = NOW()
    WHERE id::text = NEW.app_user_id;
    
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

-- Get comprehensive user subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(user_id UUID)
RETURNS TABLE (
  is_premium BOOLEAN,
  subscription_product_id TEXT,
  expires_at TIMESTAMPTZ,
  is_trial BOOLEAN,
  auto_renewing BOOLEAN,
  days_remaining INTEGER,
  weekly_scans_used INTEGER,
  max_weekly_scans INTEGER,
  can_scan BOOLEAN,
  can_view_results BOOLEAN,
  results_unlocked_until TIMESTAMPTZ,
  has_added_payment BOOLEAN,
  trial_ends_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.is_premium,
    p.subscription_product_id,
    p.subscription_expires_at as expires_at,
    p.is_trial_period as is_trial,
    p.auto_renewing,
    CASE 
      WHEN p.subscription_expires_at IS NOT NULL 
      THEN EXTRACT(DAY FROM (p.subscription_expires_at - NOW()))::INTEGER
      ELSE NULL 
    END as days_remaining,
    tt.weekly_scans_used,
    tt.max_weekly_scans,
    public.can_scan(user_id) as can_scan,
    public.can_view_results(user_id) as can_view_results,
    tt.results_unlocked_until,
    tt.has_added_payment,
    tt.trial_ends_at
  FROM public.profiles p
  LEFT JOIN public.trial_tracking tt ON p.id = tt.id
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: CREATE TRIGGERS
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_skincare_plans_updated_at
  BEFORE UPDATE ON public.skincare_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
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

CREATE TRIGGER trigger_handle_revenuecat_webhook
  AFTER INSERT ON public.revenuecat_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_revenuecat_webhook();

-- ============================================================================
-- STEP 8: CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX idx_profiles_revenuecat_user_id ON public.profiles(revenuecat_user_id);
CREATE INDEX idx_profiles_premium ON public.profiles(is_premium, subscription_expires_at);
CREATE INDEX idx_glow_analyses_user_id ON public.glow_analyses(user_id);
CREATE INDEX idx_glow_analyses_created_at ON public.glow_analyses(created_at DESC);
CREATE INDEX idx_style_analyses_user_id ON public.style_analyses(user_id);
CREATE INDEX idx_style_analyses_created_at ON public.style_analyses(created_at DESC);
CREATE INDEX idx_skincare_plans_user_id ON public.skincare_plans(user_id);
CREATE INDEX idx_skincare_plans_active ON public.skincare_plans(user_id, is_active);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_expires_at ON public.subscriptions(expires_at);
CREATE INDEX idx_usage_tracking_user_feature ON public.usage_tracking(user_id, feature_type);
CREATE INDEX idx_trial_tracking_payment ON public.trial_tracking(has_added_payment, is_trial_active);
CREATE INDEX idx_trial_tracking_results ON public.trial_tracking(results_unlocked_until);
CREATE INDEX idx_revenuecat_events_app_user_id ON public.revenuecat_events(app_user_id);
CREATE INDEX idx_revenuecat_events_event_type ON public.revenuecat_events(event_type);
CREATE INDEX idx_revenuecat_events_created_at ON public.revenuecat_events(created_at);
CREATE INDEX idx_circles_creator ON public.circles(creator_id);
CREATE INDEX idx_user_memberships_user ON public.user_memberships(user_id);
CREATE INDEX idx_user_memberships_circle ON public.user_memberships(circle_id);
CREATE INDEX idx_posts_circle ON public.posts(circle_id);
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_comments_post ON public.comments(post_id);

-- ============================================================================
-- STEP 9: CREATE VIEWS
-- ============================================================================

CREATE VIEW public.user_subscription_status AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.is_premium,
  p.subscription_status,
  p.subscription_expires_at,
  p.is_trial_period,
  tt.weekly_scans_used,
  tt.max_weekly_scans,
  tt.results_unlocked_until,
  tt.has_added_payment,
  tt.trial_ends_at,
  tt.is_trial_active,
  public.has_active_subscription(p.id) as has_active_subscription,
  public.is_in_trial_period(p.id) as is_in_trial_period,
  public.can_scan(p.id) as can_scan,
  public.can_view_results(p.id) as can_view_results
FROM public.profiles p
LEFT JOIN public.trial_tracking tt ON p.id = tt.id;

CREATE VIEW public.subscription_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  event_type,
  product_id,
  store,
  environment,
  COUNT(*) as event_count,
  COUNT(DISTINCT app_user_id) as unique_users
FROM public.revenuecat_events
GROUP BY DATE_TRUNC('day', created_at), event_type, product_id, store, environment
ORDER BY date DESC;

-- ============================================================================
-- STEP 10: GRANTS
-- ============================================================================

GRANT SELECT ON public.revenuecat_events TO authenticated;
GRANT INSERT ON public.revenuecat_events TO service_role;
GRANT SELECT ON public.subscription_analytics TO authenticated;
GRANT SELECT ON public.user_subscription_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_revenuecat_webhook() TO service_role;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_in_trial_period(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_scan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_results(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_scan_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_payment_added(UUID, INTEGER) TO authenticated;

-- ============================================================================
-- STEP 11: ADD DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.trial_tracking IS 'Tracks free tier usage (1 scan/week, 24h results) and trial status (requires payment)';
COMMENT ON COLUMN public.trial_tracking.weekly_scans_used IS 'Number of scans used this week (resets Sunday)';
COMMENT ON COLUMN public.trial_tracking.results_unlocked_until IS 'Free tier users can view results for 24 hours after scan';
COMMENT ON COLUMN public.trial_tracking.has_added_payment IS 'User must add payment to unlock 7-day trial';
COMMENT ON FUNCTION public.can_scan(UUID) IS 'Returns true if user can perform a scan (premium, trial, or free tier with scans left)';
COMMENT ON FUNCTION public.can_view_results(UUID) IS 'Returns true if user can view results without blur (premium, trial, or within 24h window)';
COMMENT ON FUNCTION public.increment_scan_usage(UUID) IS 'Increments scan count, handles weekly reset, sets 24h results window';
COMMENT ON FUNCTION public.mark_payment_added(UUID, INTEGER) IS 'Marks payment added and starts trial period (default 7 days)';

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'OPTIMIZED DATABASE SETUP COMPLETE!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Conversion Strategy Implemented:';
  RAISE NOTICE '✓ Free Tier: 1 scan per week, results visible for 24 hours';
  RAISE NOTICE '✓ Trial: Requires payment method, 7 days full access';
  RAISE NOTICE '✓ Premium: Unlimited scans, permanent results access';
  RAISE NOTICE '✓ Community: Circles, posts, comments enabled';
  RAISE NOTICE '✓ RevenueCat: Webhook integration ready';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'All tables, functions, triggers, and policies created successfully!';
  RAISE NOTICE '============================================================================';
END $$;
