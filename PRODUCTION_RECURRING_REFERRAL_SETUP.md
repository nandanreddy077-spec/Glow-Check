# 🚀 Production Recurring Referral Setup Guide

## 📋 Current Status

### ✅ Already Configured
- **Supabase URL**: `https://jsvzqgtqkanscjoafyoi.supabase.co`
- **Supabase Anon Key**: Configured in `.env`
- **RevenueCat iOS Key**: `appl_UpDZroTEjwQSDDRJdqLgYihNxsh`
- **RevenueCat Android Key**: `goog_xCXiGuMlJXxLNPQUlodNDLnAAYZ`
- **Entitlement ID**: `Premium Access` (entlf3294f6359)
- **App Code**: Fully integrated and ready

### 📦 Product IDs Configured
- **iOS Monthly**: `com.glowcheck.monthly.premium`
- **iOS Yearly**: `com.glowcheck.yearly1.premium`
- **Android Monthly**: `com.glowcheck.app.premium.monthly.p1m:monthly-auto`
- **Android Yearly**: `com.glowcheck.app.premium.yearly.p1y:yearly-auto`

---

## 🔑 Step 1: Get Required Keys

### A. Supabase Service Role Key
1. Go to: https://supabase.com/dashboard/project/jsvzqgtqkanscjoafyoi/settings/api
2. Copy the `service_role` key (⚠️ Keep this secret!)
3. This key bypasses RLS and is needed for webhook operations

### B. RevenueCat Webhook Secret (Optional but Recommended)
1. Go to: RevenueCat Dashboard → Project Settings → Webhooks
2. Generate a webhook secret for signature verification
3. This ensures webhooks are authentic

---

## 🗄️ Step 2: Run Database Setup

### Option A: Run SQL File (Recommended)
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/jsvzqgtqkanscjoafyoi/sql
2. Copy contents of `recurring-referral-system-setup.sql`
3. Click **Run** ✓
4. Verify tables created:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%referral%';
```

Expected tables:
- `referral_codes`
- `referrals`
- `referral_monthly_payouts`
- `referral_earnings`
- `referral_withdrawal_requests`

---

## 🪝 Step 3: Deploy RevenueCat Webhook

### Option A: Supabase Edge Function (Easiest)

#### 1. Install Supabase CLI
```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or use npm
npm install -g supabase
```

#### 2. Login to Supabase
```bash
supabase login
```

#### 3. Link Your Project
```bash
supabase link --project-ref jsvzqgtqkanscjoafyoi
```
Enter your database password when prompted (Autobio123!)

#### 4. Create Function Directory
```bash
mkdir -p supabase/functions/revenuecat-webhook
```

#### 5. Copy Webhook Handler
Copy `revenuecat-webhook-handler.ts` to `supabase/functions/revenuecat-webhook/index.ts`

Or create the file directly:
```bash
cp revenuecat-webhook-handler.ts supabase/functions/revenuecat-webhook/index.ts
```

#### 6. Deploy Function
```bash
supabase functions deploy revenuecat-webhook
```

#### 7. Set Environment Variables
In Supabase Dashboard → Edge Functions → revenuecat-webhook → Settings:
```
SUPABASE_URL=https://jsvzqgtqkanscjoafyoi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[Your service role key from Step 1A]
REVENUECAT_WEBHOOK_SECRET=[Optional - from Step 1B]
```

#### 8. Get Webhook URL
Your webhook URL will be:
```
https://jsvzqgtqkanscjoafyoi.supabase.co/functions/v1/revenuecat-webhook
```

---

### Option B: Your Own Server (If you have backend)

If you prefer to host the webhook on your own server:

1. Use `revenuecat-webhook-handler.ts` as reference
2. Implement in your backend (Node.js, Python, etc.)
3. Call these Supabase RPC functions:
   - `mark_referral_active(user_id)` - On initial purchase
   - `process_recurring_commission(user_id)` - On renewal
   - `cancel_referral_subscription(user_id)` - On cancellation

Example in Node.js:
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jsvzqgtqkanscjoafyoi.supabase.co',
  '[YOUR_SERVICE_ROLE_KEY]'
);

app.post('/revenuecat-webhook', async (req, res) => {
  const { event } = req.body;
  const userId = event.app_user_id;

  switch (event.type) {
    case 'INITIAL_PURCHASE':
      await supabase.rpc('mark_referral_active', { 
        referred_user_uuid: userId 
      });
      break;
    
    case 'RENEWAL':
      await supabase.rpc('process_recurring_commission', { 
        referred_user_uuid: userId 
      });
      break;
    
    case 'CANCELLATION':
    case 'EXPIRATION':
      await supabase.rpc('cancel_referral_subscription', { 
        referred_user_uuid: userId 
      });
      break;
  }

  res.json({ success: true });
});
```

---

