# 🔄 In-App Purchase Flow Diagram

## Complete Payment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                     │
└─────────────────────────────────────────────────────────────────────────┘

User Opens App
      │
      ▼
┌─────────────────┐
│  Free Features  │ → 1 scan per week
│   (No Payment)  │ → Limited access
└────────┬────────┘
         │
         │ User wants more features
         ▼
┌─────────────────┐
│   Start Trial   │
│  (start-trial.  │
│     tsx)        │
└────────┬────────┘
         │
         │ Taps "Start 3-Day Free Trial"
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PAYMENT SERVICE (lib/payments.ts)                     │
│                                                                           │
│  1. Initialize RevenueCat                                                │
│     ├─ Platform.OS === 'ios'                                             │
│     │   └─ Use: appl_UpDZroTEjwQSDDRJdqLgYihNxsh                        │
│     └─ Platform.OS === 'android'                                         │
│         └─ Use: goog_xCXiGuMlJXxLNPQUlodNDLnAAYZ                        │
│                                                                           │
│  2. Get Offerings                                                        │
│     └─ Fetch: offerings.current                                          │
│                                                                           │
│  3. Find Product Package                                                 │
│     ├─ Monthly: com.glowcheck.monthly.premium                           │
│     └─ Yearly: com.glowcheck.yearly1.premium                            │
│                                                                           │
│  4. Purchase Package                                                     │
│     └─ Purchases.purchasePackage(selectedPackage)                       │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         REVENUECAT SDK                                   │
│                                                                           │
│  Communicates with:                                                      │
│  ├─ Apple App Store (for iOS)                                           │
│  │   └─ Product IDs from App Store Connect                              │
│  └─ Google Play Store (for Android)                                     │
│                                                                           │
│  Validates purchase and returns customerInfo with:                       │
│  ├─ entitlements.active['premium']                                      │
│  ├─ transaction.transactionIdentifier                                   │
│  └─ subscription details                                                │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION CONTEXT                                  │
│               (contexts/SubscriptionContext.tsx)                         │
│                                                                           │
│  Purchase Successful:                                                    │
│  ├─ setPremium(true, type)                                              │
│  ├─ startLocalTrial(3)  → 3 day trial                                  │
│  ├─ setSubscriptionData({ hasAddedPayment: true })                     │
│  └─ Store in AsyncStorage                                               │
│                                                                           │
│  Sync with Backend (Supabase):                                          │
│  └─ Update user_profiles table                                          │
│      ├─ subscription_status = 'premium'                                 │
│      ├─ subscription_product_id                                         │
│      └─ revenuecat_user_id                                              │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Premium Access │ ✅
│   Unlocked!     │
└─────────────────┘
     │
     ▼
User Enjoys:
├─ Unlimited scans
├─ AI Glow Analysis
├─ Style recommendations
├─ Beauty coach
├─ Progress tracking
└─ All premium features


═══════════════════════════════════════════════════════════════════════════

## System Architecture

