# 🚀 Pre-Launch Checklist for GlowCheck App

## ✅ Database Setup
- [x] All tables created
- [x] Row Level Security enabled
- [x] Functions and triggers working
- [ ] **CRITICAL: Run `FIX_CONVERSION_ANALYTICS_SECURITY.sql` to secure the conversion_analytics view**

## 🔐 Security Issues (MUST FIX BEFORE LAUNCH)

### **CRITICAL: API Keys Exposed**
Your `.env` file contains real API keys that are now compromised. You MUST:

1. **Rotate ALL API Keys Immediately:**
   - [ ] Google Vision API Key (currently exposed)
   - [ ] OpenAI API Key (currently exposed)
   - [ ] Supabase Anon Key (currently exposed)
   - [ ] RevenueCat API Keys (currently exposed)

2. **Never commit `.env` to version control:**
   - [ ] Add `.env` to `.gitignore` (should already be there)
   - [ ] Remove `.env` from git history if committed
   - [ ] Use environment variables in production

3. **Secure Your Supabase:**
   - [ ] Go to Supabase Dashboard → Settings → API
   - [ ] Reset your anon key
   - [ ] Update your `.env` file with new key
   - [ ] Enable RLS on all tables (already done ✅)

## 🎯 Trial & Subscription Logic

### **Inconsistency Found:**
Your code has conflicting trial periods:
- App code (`SubscriptionContext.tsx` line 93): **7 days**
- Previous messages: **3 days** and **1 day**

**Decision needed:**
- [ ] Choose final trial period: ___ days
- [ ] Update `SubscriptionContext.tsx` line 93
- [ ] Update database default in `trial_tracking` table
- [ ] Update all user-facing messaging

### Current Trial Logic:
```typescript
// contexts/SubscriptionContext.tsx line 93
const startLocalTrial = useCallback(async (days: number = 7) => {
  // Default is 7 days - is this correct?
```

## 📱 App Functionality Tests

### Authentication
- [ ] Sign up works
- [ ] Sign in works
- [ ] Password reset works
- [ ] Session persistence works

### Glow Analysis
- [ ] Camera permission works
- [ ] Photo upload works
- [ ] Face detection works
- [ ] Analysis results display correctly
- [ ] Trial limits enforced correctly

### Style Analysis
- [ ] Occasion selection works
- [ ] Photo upload works
- [ ] Analysis results display correctly
- [ ] Trial limits enforced correctly

### Subscription Flow
- [ ] Trial start flow works
- [ ] Payment screen displays correctly
- [ ] In-app purchases work (iOS)
- [ ] In-app purchases work (Android)
- [ ] Subscription status syncs with backend
- [ ] Premium features unlock after purchase

### Community Features
- [ ] Create circle works
- [ ] Join circle works
- [ ] Post to circle works
- [ ] Comment on posts works
- [ ] View circle feed works

## 🔧 Configuration Verification

### Environment Variables
- [ ] All required env vars are set
- [ ] Supabase URL is correct
- [ ] Supabase anon key is correct (and NEW after rotation)
- [ ] RevenueCat keys are correct
- [ ] Product IDs match App Store Connect / Google Play

### App Store Configuration
- [ ] Bundle ID matches: `com.glowcheck01.app`
- [ ] Team ID is correct: `2V4DJQD8G3`
- [ ] In-app purchase products created in App Store Connect
- [ ] RevenueCat configured with App Store Connect

### Google Play Configuration
- [ ] Package name matches: `com.glowcheck01.app`
- [ ] In-app purchase products created in Google Play Console
- [ ] RevenueCat configured with Google Play

## 📊 Analytics & Monitoring

- [ ] RevenueCat webhook configured
- [ ] Supabase functions logging properly
- [ ] Error tracking set up (Sentry, etc.)
- [ ] Analytics tracking set up (if needed)

## 🎨 User Experience

### Onboarding
- [ ] First-time user experience is smooth
- [ ] Trial explanation is clear
- [ ] Payment requirement is clear
- [ ] Value proposition is compelling

### Paywall Strategy
Your current strategy:
- **Free tier:** 1 scan per week
- **Trial:** Full access for X days (DECIDE: 1, 3, or 7 days?)
- **Premium:** Unlimited scans + all features

- [ ] Paywall messaging is clear
- [ ] Trial CTA is compelling
- [ ] Upgrade prompts are not annoying
- [ ] Premium benefits are clear

## 🐛 Known Issues to Fix

1. **Trial Period Inconsistency** (see above)
2. **API Keys Exposed** (CRITICAL - see above)
3. **Conversion Analytics Security** (run SQL fix)

## 📝 Legal & Compliance

- [ ] Privacy Policy is complete and accessible
- [ ] Terms of Service are complete and accessible
- [ ] App Store privacy questions answered correctly
- [ ] GDPR compliance (if applicable)
- [ ] COPPA compliance (if applicable)

## 🚀 Launch Readiness

### Before Submitting to App Stores:
- [ ] All items above are checked
- [ ] App tested on real devices (iOS & Android)
- [ ] Screenshots prepared
- [ ] App description written
- [ ] Keywords researched
- [ ] App icon finalized
- [ ] Splash screen finalized

### After Launch:
- [ ] Monitor crash reports
- [ ] Monitor subscription events in RevenueCat
- [ ] Monitor database for errors
- [ ] Respond to user feedback
- [ ] Track conversion rates

---

## 🔴 CRITICAL ACTIONS REQUIRED NOW:

1. **Run this SQL in Supabase:**
   ```sql
   -- See FIX_CONVERSION_ANALYTICS_SECURITY.sql
   ```

2. **Rotate ALL API Keys:**
   - Google Vision API
   - OpenAI API
   - Supabase Keys
   - RevenueCat Keys

3. **Decide on Trial Period:**
   - Update code to match
   - Update database to match
   - Update user messaging to match

4. **Test the Complete Flow:**
   - Sign up → Trial → Scan → Results → Paywall → Purchase → Premium Access

---

## ✅ You're Ready to Launch When:
- [ ] All CRITICAL items are fixed
- [ ] All security issues are resolved
- [ ] Trial logic is consistent
- [ ] App works end-to-end on real devices
- [ ] You've tested the purchase flow with sandbox accounts

---

**Current Status:** ⚠️ **NOT READY** - Fix critical security issues first!

**Estimated Time to Launch Ready:** 2-4 hours (if you fix issues now)