## 🔗 Step 4: Configure RevenueCat Webhook

1. Go to: RevenueCat Dashboard → Project Settings → Integrations → Webhooks
2. Click **+ Add Webhook**
3. Enter your webhook URL:
   - Supabase: `https://jsvzqgtqkanscjoafyoi.supabase.co/functions/v1/revenuecat-webhook`
   - Or your own server URL
4. Enable these events:
   - ✅ **INITIAL_PURCHASE** - First subscription
   - ✅ **RENEWAL** - Monthly/yearly renewal
   - ✅ **CANCELLATION** - User cancels
   - ✅ **EXPIRATION** - Subscription expires
   - ✅ **UNCANCELLATION** - User reactivates
5. (Optional) Add Authorization header:
   ```
   Authorization: Bearer [YOUR_SUPABASE_ANON_KEY]
   ```
6. Click **Save**

---

## 🧪 Step 5: Test the System

### Test Flow:
1. **Create User A** (Referrer)
   - Sign up in app
   - Go to Referral Rewards screen
   - Copy referral code (e.g., `ABC123XY`)

2. **Create User B** (Referred)
   - Sign up with referral code: `?ref=ABC123XY`
   - Complete first scan
   - Subscribe to premium (use test card or TestFlight)

3. **Verify in Database**
```sql
-- Check referral was created
SELECT * FROM referrals WHERE referrer_id = '[User A ID]';

-- Check first commission was paid
SELECT * FROM referral_monthly_payouts 
WHERE referrer_id = '[User A ID]'
ORDER BY created_at DESC;

-- Check earnings updated
SELECT * FROM referral_earnings WHERE user_id = '[User A ID]';
```

4. **Check User A's App**
   - Open Referral Rewards screen
   - Should show:
     - Total Referrals: 1
     - Active Subscribers: 1
     - Monthly Recurring Revenue: $1.00
     - Total Earned: $1.00

### Test Renewal (Manual):
```sql
-- Simulate a renewal for User B
SELECT process_recurring_commission('[User B ID]');

-- Check User A's earnings increased
SELECT * FROM referral_earnings WHERE user_id = '[User A ID]';
-- total_earned should now be $2.00
```

### Test Cancellation (Manual):
```sql
-- Simulate User B cancels subscription
SELECT cancel_referral_subscription('[User B ID]');

-- Check referral status changed
SELECT * FROM referrals WHERE referred_user_id = '[User B ID]';
-- status should be 'inactive'
```

---

## 🔍 Step 6: Monitor & Troubleshoot

### Check Webhook Logs (Supabase Edge Function)
1. Go to: Supabase Dashboard → Edge Functions → revenuecat-webhook → Logs
2. Look for:
   - ✅ "Initial purchase detected - activating referral"
   - ✅ "Referral activated successfully"
   - ✅ "$1 commission credited to referrer"

### Check Webhook Logs (RevenueCat)
1. Go to: RevenueCat Dashboard → Integrations → Webhooks
2. Click your webhook
3. View "Recent Deliveries"
4. Check for 200 OK responses

### Verify RevenueCat User ID Mapping
Make sure RevenueCat `app_user_id` matches Supabase `user.id`:
```typescript
// In your app, when user logs in:
import Purchases from 'react-native-purchases';
await Purchases.logIn(user.id); // Use Supabase user.id
```

This is already handled in `lib/payments.ts`:
```typescript
await Purchases.configure({
  apiKey,
  appUserID: null, // RevenueCat auto-assigns, then we map it
});
```

### Common Issues & Fixes

#### Issue: "No referrer found"
- **Cause**: User B didn't sign up with referral code
- **Fix**: Ensure referral code is captured on signup

#### Issue: "User already has referral"
- **Cause**: User B already referred by someone else
- **Fix**: One referral per user (business logic working correctly)

#### Issue: "Commission not processing"
- **Cause**: Webhook not configured or failing
- **Fix**: Check webhook logs in both RevenueCat and Supabase

---

## 💰 Step 7: Configure Payouts

Users will accumulate earnings ($1/month per referral). You need to decide how to pay them:

### Option A: App Credit (Easiest)
- Apply earnings as credit toward their subscription
- Update subscription price:
```typescript
const discount = Math.min(earnings, subscriptionPrice);
const finalPrice = subscriptionPrice - discount;
```

### Option B: Manual Payouts
- Users request withdrawal via app
- Process manually via PayPal/Venmo/Bank transfer
- Minimum: $10
- Update database when paid:
```sql
UPDATE referral_monthly_payouts 
SET status = 'paid', payment_date = NOW()
WHERE referrer_id = '[User ID]' AND status = 'confirmed';

UPDATE referral_earnings
SET total_paid_out = total_paid_out + [amount],
    total_pending = total_pending - [amount]
WHERE user_id = '[User ID]';
```