┌─────────────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                                       │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    SUBSCRIPTION SCREENS                           │  │
│  │                                                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │  │
│  │  │ start-trial  │  │  subscribe   │  │    Various   │          │  │
│  │  │    .tsx      │  │    .tsx      │  │   Paywalls   │          │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │  │
│  │         │                 │                  │                   │  │
│  │         └─────────────────┴──────────────────┘                   │  │
│  │                           │                                       │  │
│  └───────────────────────────┼───────────────────────────────────────┘  │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │            SubscriptionContext (State Management)                 │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │  State:                                                      │ │  │
│  │  │  ├─ isPremium: boolean                                      │ │  │
│  │  │  ├─ trialEndsAt: string                                     │ │  │
│  │  │  ├─ subscriptionType: 'monthly' | 'yearly'                 │ │  │
│  │  │  └─ scanCount, weeklyScansUsed, etc.                       │ │  │
│  │  │                                                              │ │  │
│  │  │  Actions:                                                    │ │  │
│  │  │  ├─ processInAppPurchase(type)                             │ │  │
│  │  │  ├─ restorePurchases()                                     │ │  │
│  │  │  ├─ startLocalTrial(days)                                  │ │  │
│  │  │  └─ setPremium(value, type)                                │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              Payment Service (lib/payments.ts)                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │  Methods:                                                    │ │  │
│  │  │  ├─ initialize() → Configure RevenueCat                    │ │  │
│  │  │  ├─ getProducts() → Fetch available packages               │ │  │
│  │  │  ├─ purchaseProduct(productId) → Initiate purchase         │ │  │
│  │  │  ├─ restorePurchases() → Restore from platform             │ │  │
│  │  │  └─ getSubscriptionStatus() → Check active entitlements    │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │          react-native-purchases (RevenueCat SDK)                  │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │
                               │ API Calls
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         REVENUECAT CLOUD                                 │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     Configuration                                  │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │  API Keys:                                                   │ │  │
│  │  │  ├─ iOS: appl_UpDZroTEjwQSDDRJdqLgYihNxsh                 │ │  │
│  │  │  └─ Android: goog_xCXiGuMlJXxLNPQUlodNDLnAAYZ             │ │  │
│  │  │                                                              │ │  │
│  │  │  Entitlement: 'premium'                                     │ │  │
│  │  │  ├─ com.glowcheck.monthly.premium                          │ │  │
│  │  │  └─ com.glowcheck.yearly1.premium                          │ │  │
│  │  │                                                              │ │  │
│  │  │  Offering: 'default' (Current)                             │ │  │
│  │  │  ├─ Package 'monthly' → Monthly product                    │ │  │
│  │  │  └─ Package 'annual' → Yearly product                      │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │ Validates with
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    APPLE APP STORE CONNECT                               │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  App: Glow Check (com.glowcheck01.app)                            │  │
│  │                                                                     │  │
│  │  Subscription Group: Premium Access (21788174)                    │  │
│  │  ├─ Monthly: com.glowcheck.monthly.premium ($8.99/month)         │  │
│  │  │   └─ Free Trial: 3 days                                        │  │
│  │  └─ Yearly: com.glowcheck.yearly1.premium ($99/year)             │  │
│  │      └─ Free Trial: 3 days                                        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                               │
                               │ Webhooks (Optional)
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                                │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Table: user_profiles                                              │  │
│  │  ├─ id (UUID)                                                      │  │
│  │  ├─ revenuecat_user_id (TEXT)                                     │  │
│  │  ├─ subscription_status (TEXT) → 'free' | 'premium'              │  │
│  │  ├─ subscription_product_id (TEXT)                                │  │
│  │  └─ subscription_expires_at (TIMESTAMPTZ)                         │  │
│  │                                                                     │  │
│  │  Function: get_user_subscription_status(user_id)                  │  │
│  │  └─ Returns premium status and expiry                             │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════

## Purchase Flow Sequence

User Action: "Start 3-Day Free Trial"
                │
                ▼
        app/start-trial.tsx
        ├─ handleStartTrial()
        └─ calls → useSubscription().processInAppPurchase('yearly')
                │
                ▼
        contexts/SubscriptionContext.tsx
        ├─ processInAppPurchase(type)
        └─ calls → paymentService.purchaseProduct(productId)
                │
                ▼
        lib/payments.ts
        ├─ purchaseProduct(productId)
        ├─ await Purchases.getOfferings()
        ├─ find package by productId
        └─ await Purchases.purchasePackage(package)
                │
                ▼
        react-native-purchases SDK
        ├─ Shows Apple/Google payment sheet
        ├─ User authenticates & confirms
        └─ Returns purchaseResult
                │
                ▼
        RevenueCat Cloud
        ├─ Validates receipt with Apple/Google
        ├─ Checks entitlement configuration
        └─ Returns customerInfo with active entitlements
                │
                ▼
        lib/payments.ts (result processing)
        ├─ Check: customerInfo.entitlements.active['premium']
        ├─ If active → return success: true
        └─ Return transaction details
                │
                ▼
        contexts/SubscriptionContext.tsx
        ├─ result.success === true
        ├─ setPremium(true, type)
        ├─ startLocalTrial(3)
        ├─ Save to AsyncStorage
        └─ Sync with Supabase
                │
                ▼
        Supabase update
        └─ user_profiles.subscription_status = 'premium'
                │
                ▼
        User Sees Success ✅
        └─ Alert: "Welcome to Your Free Trial!"


