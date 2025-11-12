# 🚀 Complete Your Recurring Referral Setup

## What You Have Now
✅ Basic referral tables created  
✅ Service Role Key configured  
✅ App code fully integrated  

## What You Need to Do (3 Steps)

---

## Step 1: Run the Recurring Referral SQL (5 minutes)

1. **Go to Supabase SQL Editor**
   - Open: https://supabase.com/dashboard/project/jsvzqgtqkanscjoafyoi/sql/new

2. **Copy the SQL file**
   - Open `recurring-referral-system-setup.sql` in your project
   - Copy ALL the contents

3. **Paste and Run**
   - Paste into Supabase SQL editor
   - Click **Run** button
   - Wait for "Success" message

**What this does:**
- Upgrades tables to track monthly recurring commissions
- Adds functions to process renewals automatically
- Creates audit trail for all payouts

---

## Step 2: Deploy the Webhook (15 minutes)

The webhook automatically processes commissions when:
- User subscribes → Earn $1
- Subscription renews → Earn another $1
- Subscription cancels → Stop commissions

### Option A: Supabase Edge Function (Recommended)

1. **Install Supabase CLI** (if not installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link your project**
   ```bash
   supabase link --project-ref jsvzqgtqkanscjoafyoi
   ```

4. **Create the webhook folder**
   ```bash
   mkdir -p supabase/functions/revenuecat-webhook
   ```

5. **Copy webhook code**
   - Copy contents from `revenuecat-webhook-handler.ts`
   - Save as `supabase/functions/revenuecat-webhook/index.ts`

6. **Set the service key secret**
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdnpxZ3Rxa2Fuc2Nqb2FmeW9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc2MTEzOSwiZXhwIjoyMDczMzM3MTM5fQ.HKlU9mV4iwGj3xuxzxHcPEDG2ptZvvImABeLtS4athw"
   ```

7. **Deploy the webhook**
   ```bash
   supabase functions deploy revenuecat-webhook
   ```

8. **Get your webhook URL** (save this!)
   ```
   https://jsvzqgtqkanscjoafyoi.supabase.co/functions/v1/revenuecat-webhook
   ```

### Option B: Use Your Own Backend

If you have a Node.js/Express backend:
- Use `revenuecat-webhook-handler.ts` as reference
- Implement the same logic in your backend
- Make sure to call Supabase RPC functions

---

## Step 3: Configure RevenueCat Webhook (5 minutes)

1. **Go to RevenueCat Dashboard**
   - https://app.revenuecat.com/

2. **Navigate to Webhooks**
   - Click your project
   - Go to **Integrations** → **Webhooks**

3. **Add Webhook URL**
   ```
   https://jsvzqgtqkanscjoafyoi.supabase.co/functions/v1/revenuecat-webhook
   ```

4. **Enable These Events:**
   - ✅ `INITIAL_PURCHASE` - First subscription
   - ✅ `RENEWAL` - Monthly renewals
   - ✅ `CANCELLATION` - When user cancels
   - ✅ `EXPIRATION` - When subscription expires

5. **Save Configuration**

---

## Step 4: Test It! (10 minutes)

### Create Test Referral

1. **User A creates referral code:**
   - Open app as User A
   - Go to Referral Rewards
   - Copy referral code (e.g., "ABC12345")

2. **User B signs up with code:**
   - Create new account as User B
   - Use referral code during signup

3. **User B subscribes:**
   - Purchase subscription as User B
   - Check RevenueCat webhook logs

4. **Verify in Database:**
   ```sql
   -- Check referral was marked active
   SELECT * FROM referrals WHERE status = 'active';
   
   -- Check commission was recorded
   SELECT * FROM referral_monthly_payouts;
   
   -- Check referrer earnings updated
   SELECT * FROM referral_earnings;
   ```

5. **Check in App:**
   - Open app as User A
   - Go to Referral Rewards
   - Should show: "1 Active Referral", "$1/mo MRR", "$1 Total Earned"

---

## Step 5: Simulate Monthly Renewal (Optional)

To test recurring commissions without waiting a month:

```sql
-- Manually trigger a renewal commission
SELECT process_recurring_commission('USER_B_UUID_HERE');

-- Verify another commission was added
SELECT * FROM referral_monthly_payouts ORDER BY created_at DESC LIMIT 5;

-- Check User A's earnings doubled
SELECT * FROM referral_earnings WHERE user_id = 'USER_A_UUID_HERE';
```

---

## 🎉 You're Done! What Happens Now?

### Automatic Flow:
1. User shares referral code
2. Friend signs up with code → Tracked in database
3. Friend subscribes → RevenueCat webhook fires → $1 commission created
4. Every month friend stays subscribed → Webhook fires → Another $1 commission
5. Friend cancels → Webhook stops future commissions
6. Referrer sees real-time earnings in app

### What You'll See:
- Users start sharing codes immediately
- Commissions process automatically every month
- Growth through word-of-mouth
- Lower customer acquisition costs

---

## 💡 Optional Enhancements

### Add Minimum Payout Threshold
Users can only withdraw after earning $10+:
```typescript
const minimumPayout = 10.00;
if (totalEarned >= minimumPayout) {
  // Show "Request Payout" button
}
```

### Add Payout Methods
Let users choose how to receive money:
- App credit (easiest to implement)
- PayPal email
- Bank transfer via Stripe Connect

### Add Push Notifications
Notify users when they earn:
```typescript
// When commission is added
sendPushNotification({
  title: "💰 You earned $1!",
  body: "Sarah just renewed her subscription"
});
```

---

## 📊 Monitoring

### Check Webhook Logs
```bash
supabase functions logs revenuecat-webhook
```

### Database Queries

**Active referrals:**
```sql
SELECT COUNT(*) FROM referrals WHERE status = 'active';
```

**Total monthly commissions:**
```sql
SELECT SUM(amount) FROM referral_monthly_payouts WHERE status = 'confirmed';
```

**Top referrers:**
```sql
SELECT user_id, total_earned, active_referrals_count, monthly_recurring_revenue
FROM referral_earnings
ORDER BY total_earned DESC
LIMIT 10;
```

---

## ❓ Troubleshooting

### Webhook Not Firing?
1. Check RevenueCat webhook logs
2. Verify webhook URL is correct
3. Check Supabase function logs: `supabase functions logs revenuecat-webhook`

### Commissions Not Recording?
1. Verify user has referral code in profile:
   ```sql
   SELECT referred_by_code FROM profiles WHERE id = 'USER_UUID';
   ```
2. Check referrals table:
   ```sql
   SELECT * FROM referrals WHERE referred_user_id = 'USER_UUID';
   ```

### Database Errors?
1. Make sure you ran the recurring SQL script
2. Check all functions exist:
   ```sql
   SELECT * FROM pg_proc WHERE proname LIKE '%referral%';
   ```

---

## 🚀 Ready to Launch!

Once all 4 steps are complete:
- ✅ Recurring SQL script run
- ✅ Webhook deployed
- ✅ RevenueCat configured
- ✅ Testing successful

**Your referral system is production-ready!** 🎉

Users can start earning $1/month per active referral immediately. The more they share, the more passive income they generate!

---

## 📞 Need Help?

If you get stuck:
1. Check Supabase function logs
2. Check RevenueCat webhook logs
3. Verify database tables exist
4. Test with manual SQL queries

**The system is fully automated once set up. No ongoing maintenance needed!**
