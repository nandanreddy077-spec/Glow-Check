-- ============================================
-- REFERRAL SYSTEM DATABASE SETUP
-- ============================================
-- Run this script in your Supabase SQL Editor

-- 1. Create referral_codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT unique_user_referral_code UNIQUE(user_id)
);

-- 2. Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, converted, paid
  converted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  reward_amount DECIMAL(10,2) DEFAULT 1.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_referred_user UNIQUE(referred_user_id)
);

-- 3. Create referral_earnings table
CREATE TABLE IF NOT EXISTS public.referral_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  total_pending DECIMAL(10,2) DEFAULT 0.00,
  total_paid_out DECIMAL(10,2) DEFAULT 0.00,
  referral_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_earnings UNIQUE(user_id)
);

-- 4. Create referral_payouts table
CREATE TABLE IF NOT EXISTS public.referral_payouts (
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

-- 5. Add referral tracking to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT,
  ADD COLUMN IF NOT EXISTS referral_link TEXT;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_user_id ON public.referral_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_user_id ON public.referral_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_code ON public.profiles(referred_by_code);

-- 7. Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral codes"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral codes"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes"
  ON public.referral_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- 9. RLS Policies for referrals
CREATE POLICY "Users can view referrals where they are referrer"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- 10. RLS Policies for referral_earnings
CREATE POLICY "Users can view their own earnings"
  ON public.referral_earnings FOR SELECT
  USING (auth.uid() = user_id);

-- 11. RLS Policies for referral_payouts
CREATE POLICY "Users can view their own payouts"
  ON public.referral_payouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can request their own payouts"
  ON public.referral_payouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 12. Function to generate unique referral code
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
  
  -- Check if code already exists
  WHILE EXISTS (SELECT 1 FROM public.referral_codes WHERE code = result) LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 13. Function to create referral code for user
CREATE OR REPLACE FUNCTION create_user_referral_code(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Check if user already has a code
  SELECT code INTO new_code FROM public.referral_codes WHERE user_id = user_uuid;
  
  IF new_code IS NOT NULL THEN
    RETURN new_code;
  END IF;
  
  -- Generate new code
  new_code := generate_referral_code();
  
  -- Insert new code
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (user_uuid, new_code);
  
  -- Initialize earnings record
  INSERT INTO public.referral_earnings (user_id)
  VALUES (user_uuid)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Function to track referral signup
CREATE OR REPLACE FUNCTION track_referral_signup(referred_user_uuid UUID, referral_code_text TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  referrer_uuid UUID;
BEGIN
  -- Find referrer
  SELECT user_id INTO referrer_uuid 
  FROM public.referral_codes 
  WHERE code = referral_code_text AND is_active = TRUE;
  
  IF referrer_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Don't allow self-referral
  IF referrer_uuid = referred_user_uuid THEN
    RETURN FALSE;
  END IF;
  
  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code, status)
  VALUES (referrer_uuid, referred_user_uuid, referral_code_text, 'pending')
  ON CONFLICT (referred_user_id) DO NOTHING;
  
  -- Update referral count
  UPDATE public.referral_earnings
  SET referral_count = referral_count + 1,
      updated_at = NOW()
  WHERE user_id = referrer_uuid;
  
  -- Update profile
  UPDATE public.profiles
  SET referred_by_code = referral_code_text
  WHERE id = referred_user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Function to mark referral as converted (user subscribed)
CREATE OR REPLACE FUNCTION mark_referral_converted(referred_user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  referrer_uuid UUID;
  reward_amt DECIMAL(10,2) := 1.00;
BEGIN
  -- Find the referral record
  SELECT referrer_id INTO referrer_uuid
  FROM public.referrals
  WHERE referred_user_id = referred_user_uuid AND status = 'pending';
  
  IF referrer_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update referral status
  UPDATE public.referrals
  SET status = 'converted',
      converted_at = NOW()
  WHERE referred_user_id = referred_user_uuid;
  
  -- Update earnings
  UPDATE public.referral_earnings
  SET total_earned = total_earned + reward_amt,
      total_pending = total_pending + reward_amt,
      conversion_count = conversion_count + 1,
      updated_at = NOW()
  WHERE user_id = referrer_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Function to get user referral stats
CREATE OR REPLACE FUNCTION get_user_referral_stats(user_uuid UUID)
RETURNS TABLE (
  referral_code TEXT,
  total_referrals BIGINT,
  total_conversions BIGINT,
  total_earned DECIMAL(10,2),
  total_pending DECIMAL(10,2),
  total_paid_out DECIMAL(10,2),
  conversion_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rc.code,
    COALESCE(COUNT(r.id), 0) AS total_referrals,
    COALESCE(COUNT(r.id) FILTER (WHERE r.status = 'converted'), 0) AS total_conversions,
    COALESCE(re.total_earned, 0.00),
    COALESCE(re.total_pending, 0.00),
    COALESCE(re.total_paid_out, 0.00),
    CASE 
      WHEN COUNT(r.id) > 0 THEN 
        ROUND((COUNT(r.id) FILTER (WHERE r.status = 'converted')::DECIMAL / COUNT(r.id)::DECIMAL * 100), 2)
      ELSE 0.00
    END AS conversion_rate
  FROM public.referral_codes rc
  LEFT JOIN public.referrals r ON rc.user_id = r.referrer_id
  LEFT JOIN public.referral_earnings re ON rc.user_id = re.user_id
  WHERE rc.user_id = user_uuid
  GROUP BY rc.code, re.total_earned, re.total_pending, re.total_paid_out;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Function to get user referral history
CREATE OR REPLACE FUNCTION get_user_referral_history(user_uuid UUID)
RETURNS TABLE (
  referral_id UUID,
  referred_user_email TEXT,
  status TEXT,
  reward_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    p.email,
    r.status,
    r.reward_amount,
    r.created_at,
    r.converted_at
  FROM public.referrals r
  JOIN public.profiles p ON r.referred_user_id = p.id
  WHERE r.referrer_id = user_uuid
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Trigger to create referral code on profile creation
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

-- 19. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.referral_codes TO authenticated;
GRANT ALL ON public.referrals TO authenticated;
GRANT ALL ON public.referral_earnings TO authenticated;
GRANT ALL ON public.referral_payouts TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION track_referral_signup TO authenticated;
GRANT EXECUTE ON FUNCTION mark_referral_converted TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_referral_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_referral_history TO authenticated;

-- 20. Insert sample data for testing (optional, comment out for production)
-- This will create referral codes for existing users
-- INSERT INTO public.referral_codes (user_id, code)
-- SELECT id, generate_referral_code()
-- FROM auth.users
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.referral_codes WHERE user_id = auth.users.id
-- );

-- ============================================
-- SETUP COMPLETE
-- ============================================
