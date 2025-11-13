# ✅ 7-Day Free Trial with Auto-Pay - Quick Setup Checklist

## What You Need to Do

Your app code is **ready**. You just need to configure the trial offers in the app stores.

---

## 🟢 Google Play Console (Android)

### Monthly Subscription Setup

1. Open [Google Play Console](https://play.google.com/console/)
2. Go to: **Your App** → **Monetize with Play** → **Subscriptions**
3. Click on: **Monthly subscription** (com.glowcheck.app.premium.monthly.p1m)
4. Go to: **Base plans and offers** tab
5. Click: **monthly-auto** base plan
6. Click: **"Edit base plan"** button
7. Scroll to **"Free trial"** section
8. Toggle: **Enable free trial** ✅
9. Set duration: **7 days**
10. Set eligibility: **New subscribers only** (or your preference)
11. Click: **"Save"**
12. Click: **"Review and publish"**

### Yearly Subscription Setup

1. Click on: **Yearly Subscription** (com.glowcheck.app.premium.yearly.p1y)
2. Go to: **Base plans and offers** tab
3. Click: **yearly-auto** base plan
4. Click: **"Edit base plan"** button
5. Scroll to **"Free trial"** section
6. Toggle: **Enable free trial** ✅
7. Set duration: **7 days**
8. Set eligibility: **New subscribers only** (or your preference)
9. Click: **"Save"**
10. Click: **"Review and publish"**

✅ **Result:** Both subscriptions now show "Free trial: 7 days"

---

## 🍎 App Store Connect (iOS)

### Monthly Subscription Setup

1. Open [App Store Connect](https://appstoreconnect.apple.com/)
2. Go to: **My Apps** → **Glow Check** → **Subscriptions**
3. Click on: **monthly Glow Premium** (com.glowcheck.monthly.premium)
4. Scroll to: **Subscription Prices** section
5. Click on your price tier
6. Under **"Introductory Offers"**, click: **"Add Introductory Offer"**
7. Select type: **"Free Trial"** 
8. Set duration: **7 days**
9. Click: **"Save"**

### Yearly Subscription Setup

1. Click on: **Yearly Glow Premium** (com.glowcheck.yearly1.premium)
2. Scroll to: **Subscription Prices** section
3. Click on your price tier
4. Under **"Introductory Offers"**, click: **"Add Introductory Offer"**
5. Select type: **"Free Trial"**
6. Set duration: **7 days**
7. Click: **"Save"**

✅ **Result:** Both subscriptions now show "Introductory Offer: 7 days free"

---

## 🧪 Testing

### iOS Sandbox Testing
1. Create sandbox tester in App Store Connect → Users and Access → Sandbox Testers
2. Sign out of real Apple ID on test device
3. Launch app and start trial
4. Sign in with sandbox Apple ID when prompted
5. Verify: Trial activates immediately, no charge

**Note:** Sandbox trials are accelerated (7 days ≈ 1-2 hours)

### Android Testing
1. Add test account in Google Play Console → Setup → License testing
2. Install app with test account signed in
3. Launch app and start trial
4. Verify: Trial activates immediately, no charge

**Note:** Test subscriptions auto-renew faster for testing

---

## 📱 How It Works for Users

### When user taps "Start 7-Day Free Trial":

1. **Payment Authorization** (NOT charge)
   - iOS: Apple payment sheet appears
   - Android: Google Play payment dialog appears
   - User confirms with Face ID/Touch ID or password
   
2. **Immediate Access**
   - User gets full premium access
   - No charge applied
   - Trial countdown starts

3. **Day 8 - Auto-Renewal**
   - If NOT cancelled: User is charged automatically
   - If cancelled: No charge, access ends

### User Can Cancel Anytime:
- **iOS:** Settings → Apple ID → Subscriptions → Glow Check → Cancel
- **Android:** Play Store → Menu → Subscriptions → Glow Check → Cancel

---

## ✅ Verification

### After Configuring:

#### Google Play Console:
- [ ] Monthly subscription shows "Free trial: 7 days" badge
- [ ] Yearly subscription shows "Free trial: 7 days" badge
- [ ] Both subscriptions status: "Active" (green)

#### App Store Connect:
- [ ] Monthly subscription shows "Introductory Offer: 7 days free"
- [ ] Yearly subscription shows "Introductory Offer: 7 days free"
- [ ] Both subscriptions status: "Ready for Sale"

#### RevenueCat Dashboard:
- [ ] Products sync correctly (may take 1-2 hours)
- [ ] Offerings show both packages
- [ ] Test purchase completes successfully

---

## 📞 What Users Will See

### In Your App:
✅ "Start 7-Day Free Trial" button
✅ "Free for 7 days, then $X/period"
✅ "Cancel anytime"
✅ "No charge for 7 days"
✅ Clear explanation of how trial works

### During Purchase:
✅ iOS: "Start Free Trial" (not "Subscribe")
✅ Android: "Start free trial" (not "Subscribe")
✅ Clear indication of when charge will occur

### After Purchase:
✅ Immediate access to all features
✅ Confirmation: "Welcome to Your 7-Day Free Trial!"
✅ Clear statement: "You'll be charged on day 8 unless you cancel"

---

## 🎉 You're Done!

Once you complete the store configurations:

1. ✅ Users can add payment upfront
2. ✅ No charge for 7 days
3. ✅ Full access during trial
4. ✅ Auto-charge on day 8
5. ✅ Cancel anytime before day 8 = no charge

---

## 💡 Pro Tips

1. **Wait 1-2 hours** after store changes for RevenueCat to sync
2. **Test thoroughly** with sandbox accounts before going live
3. **Monitor RevenueCat dashboard** for subscription events
4. **Store approval** usually takes 24-48 hours

---

## 📚 Need Help?

See detailed guide: `FREE_TRIAL_SETUP_GUIDE.md`

- RevenueCat Support: https://www.revenuecat.com/support
- Google Play Help: https://support.google.com/googleplay/android-developer
- Apple Developer Support: https://developer.apple.com/contact/