### Option C: Automated (Stripe Connect)
- Integrate Stripe Connect for automated bank deposits
- Users connect bank account
- Auto-payout monthly when balance > $10
- Requires additional Stripe setup

---

## 📊 Step 8: Track Metrics

### Key Metrics to Monitor:

```sql
-- Total active referrals across all users
SELECT COUNT(*) as active_referrals 
FROM referrals 
WHERE status = 'active';

-- Total monthly commission liability
SELECT SUM(monthly_recurring_revenue) as total_mrr 
FROM referral_earnings;

-- Conversion rate (signups → paid)
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending') as signups,
  COUNT(*) FILTER (WHERE status = 'active') as conversions,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'active')::DECIMAL / 
    COUNT(*)::DECIMAL * 100, 2
  ) as conversion_rate_percent
FROM referrals;

-- Average lifetime value per referral
SELECT 
  AVG(total_earned) as avg_ltv,
  AVG(total_months_paid) as avg_months
FROM referrals 
WHERE status = 'active';

-- Top referrers
SELECT 
  p.email,
  re.active_referrals_count,
  re.monthly_recurring_revenue,
  re.total_earned
FROM referral_earnings re
JOIN profiles p ON re.user_id = p.id
ORDER BY re.monthly_recurring_revenue DESC
LIMIT 10;
```

---

## 📱 Step 9: Promote Referrals

### In-App Promotion Ideas:
1. **Post-Scan Prompt**: "Share with friends and earn $1/month per subscriber!"
2. **Referral Tab**: Dedicated section with stats and share button
3. **Push Notifications**: "You earned $5 this month from referrals!"
4. **Social Proof**: "Sarah is earning $12/month from 12 friends"

### Marketing Copy:
- "Earn passive income by sharing beauty tips"
- "Get paid every month your friends stay subscribed"
- "Turn your beauty community into income"
- "Share → Earn → Repeat"

---

## 🎯 Expected Revenue Impact

### Conservative Scenario:
- 500 active users
- 10% share referral link (50 users)
- 20% conversion rate (10 paid referrals)
- Avg 6-month retention

**Monthly Cost**: 10 × $1 = $10/month  
**Monthly Revenue**: 10 × $8.99 = $89.90/month  
**Net Profit**: $79.90/month  
**ROI**: 799%

### Growth Scenario:
- 5,000 active users
- 20% share (1,000 referrers)
- 30% conversion (300 paid referrals)
- Avg 12-month retention

**Monthly Cost**: 300 × $1 = $300/month  
**Monthly Revenue**: 300 × $8.99 = $2,697/month  
**Net Profit**: $2,397/month  
**Annual Net**: $28,764  
**ROI**: 799%

---

## ✅ Pre-Launch Checklist

Before launching to production:

- [ ] Database setup completed (`recurring-referral-system-setup.sql`)
- [ ] Supabase service role key obtained
- [ ] Webhook deployed (Supabase or own server)
- [ ] RevenueCat webhook configured with all events
- [ ] Test referral flow (signup → purchase → commission)
- [ ] Test renewal commission (manual SQL or wait for real renewal)
- [ ] Test cancellation flow
- [ ] Payout method decided (credit/manual/automated)
- [ ] Marketing copy prepared for in-app promotion
- [ ] Analytics/monitoring set up
- [ ] Legal: Terms updated to mention referral program

---

## 🚨 Important Production Notes

### Security:
- ✅ Service role key must be kept secret (server-side only)
- ✅ Webhook should verify RevenueCat signature
- ✅ RLS policies prevent users from seeing others' earnings
- ✅ Server-side functions prevent fraud

### Compliance:
- Update Terms of Service to include referral program
- Include minimum payout threshold ($10 recommended)
- State that earnings are paid when balance reaches minimum
- Mention program can be modified or ended at any time

### Taxes:
- If paying cash (not app credit), you may need to:
  - Collect tax info (W-9 for US users)
  - Issue 1099 forms if earnings > $600/year
  - Consult with accountant for compliance

---

## 🆘 Need Help?

### Logs to Check:
1. **Supabase Edge Function Logs**: Dashboard → Edge Functions → Logs
2. **RevenueCat Webhook Logs**: Dashboard → Webhooks → Recent Deliveries
3. **App Console Logs**: Look for "Referral activated" messages

### Support Resources:
- RevenueCat Docs: https://www.revenuecat.com/docs/webhooks
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Our Implementation: Check `contexts/ReferralContext.tsx` and `app/referral-rewards.tsx`

---

## 🎉 You're Almost There!

All the code is ready. You just need to:
1. ✅ Get Supabase service role key
2. ✅ Run database SQL
3. ✅ Deploy webhook
4. ✅ Configure RevenueCat
5. 🚀 **Launch and grow!**

Every referred subscriber becomes a recurring revenue stream for your users, creating viral growth! 🚀
