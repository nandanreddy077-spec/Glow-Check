-- ============================================
-- RECURRING REFERRAL SYSTEM DATABASE SETUP
-- Earn $1/month for every referred subscriber
-- ============================================

-- Drop existing tables if upgrading from one-time system
DROP TABLE IF EXISTS public.referral_monthly_payouts CASCADE;
DROP TABLE IF EXISTS public.referral_payouts CASCADE;
DROP TABLE IF EXISTS public.referral_earnings CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.referral_codes CASCADE;

-- 1. Create referral_codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT unique_user_referral_code UNIQUE(user_id)
);

-- 2. Create referrals table (tracks each referred user)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, inactive, cancelled
  subscription_status TEXT, -- trial, active, paused, cancelled
  converted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  total_months_paid INTEGER DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  monthly_reward_amount DECIMAL(10,2) DEFAULT 1.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_referred_user UNIQUE(referred_user_id)
);

-- 3. Create referral_monthly_payouts table (tracks each monthly commission)
CREATE TABLE IF NOT EXISTS public.referral_monthly_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, paid, failed
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- 4. Create referral_earnings summary table (per referrer)
CREATE TABLE IF NOT EXISTS public.referral_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  total_pending DECIMAL(10,2) DEFAULT 0.00,
  total_paid_out DECIMAL(10,2) DEFAULT 0.00,
  monthly_recurring_revenue DECIMAL(10,2) DEFAULT 0.00, -- MRR from active subs
  active_referrals_count INTEGER DEFAULT 0,
  total_referrals_count INTEGER DEFAULT 0,
  converted_referrals_count INTEGER DEFAULT 0,
  lifetime_months_paid INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_earnings UNIQUE(user_id)
);

-- 5. Create withdrawal requests table
CREATE TABLE IF NOT EXISTS public.referral_withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  payment_method TEXT,
  payment_details JSONB,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- 6. Add referral tracking to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT,
  ADD COLUMN IF NOT EXISTS referral_link TEXT;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_subscription_status ON public.referrals(subscription_status);
