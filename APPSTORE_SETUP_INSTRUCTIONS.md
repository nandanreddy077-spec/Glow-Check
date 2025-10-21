# App Store In-App Purchase Setup Instructions

## ✅ What's Already Done in App Store Connect

Based on your screenshots, your App Store Connect is already configured correctly:

### Subscription Products (Approved ✅)
1. **Yearly Glow Premium** 
   - Product ID: `com.glowcheck.yearly1.premium`
   - Duration: 1 year
   - Price: $99/year
   - Status: ✅ Approved

2. **Monthly Glow Premium**
   - Product ID: `com.glowcheck.monthly.premium`
   - Duration: 1 month  
   - Price: $8.99/month
   - Status: ✅ Approved

### Introductory Offer (Approved ✅)
- **3-Day Free Trial**
  - Active from: Oct 16, 2025 to Jan 1, 2026
  - Available in: 175 Countries/Regions
  - Status: ✅ Approved

### Subscription Group
- **Group ID**: 21788174
- **Display Name**: Glow Check Premium Access
- **Localization**: English (U.S.) ✅

---

## 🔧 Code Changes Made

### 1. Updated Product IDs (`lib/payments.ts`)
The product IDs now match your App Store Connect configuration:

```typescript
export const PRODUCT_IDS = {
  // iOS App Store IDs (from App Store Connect)
  MONTHLY: Platform.OS === 'ios' 
    ? 'com.glowcheck.monthly.premium'      // ✅ Matches App Store
    : 'com.glowcheck01.app.premium.monthly', // Android
  YEARLY: Platform.OS === 'ios'
    ? 'com.glowcheck.yearly1.premium'       // ✅ Matches App Store
    : 'com.glowcheck01.app.premium.annual',  // Android
} as const;
```

### 2. Updated .env Configuration
Added proper product IDs for both platforms:

```env
# iOS App Store Products (from App Store Connect):
EXPO_PUBLIC_IAP_MONTHLY_PRODUCT_ID_IOS=com.glowcheck.monthly.premium
EXPO_PUBLIC_IAP_YEARLY_PRODUCT_ID_IOS=com.glowcheck.yearly1.premium

# Android Google Play Products:
EXPO_PUBLIC_IAP_MONTHLY_PRODUCT_ID_ANDROID=com.glowcheck01.app.premium.monthly
EXPO_PUBLIC_IAP_YEARLY_PRODUCT_ID_ANDROID=com.glowcheck01.app.premium.annual
```

### 3. Updated Subscription Flow
- **Removed standalone free trial** without payment
- **Trial now requires selecting a plan** (monthly or yearly)
- Trial is handled by **App Store's introductory offer** (3 days free)
- Updated UI copy to reflect: "Start 3-Day Free Trial" → then charge after 3 days

---

## 📱 How the New Flow Works

### User Journey:
1. **User opens app** → Sees free scan option (1 scan)
2. **After first scan** → Prompted to unlock more features
3. **User clicks "Start Your Glow Journey"** → Taken to `/subscribe` screen
4. **User selects a plan** (Monthly $8.99 or Yearly $99)
5. **User clicks "Start 3-Day Free Trial"** → App Store purchase sheet opens
6. **App Store shows**: "Free for 3 days, then $8.99/month" (or $99/year)
7. **User confirms with Face ID/Touch ID** → Subscription begins
8. **3-day trial starts** with full premium access
9. **After 3 days** → App Store automatically charges the selected plan
10. **User can cancel** anytime before day 3 ends → No charge

### Key Points:
- ✅ 3-day trial is **automatic** via App Store (no manual trial tracking needed)
- ✅ User **must** add payment method to start trial
- ✅ App Store handles trial expiration and billing automatically
- ✅ User can cancel in Settings → Apple ID → Subscriptions

---

## 🗄️ Supabase Database Changes Needed

Your current database setup (from previous messages) should work, but you need to run this SQL:

```sql
-- The database setup from your COMPLETE_FREEMIUM_SETUP.sql should already be in place
-- This includes:
-- ✅ trial_tracking table
-- ✅ subscriptions table  
-- ✅ profiles table with subscription fields
-- ✅ handle_revenuecat_webhook() function

-- Verify these tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('trial_tracking', 'subscriptions', 'profiles', 'revenuecat_events');

-- If any are missing, run COMPLETE_FREEMIUM_SETUP.sql from your project root
```

---

## 🔗 RevenueCat Integration

### Current Status:
Your code is configured for RevenueCat but currently running in **fallback mode** (redirects to App Store).

### For Production (Optional but Recommended):
To enable full RevenueCat integration for receipt validation and webhook handling:

1. **Add RevenueCat to your app** (in production build with EAS):
   ```bash
   npx expo install react-native-purchases
   ```

2. **Configure RevenueCat Offerings**:
   - Log into RevenueCat dashboard
   - Create an offering named "default"
   - Add both products:
     - `com.glowcheck.monthly.premium`
     - `com.glowcheck.yearly1.premium`

3. **Set up webhook** (for Supabase sync):
   - RevenueCat Dashboard → Integrations → Webhooks
   - Add webhook URL: `https://YOUR_SUPABASE_URL/functions/v1/revenuecat-webhook`
   - Authorization: Your Supabase service role key

### Without RevenueCat (Current Setup):
- App redirects to App Store for subscriptions ✅
- Purchases work but no automatic backend sync
- User must restore purchases manually

---

## 🚀 Testing Your Setup

### Test in Expo Go (Development):
1. Run `npx expo start`
2. Scan QR code on device
3. Navigate to subscription screen
4. Click "Start 3-Day Free Trial"
5. **Expected**: App redirects to App Store search (since Expo Go doesn't support IAP)

### Test in TestFlight (Production):
1. Build with EAS: `eas build --platform ios --profile preview`
2. Submit to TestFlight
3. Install TestFlight build
4. Navigate to subscription screen  
5. Click "Start 3-Day Free Trial"
6. **Expected**: App Store purchase sheet opens with 3-day trial offer
7. Complete purchase with Sandbox Apple ID
8. **Expected**: Subscription activates, trial starts

### Important Testing Notes:
- Use **Sandbox Apple ID** for testing (create in App Store Connect → Users and Access → Sandbox Testers)
- Sandbox trials work instantly (no 3-day wait)
- Clear sandbox account between tests: Settings → App Store → Sandbox Account → Reset

---

## ✅ What You Need to Do Next

### 1. In Supabase:
Run the database setup if not already done (see section above)

### 2. For Testing:
- Create Sandbox Apple ID in App Store Connect
- Build app for TestFlight using EAS Build
- Test subscription flow with Sandbox account

### 3. For Production (Optional):
- Install `react-native-purchases` in production build
- Configure RevenueCat offerings
- Set up webhook for Supabase integration

### 4. Nothing to Change in App Store Connect:
Your setup is already perfect! ✅

---

## 📞 Need Help?

If you encounter issues:

1. **"Product not available"**: Check product IDs match exactly
2. **"Purchase cancelled"**: Normal user cancellation
3. **"No products found"**: Verify App Store Connect agreements signed
4. **Store redirect instead of purchase sheet**: Expected in Expo Go, needs TestFlight/production build

---

## 🎉 Summary

Your App Store Connect is configured correctly with:
- ✅ 2 subscription products (monthly & yearly)
- ✅ 3-day introductory offer active
- ✅ Products approved and ready

The code is now updated to:
- ✅ Use correct product IDs
- ✅ Require plan selection for trial  
- ✅ Let App Store handle the 3-day trial automatically
- ✅ Support both iOS and Android subscriptions

You're ready to build and test! 🚀
