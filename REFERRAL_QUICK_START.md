# 🚀 Quick Start: Recurring Referral System

## What You Need to Provide

### 1️⃣ Supabase Service Role Key
**Where to get it:**
1. Go to: https://supabase.com/dashboard/project/jsvzqgtqkanscjoafyoi/settings/api
2. Find the `service_role` section
3. Copy the key (starts with `eyJ...`)

**What it's for:**
- Allows webhook to bypass Row Level Security
- Processes commissions automatically
- **⚠️ Keep this secret! Never commit to git!**

---

### 2️⃣ Run Database Setup
**What to do:**
1. Open: https://supabase.com/dashboard/project/jsvzqgtqkanscjoafyoi/sql/new
2. Copy entire content of `recurring-referral-system-setup.sql`
3. Paste and click **RUN**

**What it creates:**
- Referral tracking tables
- Monthly payout records
- Earnings summaries
- Security policies

**Time:** ~2 minutes

---

### 3️⃣ Deploy Webhook to Supabase
**Option A: Using Supabase CLI (Recommended)**

```bash
# Install CLI
brew install supabase/tap/supabase

# Login
supabase login

# Link project
supabase link --project-ref jsvzqgtqkanscjoafyoi
# Password: Autobio123!

# Create function folder
mkdir -p supabase/functions/revenuecat-webhook

# Copy webhook file
cp revenuecat-webhook-handler.ts supabase/functions/revenuecat-webhook/index.ts

# Deploy
supabase functions deploy revenuecat-webhook

# Set environment variables in Supabase Dashboard:
# - SUPABASE_SERVICE_ROLE_KEY: [from step 1]
```

**Your webhook URL will be:**
```
https://jsvzqgtqkanscjoafyoi.supabase.co/functions/v1/revenuecat-webhook
```

**Time:** ~5 minutes

---

**Option B: No CLI - Manual Setup**

If you don't want to use CLI:
1. I can help you set up webhook another way
2. Or you can use RevenueCat's webhook integrations directly with Supabase

---

### 4️⃣ Configure RevenueCat Webhook
**What to do:**
1. Open RevenueCat Dashboard
2. Go to: Project Settings → Integrations → Webhooks
3. Click **+ Add Webhook**
4. Enter webhook URL: `https://jsvzqgtqkanscjoafyoi.supabase.co/functions/v1/revenuecat-webhook`
5. Enable events:
   - ✅ INITIAL_PURCHASE
   - ✅ RENEWAL
   - ✅ CANCELLATION
   - ✅ EXPIRATION
6. Click **Save**

**Time:** ~2 minutes

---

## 🧪 Testing

### Quick Test:
1. Create test user and get referral code
2. Create second user with that code
3. Subscribe as second user
4. Check database:
```sql
SELECT * FROM referral_earnings;
SELECT * FROM referral_monthly_payouts;
```

Should show $1 earned!

---

## 📊 What Happens After Setup

### User Flow:
1. **User A shares** referral code → User B signs up
2. **User B subscribes** → User A earns $1 immediately
3. **Month 2**: User B's subscription renews → User A earns another $1
4. **Every month**: As long as User B stays subscribed → User A keeps earning $1/month
5. **If User B cancels** → User A stops earning (but keeps what was already earned)

### Database Flow:
```
User A shares code
    ↓
User B signs up → Record in `referrals` (status: pending)
    ↓
User B subscribes → RevenueCat webhook → `mark_referral_active()`
    ↓
$1 added to `referral_monthly_payouts` (Month 1)
    ↓
User A's `referral_earnings` updated (+$1 earned, +$1 MRR)
    ↓
Every renewal → `process_recurring_commission()` → +$1
```

---

## ❓ FAQ

**Q: Do I need a backend server?**  
A: No! Supabase Edge Functions handle everything.

**Q: What if I already have users?**  
A: They'll get referral codes automatically when you run the SQL setup.

**Q: How do users cash out?**  
A: You decide! Options:
- App credit (easiest)
- Manual PayPal/Venmo
- Automated with Stripe Connect

**Q: Is there a limit?**  
A: No! The more referrals, the more passive income.

**Q: What if webhook fails?**  
A: RevenueCat retries automatically. You can also manually trigger commissions via SQL.

---

## 🆘 If You Get Stuck

**Can't get Supabase service key?**
→ Let me know, I'll guide you step-by-step

**Webhook deployment failing?**
→ We can use alternative methods

**Want to test without real purchases?**
→ I can show you how to manually trigger commissions for testing

---

## ✅ That's It!

Just provide the Supabase service role key and let me know once you've:
1. ✅ Run the database SQL
2. ✅ Deployed the webhook (or need help with it)
3. ✅ Configured RevenueCat webhook

Then we'll test it together! 🚀

---

**Need help with any step?** Just ask! I'm here to guide you through each part.