CREATE INDEX IF NOT EXISTS idx_referral_monthly_payouts_referral_id ON public.referral_monthly_payouts(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_monthly_payouts_referrer_id ON public.referral_monthly_payouts(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_monthly_payouts_status ON public.referral_monthly_payouts(status);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_user_id ON public.referral_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_withdrawal_requests_user_id ON public.referral_withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_code ON public.profiles(referred_by_code);

-- 8. Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_monthly_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for referral_codes
DROP POLICY IF EXISTS "Users can view their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can insert their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can update their own referral codes" ON public.referral_codes;

CREATE POLICY "Users can view their own referral codes"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral codes"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes"
  ON public.referral_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- 10. RLS Policies for referrals
DROP POLICY IF EXISTS "Users can view referrals where they are referrer" ON public.referrals;

CREATE POLICY "Users can view referrals where they are referrer"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- 11. RLS Policies for referral_monthly_payouts
DROP POLICY IF EXISTS "Users can view their own monthly payouts" ON public.referral_monthly_payouts;

CREATE POLICY "Users can view their own monthly payouts"
  ON public.referral_monthly_payouts FOR SELECT
  USING (auth.uid() = referrer_id);

-- 12. RLS Policies for referral_earnings
DROP POLICY IF EXISTS "Users can view their own earnings" ON public.referral_earnings;

CREATE POLICY "Users can view their own earnings"
  ON public.referral_earnings FOR SELECT
  USING (auth.uid() = user_id);

-- 13. RLS Policies for referral_withdrawal_requests
DROP POLICY IF EXISTS "Users can view their own withdrawal requests" ON public.referral_withdrawal_requests;
DROP POLICY IF EXISTS "Users can request withdrawals" ON public.referral_withdrawal_requests;

CREATE POLICY "Users can view their own withdrawal requests"
  ON public.referral_withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can request withdrawals"
  ON public.referral_withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 14. Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  WHILE EXISTS (SELECT 1 FROM public.referral_codes WHERE code = result) LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 15. Function to create referral code for user
CREATE OR REPLACE FUNCTION create_user_referral_code(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
BEGIN
  SELECT code INTO new_code FROM public.referral_codes WHERE user_id = user_uuid;
  
  IF new_code IS NOT NULL THEN
    RETURN new_code;
  END IF;
  
  new_code := generate_referral_code();
  
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (user_uuid, new_code);
  
  INSERT INTO public.referral_earnings (user_id)
  VALUES (user_uuid)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Function to track referral signup
CREATE OR REPLACE FUNCTION track_referral_signup(referred_user_uuid UUID, referral_code_text TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  referrer_uuid UUID;
BEGIN
  SELECT user_id INTO referrer_uuid 
  FROM public.referral_codes 
  WHERE code = referral_code_text AND is_active = TRUE;
  
  IF referrer_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF referrer_uuid = referred_user_uuid THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code, status)
  VALUES (referrer_uuid, referred_user_uuid, referral_code_text, 'pending')
  ON CONFLICT (referred_user_id) DO NOTHING;
  
  UPDATE public.referral_earnings
  SET total_referrals_count = total_referrals_count + 1,
      updated_at = NOW()
  WHERE user_id = referrer_uuid;
  
  UPDATE public.profiles
  SET referred_by_code = referral_code_text
  WHERE id = referred_user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Function to mark referral as active (user subscribed)
CREATE OR REPLACE FUNCTION mark_referral_active(referred_user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  referrer_uuid UUID;
  referral_uuid UUID;
  reward_amt DECIMAL(10,2) := 1.00;
BEGIN
  SELECT id, referrer_id INTO referral_uuid, referrer_uuid
  FROM public.referrals
  WHERE referred_user_id = referred_user_uuid AND status = 'pending';
  
  IF referrer_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.referrals
  SET status = 'active',
      subscription_status = 'active',
      converted_at = NOW(),
      last_payment_date = NOW(),
      total_months_paid = 1,
      total_earned = reward_amt,
      updated_at = NOW()
  WHERE id = referral_uuid;
  
  INSERT INTO public.referral_monthly_payouts (
    referral_id,
    referrer_id,
    referred_user_id,
    amount,
    billing_period_start,
    billing_period_end,
    status
  ) VALUES (
    referral_uuid,
    referrer_uuid,
    referred_user_uuid,
    reward_amt,
    NOW(),
    NOW() + INTERVAL '1 month',
    'confirmed'
  );
  
  UPDATE public.referral_earnings
  SET total_earned = total_earned + reward_amt,
      total_pending = total_pending + reward_amt,
      monthly_recurring_revenue = monthly_recurring_revenue + reward_amt,
      active_referrals_count = active_referrals_count + 1,
      converted_referrals_count = converted_referrals_count + 1,
      lifetime_months_paid = lifetime_months_paid + 1,
      updated_at = NOW()
  WHERE user_id = referrer_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Function to process recurring monthly commission
CREATE OR REPLACE FUNCTION process_recurring_commission(referred_user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  referral_uuid UUID;
  referrer_uuid UUID;
  reward_amt DECIMAL(10,2) := 1.00;
BEGIN
  SELECT id, referrer_id INTO referral_uuid, referrer_uuid
  FROM public.referrals
  WHERE referred_user_id = referred_user_uuid 
    AND status = 'active'
    AND subscription_status = 'active';
  
  IF referrer_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.referrals
  SET last_payment_date = NOW(),
      total_months_paid = total_months_paid + 1,
      total_earned = total_earned + reward_amt,
      updated_at = NOW()
  WHERE id = referral_uuid;
  
  INSERT INTO public.referral_monthly_payouts (
    referral_id,
    referrer_id,
    referred_user_id,
    amount,
    billing_period_start,
    billing_period_end,
    status
  ) VALUES (
    referral_uuid,
    referrer_uuid,
    referred_user_uuid,
    reward_amt,
    NOW(),
    NOW() + INTERVAL '1 month',
    'confirmed'
  );
  
  UPDATE public.referral_earnings
  SET total_earned = total_earned + reward_amt,
      total_pending = total_pending + reward_amt,
      lifetime_months_paid = lifetime_months_paid + 1,
      updated_at = NOW()
  WHERE user_id = referrer_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. Function to cancel referral subscription
CREATE OR REPLACE FUNCTION cancel_referral_subscription(referred_user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  referrer_uuid UUID;
  referral_uuid UUID;
  monthly_reward DECIMAL(10,2);
BEGIN
  SELECT id, referrer_id, monthly_reward_amount INTO referral_uuid, referrer_uuid, monthly_reward
  FROM public.referrals
  WHERE referred_user_id = referred_user_uuid 
    AND status = 'active';
  
  IF referrer_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.referrals
  SET status = 'inactive',
      subscription_status = 'cancelled',
      cancelled_at = NOW(),
      updated_at = NOW()
  WHERE id = referral_uuid;
  
  UPDATE public.referral_earnings
  SET monthly_recurring_revenue = GREATEST(0, monthly_recurring_revenue - monthly_reward),
      active_referrals_count = GREATEST(0, active_referrals_count - 1),
      updated_at = NOW()
  WHERE user_id = referrer_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. Function to get user referral stats
CREATE OR REPLACE FUNCTION get_user_referral_stats(user_uuid UUID)
RETURNS TABLE (
  referral_code TEXT,
  total_referrals BIGINT,
  active_referrals BIGINT,
  total_conversions BIGINT,
  total_earned DECIMAL(10,2),
  total_pending DECIMAL(10,2),
  total_paid_out DECIMAL(10,2),
  monthly_recurring_revenue DECIMAL(10,2),
  lifetime_months_paid BIGINT,
  conversion_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rc.code,
    COALESCE(re.total_referrals_count, 0)::BIGINT,
    COALESCE(re.active_referrals_count, 0)::BIGINT,
    COALESCE(re.converted_referrals_count, 0)::BIGINT,
    COALESCE(re.total_earned, 0.00),
    COALESCE(re.total_pending, 0.00),
    COALESCE(re.total_paid_out, 0.00),
    COALESCE(re.monthly_recurring_revenue, 0.00),
    COALESCE(re.lifetime_months_paid, 0)::BIGINT,
    CASE 
      WHEN re.total_referrals_count > 0 THEN 
        ROUND((re.converted_referrals_count::DECIMAL / re.total_referrals_count::DECIMAL * 100), 2)
      ELSE 0.00
    END AS conversion_rate
  FROM public.referral_codes rc
  LEFT JOIN public.referral_earnings re ON rc.user_id = re.user_id
  WHERE rc.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21. Function to get user referral history
CREATE OR REPLACE FUNCTION get_user_referral_history(user_uuid UUID)
RETURNS TABLE (
  referral_id UUID,
  referred_user_email TEXT,
  status TEXT,
  subscription_status TEXT,
  monthly_reward_amount DECIMAL(10,2),
  total_earned DECIMAL(10,2),
  total_months_paid INTEGER,
  created_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    p.email,
    r.status,
    r.subscription_status,
    r.monthly_reward_amount,
    r.total_earned,
    r.total_months_paid,
    r.created_at,
    r.converted_at,
    r.last_payment_date
  FROM public.referrals r
  JOIN public.profiles p ON r.referred_user_id = p.id
  WHERE r.referrer_id = user_uuid
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 22. Trigger to create referral code on profile creation
CREATE OR REPLACE FUNCTION create_referral_code_on_profile_create()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_user_referral_code(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_referral_code ON public.profiles;
CREATE TRIGGER trigger_create_referral_code
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_code_on_profile_create();

-- 23. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.referral_codes TO authenticated;
GRANT ALL ON public.referrals TO authenticated;
GRANT ALL ON public.referral_monthly_payouts TO authenticated;
GRANT ALL ON public.referral_earnings TO authenticated;
GRANT ALL ON public.referral_withdrawal_requests TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION track_referral_signup TO authenticated;
GRANT EXECUTE ON FUNCTION mark_referral_active TO authenticated;
GRANT EXECUTE ON FUNCTION process_recurring_commission TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_referral_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_referral_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_referral_history TO authenticated;

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Next Steps:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Update your RevenueCat webhook to call:
--    - mark_referral_active() on initial purchase
--    - process_recurring_commission() on renewal
--    - cancel_referral_subscription() on cancellation
-- ============================================
