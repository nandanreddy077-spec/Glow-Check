# Complete Freemium Flow Documentation

## Overview
This document explains how the entire freemium system works in the GlowCheck app, covering free users, trial users, premium users, and promo code redemption.

---

## User Types & Access Levels

### 1. Free User (No Payment)
**Status:** `!isPremium && !hasStartedTrial`

**Access:**
- ✅ **1 free scan** for Glow Analysis
- ✅ **1 free scan** for Style Check
- ✅ Can select and view skincare plans
- ❌ **Details in Glow Coach are blurred** (can create plan, but details are hidden)
- ❌ Cannot do additional scans after using free scans

**Scan Tracking:**
- Glow Analysis scans: Tracked separately in `usage_tracking` table
- Style Check scans: Tracked separately in `usage_tracking` table
- Each scan type has its own counter (not shared)

**Results Access:**
- Results unlocked for 24 hours after first scan
- After 24 hours, user must upgrade to view results

---

### 2. Trial User (3-Day Free Trial)
**Status:** `!isPremium && hasStartedTrial && inTrial`

**How to Activate:**
1. User goes to "Start Trial" screen
2. User selects a plan (monthly or yearly)
3. User adds payment method through in-app purchase
4. 3-day trial activates immediately
5. **After 3 days**, subscription automatically starts and payment is charged

**Access:**
- ✅ **2 scans per day** for Glow Analysis (resets daily)
- ✅ **2 scans per day** for Style Check (resets daily)
- ✅ Full access to skincare plans
- ✅ Full access to Glow Coach (no blurring)
- ✅ All premium features unlocked

**Scan Tracking:**
- Separate tracking for Glow and Style scans
- Resets at midnight each day
- Usage tracked in `usage_tracking` table by feature type

**Trial Expiry:**
- After 3 days, if user doesn't cancel:
  - Subscription becomes active
  - Payment is processed
  - User becomes Premium user
- If user cancels before 3 days end:
  - No charge
  - Reverts to Free user

---

### 3. Premium User (Paid Subscription)
**Status:** `isPremium`

**How to Activate:**
1. **Option A:** User completes 3-day trial and doesn't cancel
2. **Option B:** User makes direct purchase (monthly/yearly)
3. **Option C:** User restores previous purchase

**When user presses "Pay":**
1. App initiates in-app purchase through RevenueCat
2. iOS/Android handles payment UI
3. On success:
   - `isPremium` immediately set to `true`
   - Trial flags cleared (`hasStartedTrial = false`)
   - Purchase tokens saved
   - Backend synced with Supabase
4. Premium access activated instantly

**Access:**
- ✅ **Unlimited scans** for both Glow Analysis and Style Check
- ✅ **Full access** to all features
- ✅ **No blur** on any content
- ✅ **AI Coach** access
- ✅ **Before/After** comparisons
- ✅ **Progress tracking**
- ✅ **Style recommendations**

---

### 4. Promo Code User (1-Week Free Premium)
**Status:** `hasStartedTrial && inTrial` (7-day trial)

**How to Redeem:**
1. User navigates to "Redeem Promo Code" screen
2. Enters valid promo code (e.g., `WELCOME7DAYS`, `GLOW1WEEK`, `BEAUTY7`)
3. System validates code
4. 7-day trial activates **without payment method required**
5. User gets full premium experience

**Valid Promo Codes:**
- `WELCOME7DAYS` - 7 days free premium
- `GLOW1WEEK` - 1 week free trial
- `BEAUTY7` - 7 days premium trial

**Access:**
- ✅ **Same as Premium** - unlimited everything
- ✅ **No payment required** to start
- ✅ **7 days** instead of 3 days
- ❌ **After 7 days**, reverts to Free user (no automatic charge)

**Difference from Regular Trial:**
- Regular trial: Requires payment method, auto-charges after 3 days
- Promo trial: No payment required, simply expires after 7 days

---

## Technical Implementation

### Scan Tracking (Separate Counters)

#### Database Tables:

**usage_tracking:**
```sql
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
```

