# 🧪 Recurring Referral System - Testing Guide

## Quick Test Checklist

### ✅ Pre-Testing Setup
- [ ] Database SQL executed (`recurring-referral-system-setup.sql`)
- [ ] Webhook deployed to Supabase
- [ ] RevenueCat webhook configured
- [ ] Environment variables set (SUPABASE_SERVICE_ROLE_KEY)

---

## 🎯 Test Scenario 1: Basic Referral Flow

### 1. Create Referrer (User A)
```
1. Open app
2. Sign up as new user (e.g., alice@test.com)
3. Navigate to "Referral Rewards" screen
4. Copy referral code (e.g., ABC123XY)
```

**Expected Database State:**
```sql
-- Check referral code was created
SELECT * FROM referral_codes WHERE user_id = '[Alice User ID]';

-- Should return:
-- id | user_id | code | created_at | is_active
-- -- | ------- | ---- | ---------- | ---------
-- xx | Alice   | ABC123XY | [timestamp] | true
```

### 2. Create Referred User (User B)
```
1. Log out
2. Sign up as new user (e.g., bob@test.com)
3. Enter referral code: ABC123XY
4. Complete signup
```

**Expected Database State:**
```sql
-- Check referral was tracked
SELECT * FROM referrals WHERE referred_user_id = '[Bob User ID]';

-- Should return:
-- id | referrer_id | referred_user_id | status | referral_code
-- -- | ----------- | ---------------- | ------ | -------------
-- xx | Alice       | Bob              | pending | ABC123XY

-- Check profile was updated
SELECT referred_by_code FROM profiles WHERE id = '[Bob User ID]';

-- Should return: ABC123XY
```

### 3. User B Subscribes
```
1. As Bob, complete first scan
2. Hit paywall
3. Subscribe to monthly premium ($8.99)
4. Wait for RevenueCat webhook (5-10 seconds)
```

**Expected Database State:**
```sql
-- 1. Referral should be active
SELECT * FROM referrals WHERE referred_user_id = '[Bob User ID]';

-- Should show:
-- status: active
-- subscription_status: active
-- converted_at: [timestamp]
-- total_months_paid: 1
-- total_earned: 1.00

-- 2. Check first payout was created
SELECT * FROM referral_monthly_payouts 
WHERE referred_user_id = '[Bob User ID]'
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- amount: 1.00
-- status: confirmed
-- billing_period_start: [now]
-- billing_period_end: [now + 1 month]

-- 3. Check Alice's earnings
SELECT * FROM referral_earnings WHERE user_id = '[Alice User ID]';

-- Should show:
-- total_earned: 1.00
-- total_pending: 1.00
-- monthly_recurring_revenue: 1.00
-- active_referrals_count: 1
-- converted_referrals_count: 1
```

### 4. Verify in App (User A)
```
1. Log in as Alice
2. Open "Referral Rewards" screen
3. Check stats display
```

**Expected UI:**
```
Monthly Recurring Revenue: $1.00
Active Referrals: 1
Total Earned: $1.00
Lifetime Months Paid: 1

Referral History:
- bob@test.com • $1.00 • 1 month active
```

---

## 🔄 Test Scenario 2: Monthly Renewal

### Method A: Manual SQL Test (Instant)
```sql
-- Simulate a monthly renewal for Bob
SELECT process_recurring_commission('[Bob User ID]');

-- Check Alice's updated earnings
SELECT * FROM referral_earnings WHERE user_id = '[Alice User ID]';

-- Expected:
-- total_earned: 2.00
-- monthly_recurring_revenue: 1.00 (unchanged)
-- lifetime_months_paid: 2

-- Check new payout record
SELECT COUNT(*) FROM referral_monthly_payouts 
WHERE referrer_id = '[Alice User ID]';

-- Expected: 2 rows (Month 1 + Month 2)
```

### Method B: RevenueCat Sandbox Test (Real)
```
1. Wait 30 days (or use RevenueCat sandbox accelerated billing)
2. Bob's subscription auto-renews
3. Webhook receives RENEWAL event
4. Database updates automatically
```

---

## ❌ Test Scenario 3: Cancellation

### Manual SQL Test:
```sql
-- Simulate Bob cancels subscription
SELECT cancel_referral_subscription('[Bob User ID]');

-- Check referral status
SELECT status, subscription_status, cancelled_at 
FROM referrals 
WHERE referred_user_id = '[Bob User ID]';

-- Expected:
-- status: inactive
-- subscription_status: cancelled
-- cancelled_at: [timestamp]

-- Check Alice's MRR decreased
SELECT monthly_recurring_revenue, active_referrals_count 
FROM referral_earnings 
WHERE user_id = '[Alice User ID]';

-- Expected:
-- monthly_recurring_revenue: 0.00
-- active_referrals_count: 0

-- BUT total_earned should NOT decrease:
SELECT total_earned FROM referral_earnings 
WHERE user_id = '[Alice User ID]';

-- Expected: Still $2.00 (Alice keeps what she earned)
```

---

## 📊 Test Scenario 4: Multiple Referrals

### Setup:
```
1. User A (Alice) refers:
   - User B (Bob) → subscribes
   - User C (Carol) → subscribes
   - User D (Dave) → subscribes
```

### Expected Database State:
```sql
-- Alice's earnings summary
SELECT * FROM referral_earnings WHERE user_id = '[Alice User ID]';

-- Expected:
-- monthly_recurring_revenue: 3.00
-- active_referrals_count: 3
-- total_earned: 3.00
-- converted_referrals_count: 3

-- Check all referrals
SELECT referred_user_id, status, total_earned 
FROM referrals 
WHERE referrer_id = '[Alice User ID]';

-- Expected: 3 rows, all active, $1 each
```

