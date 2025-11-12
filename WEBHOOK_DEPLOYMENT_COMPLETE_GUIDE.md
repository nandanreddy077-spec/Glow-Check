# 🚀 RevenueCat Webhook Setup - Complete Guide

## What This Does
This webhook automatically processes recurring $1/month referral commissions when:
- Someone signs up using a referral code → $1 credited
- Their subscription renews each month → Another $1 credited
- They cancel → Commissions stop
- They reactivate → Commissions resume

---

## 📋 Step-by-Step Deployment

### Step 1: Install Supabase CLI

**Mac:**
```bash
brew install supabase/tap/supabase
```

**Windows (PowerShell as Admin):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Linux:**
```bash
brew install supabase/tap/supabase
```

Or download from: https://github.com/supabase/cli/releases

---

### Step 2: Login to Supabase

```bash
supabase login
```

This opens your browser to authenticate. Click "Authorize" when prompted.

---

### Step 3: Link Your Project

```bash
supabase link --project-ref jsvzqgtqkanscjoafyoi
```

When asked for **database password**, enter your Supabase database password (you set this when creating the project).

---

### Step 4: Deploy the Webhook Function

The function file is already created at `supabase/functions/revenuecat-webhook/index.ts`.

Deploy it with:

```bash
supabase functions deploy revenuecat-webhook
```

You should see:
```
✅ Deployed Function revenuecat-webhook
Function URL: https://jsvzqgtqkanscjoafyoi.supabase.co/functions/v1/revenuecat-webhook
```

**Copy this URL** - you'll need it for RevenueCat!

---

### Step 5: Set Environment Variables in Supabase

1. Go to: https://supabase.com/dashboard/project/jsvzqgtqkanscjoafyoi/settings/functions
2. Click on **"Secrets"** or **"Environment Variables"**
3. Add these secrets:

| Secret Name | Value | Where to Get It |
|------------|-------|-----------------|
| `SUPABASE_URL` | `https://jsvzqgtqkanscjoafyoi.supabase.co` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Already in your .env file |
| `REVENUECAT_WEBHOOK_SECRET` | (Generate a random string) | Create your own (optional) |

**For REVENUECAT_WEBHOOK_SECRET:**
Run this to generate a secure random string:
```bash
openssl rand -base64 32
```

Example output: `Xz8kL2mP9qR3sT4vU5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4o=`

Copy this value and use it as your webhook secret.

---

### Step 6: Configure RevenueCat Webhook

Now go back to your RevenueCat dashboard screenshot and fill in:

1. **Webhook URL:** 
   ```
   https://jsvzqgtqkanscjoafyoi.supabase.co/functions/v1/revenuecat-webhook
   ```

2. **Authorization header value:**
   ```
   Bearer Xz8kL2mP9qR3sT4vU5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4o=
   ```
   *(Replace with your generated secret from Step 5)*

3. **Environment:** `Both Production and Sandbox`

4. **App:** `All apps`

5. **Event type:** `All events`

6. Click **"Save"** at the bottom

---

### Step 7: Test the Webhook

1. In RevenueCat dashboard, click **"Send test event"**
2. Select event type: `INITIAL_PURCHASE`
3. Click **"Send"**

You should see a success message!

---

### Step 8: Check Webhook Logs

**In Supabase:**
1. Go to: https://supabase.com/dashboard/project/jsvzqgtqkanscjoafyoi/functions/revenuecat-webhook/logs
2. You should see entries like:
   ```
   🔔 Received RevenueCat webhook
   📋 Event type: INITIAL_PURCHASE
   👤 User ID: 12345...
   ✅ Referral activated successfully
   💰 First commission ($1) credited to referrer
   ```

**In RevenueCat:**
1. Go to: Integrations → Webhooks
2. Click on your webhook
3. Scroll to "Recent deliveries"
4. Check status codes (200 = success)

---

## 🔍 Testing With Real Purchases

### Test Flow:

