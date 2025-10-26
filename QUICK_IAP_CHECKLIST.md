# ⚡ Quick IAP Setup Checklist

## 1️⃣ App Configuration (5 mins)

### Update app.json:

Replace these sections in your `app.json`:

**iOS Bundle ID:**
```json
"ios": {
  "bundleIdentifier": "com.glowcheck01.app",
  "buildNumber": "2"
}
```

**Android Package:**
```json
"android": {
  "package": "com.glowcheck01.app",
  "versionCode": 2,
  "permissions": [
    "CAMERA",
    "READ_EXTERNAL_STORAGE",
    "WRITE_EXTERNAL_STORAGE",
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.SCHEDULE_EXACT_ALARM",
    "ACCESS_COARSE_LOCATION",
    "ACCESS_FINE_LOCATION",
    "FOREGROUND_SERVICE",
    "FOREGROUND_SERVICE_LOCATION",
    "ACCESS_BACKGROUND_LOCATION",
    "BILLING"
  ]
}
```

**Replace Stripe plugin with RevenueCat:**
```json
"plugins": [
  // Remove @stripe/stripe-react-native plugin
  // Add this instead:
  [
    "react-native-purchases",
    {
      "apiKey": "appl_UpDZroTEjwQSDDRJdqLgYihNxsh"
    }
  ]
]
```

---

## 2️⃣ RevenueCat Dashboard (10 mins)

### A. Create Entitlement:

1. Go to: https://app.revenuecat.com/
2. Click **"Entitlements"** in left sidebar
3. Click **"+ New Entitlement"**
4. Enter:
   - Entitlement ID: `premium`
   - Display Name: `Premium Access`
5. Click **"Create"**

### B. Attach Products:

1. Click on the `premium` entitlement you just created
2. Click **"Attach Products"**
3. Select BOTH:
   - ☑️ `com.glowcheck.monthly.premium`
   - ☑️ `com.glowcheck.yearly1.premium`
4. Click **"Save"**

### C. Create Offering:

1. Click **"Offerings"** in left sidebar
2. Click **"+ New Offering"**
3. Enter:
   - Identifier: `default`
   - Description: `Default Premium Offering`
4. Click **"Create"**
5. Add Packages:
   - **Package 1**:
     - Click "+ Add Package"
     - Identifier: `monthly`
     - Select Product: `com.glowcheck.monthly.premium`
     - Package Type: `MONTHLY`
   - **Package 2**:
     - Click "+ Add Package"  
     - Identifier: `annual`
     - Select Product: `com.glowcheck.yearly1.premium`
     - Package Type: `ANNUAL`
6. Click **"Make Current Offering"** toggle
7. Click **"Save"**

---

## 3️⃣ App Store Connect (5 mins)

### Set Up Free Trial:

1. Go to: https://appstoreconnect.apple.com/
2. Navigate to your app → **Subscriptions**
3. For **each subscription** (monthly & yearly):
   - Click on the subscription
   - Go to **"Subscription Prices"** tab
   - Click **"Add Introductory Offer"**
   - Select:
     - Type: **Free Trial**
     - Duration: **3 Days**
     - Countries: **Select All**
   - Click **"Create"**
   - Click **"Submit"** (requires review approval)

---

## 4️⃣ Test (15 mins)

### Create Sandbox Tester:

1. In App Store Connect, go to **"Users & Access"**
2. Click **"Sandbox Testers"**
3. Click **"+"** to add new tester
4. Fill in:
   - First Name: Test
   - Last Name: User
   - Email: testuser+sandbox@yourdomain.com (must be unique)
   - Password: Create a password
   - Country: United States
5. Click **"Create"**

### Test on Device:

1. **Sign Out** of your real Apple ID:
   - Settings → Apple ID → Sign Out
2. **Install & run** your app on the device
3. **Trigger a purchase** (tap "Start 3-Day Free Trial")
4. **Sign in** with sandbox tester when prompted
5. **Verify**:
   - Purchase completes
   - Premium access granted
   - Can access all features
6. **Test Restore**:
   - Force quit app
   - Reopen app
   - Tap "Restore Purchases"
   - Verify premium status restored

---

## 5️⃣ Database Setup (2 mins)

Run this in Supabase SQL Editor:

```sql
-- Add columns for subscription tracking
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS revenuecat_user_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_product_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_profiles_revenuecat 
ON user_profiles(revenuecat_user_id);

-- Create function
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_id UUID)
RETURNS TABLE (
  is_premium BOOLEAN,
  subscription_product_id TEXT,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN up.subscription_status = 'premium' 
        AND (up.subscription_expires_at IS NULL OR up.subscription_expires_at > NOW())
      THEN TRUE
      ELSE FALSE
    END as is_premium,
    up.subscription_product_id,
    up.subscription_expires_at as expires_at
  FROM user_profiles up
  WHERE up.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ✅ Verification

After completing all steps, verify:

1. **RevenueCat Dashboard**:
   - [ ] Entitlement `premium` exists
   - [ ] Both products attached to entitlement
   - [ ] Offering `default` is marked as "Current"
   - [ ] Both packages added to offering

2. **App Store Connect**:
   - [ ] Both subscriptions show "Approved"
   - [ ] Free trial offers created (may be "Waiting for Review")
   - [ ] Sandbox tester created

3. **App**:
   - [ ] app.json updated with production bundle ID
   - [ ] Supabase SQL executed
   - [ ] Test purchase completes successfully
   - [ ] Premium features unlock
   - [ ] Restore purchases works

---

## 🎯 Product IDs Reference

**From your screenshots:**

| Platform | Monthly Product ID | Yearly Product ID |
|----------|-------------------|-------------------|
| iOS (App Store) | `com.glowcheck.monthly.premium` | `com.glowcheck.yearly1.premium` |
| RevenueCat | `com.glowcheck.monthly.premium` | `com.glowcheck.yearly1.premium` |

**✅ Product IDs match perfectly!**

---

## 🚨 Common Mistakes to Avoid

1. ❌ Creating entitlement with wrong ID (must be exactly `premium`)
2. ❌ Not setting offering as "Current"
3. ❌ Testing with real Apple ID (must use sandbox tester)
4. ❌ Not waiting for App Store sync (can take 2-6 hours)
5. ❌ Forgetting to add BILLING permission for Android

---

## 📱 Estimated Time: 37 minutes

- App Config: 5 mins
- RevenueCat Setup: 10 mins
- App Store Config: 5 mins
- Testing: 15 mins
- Database Setup: 2 mins

---

## 🆘 If Something Goes Wrong

**Check RevenueCat Debugger:**
1. Go to RevenueCat Dashboard
2. Click "Customer Lists"
3. Search for your test user
4. View transaction history

**Check App Logs:**
```javascript
// Already implemented in your code:
console.log('Purchase result:', result);
console.log('Subscription status:', subscription);
```

**Common Issues:**
- "No offerings available" → Offering not set as "Current"
- "Product not found" → Wait 2 hours for App Store sync
- "Purchase completes but no premium" → Entitlement not configured

---

## ✨ You're Production Ready!

Once all checkboxes are ticked, your app is ready for:
- TestFlight testing
- App Store submission
- Real user purchases

Your code implementation is already production-grade. The only missing pieces are the RevenueCat dashboard configuration!