### After 6 Months (Simulate):
```sql
-- Simulate 6 renewals for each referral
DO $$
BEGIN
  FOR i IN 1..6 LOOP
    PERFORM process_recurring_commission('[Bob User ID]');
    PERFORM process_recurring_commission('[Carol User ID]');
    PERFORM process_recurring_commission('[Dave User ID]');
  END LOOP;
END $$;

-- Check Alice's total earnings
SELECT total_earned, lifetime_months_paid 
FROM referral_earnings 
WHERE user_id = '[Alice User ID]';

-- Expected:
-- total_earned: 21.00 (3 users × $1 × 7 months each)
-- lifetime_months_paid: 21
```

---

## 🪝 Test Scenario 5: Webhook Integration

### Test Webhook Directly:
```bash
# Send test INITIAL_PURCHASE event
curl -X POST https://jsvzqgtqkanscjoafyoi.supabase.co/functions/v1/revenuecat-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "type": "INITIAL_PURCHASE",
      "app_user_id": "[Bob User ID]",
      "product_id": "com.glowcheck.monthly.premium"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "event_type": "INITIAL_PURCHASE",
  "processed_at": "2025-01-15T10:30:00Z"
}
```

### Check Supabase Function Logs:
```
1. Go to: Supabase Dashboard → Edge Functions → revenuecat-webhook → Logs
2. Look for:
   ✅ "Initial purchase detected - activating referral"
   ✅ "Referral activated successfully"
   ✅ "$1 commission credited to referrer"
```

---

## 🔍 Common Issues & Solutions

### Issue: "No referrer found"
**Cause:** User didn't sign up with referral code  
**Solution:** Ensure referral code is captured in signup flow

**Test:**
```sql
-- Check if referral code was stored in profile
SELECT referred_by_code FROM profiles WHERE id = '[User ID]';

-- If NULL, user didn't use a code
```

### Issue: "User already has referral"
**Cause:** User already referred by someone  
**Solution:** This is expected behavior (one referral per user)

**Test:**
```sql
-- Check existing referral
SELECT * FROM referrals WHERE referred_user_id = '[User ID]';
```

### Issue: "Commission not processing"
**Cause:** Webhook not firing or database function error  
**Solution:** Check webhook logs

**Test:**
```sql
-- Check recent payouts
SELECT * FROM referral_monthly_payouts 
ORDER BY created_at DESC 
LIMIT 10;

-- If empty, webhook might not be configured
```

### Issue: "Earnings not showing in app"
**Cause:** RPC function not returning data  
**Solution:** Test RPC function directly

**Test:**
```sql
-- Test get_user_referral_stats
SELECT * FROM get_user_referral_stats('[User ID]');

-- Should return stats row
```

---

## 📈 Performance Testing

### Test with High Volume:
```sql
-- Create 100 test referrals
DO $$
DECLARE
  referrer_id UUID := '[Alice User ID]';
  test_user_id UUID;
BEGIN
  FOR i IN 1..100 LOOP
    -- Create test user
    INSERT INTO auth.users (id, email) 
    VALUES (gen_random_uuid(), 'test' || i || '@example.com')
    RETURNING id INTO test_user_id;
    
    -- Create referral
    INSERT INTO referrals (referrer_id, referred_user_id, referral_code, status)
    VALUES (referrer_id, test_user_id, 'ABC123XY', 'active');
    
    -- Process initial commission
    PERFORM mark_referral_active(test_user_id);
  END LOOP;
END $$;

-- Check Alice's earnings
SELECT * FROM referral_earnings WHERE user_id = '[Alice User ID]';

-- Expected:
-- monthly_recurring_revenue: 100.00
-- active_referrals_count: 100
-- total_earned: 100.00
```

---

## ✅ Acceptance Criteria

Your system is ready for production when:

- [ ] New users get referral codes automatically
- [ ] Referral signup tracking works (referred_by_code stored)
- [ ] First purchase triggers commission ($1 added)
- [ ] Webhook processes INITIAL_PURCHASE, RENEWAL, CANCELLATION
- [ ] Earnings display correctly in app
- [ ] Database constraints prevent duplicate referrals
- [ ] RLS policies protect user data
- [ ] Function logs show successful processing
- [ ] RevenueCat webhook delivery shows 200 OK
- [ ] Manual SQL tests pass for all scenarios

---

## 🚀 Production Readiness Test

### Final Checklist:
```bash
# 1. Test full user flow
./test-referral-flow.sh

# 2. Check database health
SELECT COUNT(*) FROM referral_codes;
SELECT COUNT(*) FROM referrals;
SELECT COUNT(*) FROM referral_monthly_payouts;
SELECT SUM(total_earned) FROM referral_earnings;

# 3. Test webhook endpoint
curl -I https://jsvzqgtqkanscjoafyoi.supabase.co/functions/v1/revenuecat-webhook

# Expected: HTTP 200 or 405 (POST required)

# 4. Verify RevenueCat integration
# - Check RevenueCat dashboard for recent webhook deliveries
# - Ensure all events are being sent successfully

# 5. Test error handling
# - Try invalid referral code → should handle gracefully
# - Try duplicate referral → should prevent
# - Try self-referral → should block
```

---

## 📞 Need Help?

If tests fail, check:
1. **Supabase Logs**: Dashboard → Edge Functions → Logs
2. **RevenueCat Logs**: Dashboard → Webhooks → Recent Deliveries
3. **App Console**: Look for error messages
4. **Database Errors**: Run SQL queries manually

Common fixes:
- Clear AsyncStorage and re-test
- Restart app after database changes
- Verify environment variables are set
- Check RevenueCat user ID matches Supabase user ID

---

**Ready to test?** Start with Test Scenario 1 and work your way through! 🚀
