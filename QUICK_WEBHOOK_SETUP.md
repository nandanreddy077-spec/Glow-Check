# ⚡ Quick Setup - RevenueCat Webhook

## 🎯 Goal
Deploy webhook to handle recurring $1/month referral commissions

---

## 🚀 Commands to Run (Copy & Paste)

```bash
# 1. Install Supabase CLI (Mac)
brew install supabase/tap/supabase

# 2. Login
supabase login

# 3. Link project
supabase link --project-ref jsvzqgtqkanscjoafyoi

# 4. Deploy webhook
supabase functions deploy revenuecat-webhook
```

---

## 🔑 Copy This Webhook URL

```
https://jsvzqgtqkanscjoafyoi.supabase.co/functions/v1/revenuecat-webhook
```

Paste this in RevenueCat → Webhooks → Webhook URL

---

## 🔐 Generate Secret (Optional but Recommended)

```bash
openssl rand -base64 32
```

This generates something like: `Xz8kL2mP9qR3sT4vU5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4o=`

---

## 📝 Add to Supabase Secrets

Go to: https://supabase.com/dashboard/project/jsvzqgtqkanscjoafyoi/settings/functions

Add these secrets:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://jsvzqgtqkanscjoafyoi.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdnpxZ3Rxa2Fuc2Nqb2FmeW9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc2MTEzOSwiZXhwIjoyMDczMzM3MTM5fQ.HKlU9mV4iwGj3xuxzxHcPEDG2ptZvvImABeLtS4athw` |
| `REVENUECAT_WEBHOOK_SECRET` | (Your generated secret) |

---

## 📝 RevenueCat Configuration

Fill in your webhook form:

| Field | Value |
|-------|-------|
| **Webhook URL** | `https://jsvzqgtqkanscjoafyoi.supabase.co/functions/v1/revenuecat-webhook` |
| **Authorization header value** | `Bearer YOUR_GENERATED_SECRET` |
| **Environment** | Both Production and Sandbox |
| **App** | All apps |
| **Event type** | All events |

Click **Save**

---

## ✅ Test It

1. Click **"Send test event"** in RevenueCat
2. Select: `INITIAL_PURCHASE`
3. Should see ✅ Success!

Check logs: https://supabase.com/dashboard/project/jsvzqgtqkanscjoafyoi/functions/revenuecat-webhook/logs

---

## 🎉 Done!

Your recurring referral system is live!

For full details, see: `WEBHOOK_DEPLOYMENT_COMPLETE_GUIDE.md`

---

## 🆘 Need Help?

**If deployment fails:**
- Make sure Supabase CLI is installed: `supabase --version`
- Make sure you're logged in: `supabase login`
- Check project is linked: `supabase projects list`

**If webhook returns error:**
- Check Supabase function logs (link above)
- Verify secrets are set correctly
- Make sure database setup SQL was run

**Database not setup?**
Run: `recurring-referral-system-setup.sql` in Supabase SQL Editor

---

## 💰 How It Works

1. User B signs up with User A's referral code
2. User B subscribes → `INITIAL_PURCHASE` → User A gets $1
3. User B's subscription renews → `RENEWAL` → User A gets $1
4. User B cancels → `CANCELLATION` → Commissions stop

Repeat monthly = Recurring income! 🎯
