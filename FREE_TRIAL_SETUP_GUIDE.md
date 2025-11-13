# 7-Day Free Trial with Auto-Pay Setup Guide

## Overview
This guide explains how to configure 7-day free trials that require payment method upfront but don't charge until day 8.

## Current Configuration Status

### ✅ What's Already Set Up
1. RevenueCat is configured with proper API keys
2. Both iOS and Android subscriptions are created
3. react-native-purchases (v9.5.4) is installed
4. App logic handles trial states correctly

### ⚠️ What Needs Configuration

## Google Play Console Setup

### Step 1: Add Free Trial to Base Plans

1. **Go to Google Play Console** → Your App → Monetize with Play → Subscriptions
2. **For Monthly Subscription** (com.glowcheck.app.premium.monthly.p1m):
   - Click on the subscription
   - Go to "Base plans and offers" tab
   - Click on "monthly-auto" base plan
   - Click "Edit base plan"
   - Scroll to "Free trial"
   - Enable "Free trial"
   - Set duration to **7 days**
   - Set "Eligibility" to "New subscribers only" or "All subscribers"
   - Click "Save"

3. **For Yearly Subscription** (com.glowcheck.app.premium.yearly.p1y):
   - Click on the subscription
   - Go to "Base plans and offers" tab
   - Click on "yearly-auto" base plan
   - Click "Edit base plan"
   - Scroll to "Free trial"
   - Enable "Free trial"
   - Set duration to **7 days**
   - Set "Eligibility" to "New subscribers only" or "All subscribers"
   - Click "Save"

4. **Activate the changes:**
   - Click "Review and publish" for each subscription
   - Submit for review (usually approved within 24 hours)

### Important Notes for Google Play:
- Free trials in Google Play **require a payment method** to be added upfront
- User is **not charged** during the trial period
- On day 8, the user is **automatically charged** unless they cancel
- Users can cancel anytime during the trial without being charged

## App Store Connect Setup

### Step 1: Add Introductory Offers

1. **Go to App Store Connect** → My Apps → Your App → Subscriptions
2. **For Monthly Subscription** (com.glowcheck.monthly.premium):
   - Click on the subscription
   - Scroll to "Subscription Prices"
   - Click on your subscription price
   - Under "Introductory Offers", click "Add Introductory Offer"
   - Select "Free Trial"
   - Set duration to **7 days**
   - Click "Save"

3. **For Yearly Subscription** (com.glowcheck.yearly1.premium):
   - Click on the subscription
   - Scroll to "Subscription Prices"
   - Click on your subscription price
   - Under "Introductory Offers", click "Add Introductory Offer"
   - Select "Free Trial"
   - Set duration to **7 days**
   - Click "Save"

### Important Notes for App Store:
- Introductory offers require user to add payment method
- User is **not charged** during the free trial
- On day 8, the subscription **automatically renews** and charges the user
- Users can cancel anytime via Settings → Apple ID → Subscriptions

## RevenueCat Configuration

### Step 1: Verify Product Mappings

Your products are already set up correctly in RevenueCat:
- ✅ **App Store Products** mapped to offerings
- ✅ **Play Store Products** mapped to offerings
- ✅ **Entitlement "Premium Access"** configured

### Step 2: Configure Free Trial in RevenueCat

1. **Go to RevenueCat Dashboard** → Your Project → Offerings
2. **Create or Edit Offering:**
   - Add packages for both monthly and yearly
   - The free trial configuration comes from App Store/Play Store
   - RevenueCat automatically recognizes the introductory offer

## How It Works

### User Flow:

1. **User taps "Start 7-Day Free Trial"**
   - App calls `processInAppPurchase(selectedPlan)`
   - This triggers RevenueCat purchase flow

2. **Payment Method Collection:**
   - **iOS**: Apple payment sheet appears asking for Apple ID password or Face ID/Touch ID
   - **Android**: Google Play payment dialog appears
   - User confirms subscription with payment method

3. **Trial Activation:**
   - Payment method is authorized but **not charged**
   - RevenueCat confirms the entitlement
   - App receives confirmation and activates trial locally
   - User gets full access for 7 days

4. **Day 8 - Auto-Renewal:**
   - If user **doesn't cancel**: They are automatically charged
   - If user **cancels**: No charge, access ends after trial

### Testing:

#### iOS Sandbox Testing:
1. Use sandbox Apple ID (create in App Store Connect → Users and Access → Sandbox Testers)
2. Sign out of real Apple ID in Settings
3. Test purchases complete instantly in sandbox
4. Sandbox trials are **accelerated** (7 days = ~1 hour for testing)

#### Android Testing:
1. Add test accounts in Google Play Console → Setup → License testing
2. Use test account on device
3. Purchases complete instantly with test accounts
4. Test subscriptions renew faster for testing purposes

## Verifying Configuration

### Check Google Play Console:
```
✅ Subscription has "Free trial: 7 days" badge
✅ Base plan shows "Free trial" under eligibility
✅ Status is "Active" (green)
```

### Check App Store Connect:
```
✅ Subscription shows "Introductory Offer: 7 days free"
✅ Status is "Ready for Sale"
```

### Check RevenueCat Dashboard:
```
✅ Products show correct IDs
✅ Entitlement "Premium Access" is attached to products
✅ Offerings include both packages
```

## Common Issues

### Issue 1: "Free trial not showing in app"
**Solution:** 
- Ensure store configuration is complete and published
- Clear app cache and reinstall
- Check RevenueCat logs for product retrieval

### Issue 2: "User charged immediately"
**Solution:**
- Verify free trial is enabled in store console
- Check that user hasn't used trial before (if set to "new subscribers only")
- Confirm product ID matches exactly

### Issue 3: "Payment method required error"
**Solution:**
- This is expected behavior for free trials
- User MUST add payment method to start trial
- Educate users they won't be charged for 7 days

## Important Legal & UX Requirements

### Required Disclosures:
Your app already includes these in the UI:
- ✅ "Free for 7 days, then $X/period"
- ✅ "Cancel anytime"
- ✅ "No charge for 7 days"
- ✅ Legal text about auto-renewal

### App Store Review Guidelines:
- ✅ Clear pricing display
- ✅ Explicit auto-renewal disclosure
- ✅ Easy cancellation instructions
- ✅ Terms of Service and Privacy Policy links

## Next Steps

1. **Configure free trials in Google Play Console** (see Step 1 above)
2. **Configure introductory offers in App Store Connect** (see Step 1 above)
3. **Wait for store approval** (usually 24-48 hours)
4. **Test with sandbox/test accounts**
5. **Monitor RevenueCat dashboard** for subscription events

## Support

If you encounter issues:
- **RevenueCat Support:** https://www.revenuecat.com/support
- **Google Play Support:** https://support.google.com/googleplay/android-developer
- **App Store Support:** https://developer.apple.com/contact/

## Summary

Your app code is **already configured correctly** to handle 7-day free trials with payment upfront. You just need to:

1. ✅ Enable 7-day free trial in Google Play Console for both subscriptions
2. ✅ Add 7-day introductory offer in App Store Connect for both subscriptions
3. ✅ Test with sandbox accounts
4. ✅ Submit for review

Once configured, users will:
- See "Start 7-Day Free Trial" button
- Add payment method when subscribing
- Get full access immediately
- Not be charged until day 8
- Be able to cancel anytime before day 8 without charge