1. **User A** shares referral code: `ABC12345`
2. **User B** signs up with code `ABC12345`
3. **User B** subscribes to premium
4. ✅ Webhook fires: `INITIAL_PURCHASE`
5. 💰 User A gets $1 credited

**Next month:**
6. **User B's** subscription renews automatically
7. ✅ Webhook fires: `RENEWAL`
8. 💰 User A gets another $1

**If User B cancels:**
9. ✅ Webhook fires: `CANCELLATION`
10. ❌ Future commissions stop for User A

---

## 🗃️ Database Queries to Monitor

Check if referrals are working:
```sql
-- See all active referrals
SELECT * FROM referrals WHERE status = 'active';

-- Check total earnings
SELECT * FROM referral_earnings;

-- See monthly payouts
SELECT * FROM referral_monthly_payouts ORDER BY created_at DESC;

-- Get referral stats for a user
SELECT * FROM get_user_referral_stats('USER_ID_HERE');
```

---

## ❌ Troubleshooting

### Webhook returns 401 Unauthorized
- Check that `Authorization` header in RevenueCat matches `REVENUECAT_WEBHOOK_SECRET` in Supabase
- Format: `Bearer YOUR_SECRET_HERE`

### Webhook returns 500 Error
- Check Supabase function logs for details
- Verify database functions exist: `mark_referral_active`, `process_recurring_commission`, `cancel_referral_subscription`
- Make sure you ran the `recurring-referral-system-setup.sql` script

### Webhook not firing
- Verify webhook URL is correct in RevenueCat
- Check "Recent deliveries" in RevenueCat webhook settings
- Try sending a test event

### Commission not credited
- Check if user exists in `referrals` table
- Verify `referred_user_id` matches RevenueCat `app_user_id`
- Look at Supabase function logs for errors

---

## 🎉 Success Checklist

- [ ] Supabase CLI installed
- [ ] Linked to project
- [ ] Function deployed successfully
- [ ] Environment variables set in Supabase
- [ ] Webhook configured in RevenueCat
- [ ] Test webhook sent successfully
- [ ] Function logs show successful processing
- [ ] Database shows referral records

---

## 📞 Support

If you get stuck:
1. Check Supabase function logs: https://supabase.com/dashboard/project/jsvzqgtqkanscjoafyoi/functions/revenuecat-webhook/logs
2. Check RevenueCat webhook deliveries: RevenueCat Dashboard → Integrations → Webhooks
3. Test SQL functions directly in Supabase SQL Editor
4. Review error messages in logs

---

## 🔐 Security Notes

- Never commit `.env` files to git
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- Use `REVENUECAT_WEBHOOK_SECRET` for production
- Webhook should only be accessible to RevenueCat (use Authorization header)

---

## 📊 Expected Webhook Events

| Event | Trigger | Action |
|-------|---------|--------|
| `INITIAL_PURCHASE` | First subscription | Activate referral, credit $1 |
| `RENEWAL` | Monthly/annual renewal | Credit another $1 |
| `CANCELLATION` | User cancels | Stop future commissions |
| `EXPIRATION` | Subscription expires | Stop future commissions |
| `UNCANCELLATION` | User reactivates | Resume commissions |
| `BILLING_ISSUE` | Payment fails | Logged only |
| `PRODUCT_CHANGE` | Upgrade/downgrade | Logged only |

---

## 🎯 What's Next?

After webhook is working:
1. Test with real purchases in sandbox mode
2. Monitor webhook deliveries for 1 week
3. Switch to production when confident
4. Implement payout system (manual or automated)
5. Add notifications for referrers when they earn commissions

---

## 💡 Pro Tips

- Use RevenueCat's sandbox mode for testing
- Monitor webhook success rate (should be >99%)
- Set up alerts for webhook failures
- Regularly check referral earnings table for accuracy
- Consider adding email notifications when users earn commissions

---

That's it! Your recurring referral system is now live. 🎉