**trial_tracking:**
```sql
CREATE TABLE public.trial_tracking (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_scan_at TIMESTAMP WITH TIME ZONE,
  last_free_scan_at TIMESTAMP WITH TIME ZONE,
  free_scans_used INTEGER DEFAULT 0,  -- Deprecated, kept for compatibility
  results_unlocked_until TIMESTAMP WITH TIME ZONE,
  trial_started_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  has_payment_method BOOLEAN DEFAULT FALSE,
  payment_added_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Increment Function:
```sql
CREATE OR REPLACE FUNCTION public.increment_usage_tracking(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Function body in freemium-tracking-fix.sql
$$;
```

---

### Flow Examples

#### Example 1: New User Journey (Free → Trial → Premium)

1. **User signs up** → Free user
   - Glow scans left: 1
   - Style scans left: 1

2. **User does Glow Analysis** → Uses free scan
   - Glow scans left: 0
   - Style scans left: 1
   - Results unlocked for 24 hours

3. **User tries another Glow scan** → Shown upgrade modal
   - "Start 3-Day Free Trial" button

4. **User clicks "Start Trial"** → Payment screen
   - Selects yearly plan ($99/year)
   - Adds payment method
   - Trial activates immediately

5. **User is now Trial User**
   - Glow scans: 2/day (resets daily)
   - Style scans: 2/day (resets daily)
   - Full premium features

6. **3 days pass** → Auto-charge
   - Payment processed: $99
   - User becomes Premium
   - Unlimited everything

#### Example 2: User with Promo Code

1. **User signs up** → Free user

2. **User enters promo code** "WELCOME7DAYS"
   - No payment required
   - 7-day trial activates

3. **User gets full premium** for 7 days
   - Unlimited scans
   - All features unlocked

4. **After 7 days** → Reverts to free user
   - Can upgrade to paid anytime

#### Example 3: Direct Purchase (No Trial)

1. **User signs up** → Free user

2. **User clicks "Upgrade"** → Plan selection
   - Chooses monthly plan ($8.99/month)

3. **User clicks "Pay"** → Payment processing
   - iOS/Android handles payment
   - On success: Premium activated immediately

4. **User is now Premium**
   - No trial period
   - Unlimited access
   - Recurring billing every month

---

## In-App Purchase Flow (iOS)

### Setup Required (Already Done):
1. ✅ App Store Connect: Subscriptions created
   - Monthly: `com.glowcheck.monthly.premium` ($8.99/month)
   - Yearly: `com.glowcheck.yearly1.premium` ($99/year)
2. ✅ RevenueCat: Configured with API keys
3. ✅ App: Payment service implemented

### How Payments Work:

**When user presses "Pay" button:**
```typescript
1. App calls processInAppPurchase('monthly' or 'yearly')
2. RevenueCat initializes
3. RevenueCat shows iOS payment sheet
4. User authenticates (Face ID/Touch ID/Password)
5. Payment processed by Apple
6. RevenueCat receives confirmation
7. App receives success callback
8. App immediately:
   - Sets isPremium = true
   - Clears trial flags
   - Saves purchase tokens
   - Syncs with Supabase backend
9. User sees "Premium activated!" message
10. App redirects to home screen
```

**What happens after:**
- iOS handles recurring billing automatically
- RevenueCat tracks subscription status
- App syncs status on every launch
- User can cancel in iOS Settings → Subscriptions

---

## Key Files

### Context Providers:
- `contexts/FreemiumContext.tsx` - Scan tracking, user types
- `contexts/SubscriptionContext.tsx` - Premium status, trials, purchases
- `contexts/AuthContext.tsx` - User authentication

### Payment System:
- `lib/payments.ts` - RevenueCat integration, purchase handling
- `app/start-trial.tsx` - Trial start screen
- `app/subscribe.tsx` - Direct purchase screen
- `app/redeem-promo.tsx` - Promo code redemption

### Database:
- `freemium-tracking-fix.sql` - Latest tracking fixes
- `COMPLETE_FREEMIUM_SETUP.sql` - Full database schema

---

## Testing Checklist

### Free User Flow:
- [ ] Can do 1 Glow Analysis scan
- [ ] Can do 1 Style Check scan
- [ ] Scans are tracked separately
- [ ] After using free scans, shown upgrade modal
- [ ] Can view plan selection
- [ ] Glow Coach details are blurred

### Trial Flow (with Payment):
- [ ] Can start 3-day trial with payment method
- [ ] Gets 2 Glow scans per day
- [ ] Gets 2 Style scans per day
- [ ] Scans reset at midnight
- [ ] All premium features unlocked
- [ ] After 3 days, auto-charges and becomes Premium

### Premium Flow:
- [ ] Direct purchase works (monthly/yearly)
- [ ] Payment processed correctly
- [ ] Premium activated immediately
- [ ] Unlimited scans work
- [ ] All features unlocked
- [ ] Restore purchases works

### Promo Code Flow:
- [ ] Valid code activates 7-day trial
- [ ] No payment required
- [ ] Full premium access
- [ ] After 7 days, reverts to free
- [ ] Can't redeem if already premium

---

## Common Issues & Solutions

### Issue: Scans not tracking separately
**Solution:** Run `freemium-tracking-fix.sql` to create `increment_usage_tracking` function

### Issue: Payment not activating premium
**Solution:** Check `processInAppPurchase` properly sets `isPremium = true` and clears trial flags

### Issue: Trial not unlocking features
**Solution:** Verify `hasStartedTrial = true` and `trialEndsAt` is in future

### Issue: Promo code not working
**Solution:** Check promo codes are defined in `PROMO_CODES` object in `app/redeem-promo.tsx`

---

## API Costs at Scale (100k+ Users)

### RevenueCat:
- **Free tier:** Up to 10k tracked users
- **Growth tier:** $250/month for unlimited users
- **Recommendation:** Start with free tier, upgrade when needed

### Supabase:
- **Free tier:** 500MB database, 5GB bandwidth
- **Pro tier:** $25/month per project (8GB database, 250GB bandwidth)
- **Recommendation:** Pro tier for 100k users

### AI Analysis (@rork/toolkit-sdk):
- **Cost:** ~$0.002-0.01 per analysis
- **At scale:** With 2 scans/user/month: $200-1000/month for 100k users
- **Recommendation:** 
  - Monitor usage carefully
  - Consider rate limiting
  - Optimize AI prompts to reduce token usage

### Total Estimated Monthly Cost for 100k Users:
- RevenueCat: $250
- Supabase: $25-100 (depending on usage)
- AI Analysis: $200-1000
- **Total: $475-1,350/month**

---

## Next Steps

1. **Run the migration:**
   ```bash
   # In Supabase SQL Editor
   # Execute freemium-tracking-fix.sql
   ```

2. **Test all flows:**
   - Free user flow
   - Trial flow
   - Premium purchase
   - Promo code redemption

3. **Monitor:**
   - Check scan tracking in `usage_tracking` table
   - Verify payments in RevenueCat dashboard
   - Monitor subscription status in Supabase

4. **Production setup:**
   - Replace test promo codes with production codes
   - Set up RevenueCat webhooks for subscription events
   - Configure push notifications for trial expiry reminders