═══════════════════════════════════════════════════════════════════════════

## Data Flow

┌─────────────────────────────────────────────────────────────────────────┐
│                           LOCAL STATE                                    │
│                        (AsyncStorage)                                    │
│                                                                           │
│  {                                                                        │
│    isPremium: true,                                                      │
│    trialStartedAt: "2025-01-15T10:00:00Z",                              │
│    trialEndsAt: "2025-01-18T10:00:00Z",                                 │
│    subscriptionType: "yearly",                                           │
│    subscriptionPrice: 99,                                                │
│    hasAddedPayment: true,                                                │
│    purchaseToken: "1000000123456789",                                    │
│    originalTransactionId: "1000000123456789"                             │
│  }                                                                        │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            │ Syncs with
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         REMOTE STATE                                     │
│                      (Supabase Database)                                 │
│                                                                           │
│  user_profiles row:                                                      │
│  {                                                                        │
│    id: "uuid-here",                                                      │
│    revenuecat_user_id: "uuid-here",                                     │
│    subscription_status: "premium",                                       │
│    subscription_product_id: "com.glowcheck.yearly1.premium",            │
│    subscription_expires_at: "2025-01-18T10:00:00Z"                      │
│  }                                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            │ Source of truth
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      REVENUECAT DATABASE                                 │
│                    (Single Source of Truth)                              │
│                                                                           │
│  Customer: user@example.com                                              │
│  ├─ App User ID: uuid-here                                              │
│  ├─ Active Entitlements:                                                │
│  │   └─ premium (expires: 2025-01-18T10:00:00Z)                        │
│  ├─ Subscriptions:                                                      │
│  │   └─ com.glowcheck.yearly1.premium                                  │
│  │       ├─ Status: active                                             │
│  │       ├─ Trial: true (ends 2025-01-18)                              │
│  │       ├─ Will renew: true                                           │
│  │       └─ Next billing: 2025-01-18                                   │
│  └─ Transactions:                                                       │
│      └─ 1000000123456789 (Apple receipt)                               │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════

## Error Handling

┌────────────────────────────────────────────────────────────────────────┐
│  Purchase Initiated                                                     │
│         │                                                               │
│         ▼                                                               │
│  ┌──────────────┐                                                      │
│  │ Try Purchase │                                                      │
│  └──────┬───────┘                                                      │
│         │                                                               │
│    ┌────┴────┬───────────┬──────────┬─────────────┐                  │
│    │         │           │          │             │                   │
│    ▼         ▼           ▼          ▼             ▼                   │
│ Success   Cancelled   Network    No Offering   Product                │
│           by User     Error      Available     Not Found              │
│    │         │           │          │             │                   │
│    ▼         ▼           ▼          ▼             ▼                   │
│ Activate  Show      Retry with    Wait 2hrs    Contact                │
│ Premium   Message   Timeout       for sync     Support                │
│           "OK"      3 attempts                                         │
│    │         │           │          │             │                   │
│    ▼         ▼           ▼          ▼             ▼                   │
│ ✅ Done   ℹ️ Done    ❌ Failed   ⏳ Wait       🆘 Help                │
└────────────────────────────────────────────────────────────────────────┘


All errors are logged and handled gracefully!
User always gets clear feedback about what happened.
