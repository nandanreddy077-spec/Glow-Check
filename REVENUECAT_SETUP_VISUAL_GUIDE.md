# 🎨 RevenueCat Visual Setup Guide

This guide shows you EXACTLY what to click and what you should see.

---

## 🏁 Starting Point

Open: https://app.revenuecat.com/

You should see your "Glow Check" project with:
- ✅ 2 Products already configured
- ✅ Both products "Approved"

**Current State**: Products exist, but not connected to app logic yet.

---

## Step 1: Create Entitlement (5 minutes)

### What You'll Click:

```
Left Sidebar
├─ Overview
├─ Charts
├─ Customers
├─ Product catalog ← (You're here from screenshot)
├─ Entitlements ← CLICK HERE
├─ Offerings
└─ ...
```

### Visual Guide:

```
┌────────────────────────────────────────────────────────┐
│  RevenueCat Dashboard                                  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  [← Back]  Entitlements                                │
│                                                         │
│  Create entitlements to grant your customers access to │
│  premium features when they purchase a product.        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  [+ New Entitlement]  ← CLICK THIS BUTTON       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  No entitlements yet                                   │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### After Clicking "+ New Entitlement":

```
┌────────────────────────────────────────────────────────┐
│  Create Entitlement                               [✕]  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Entitlement ID *                                      │
│  ┌─────────────────────────────────────────────────┐  │
│  │  premium         ← TYPE EXACTLY THIS            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Display Name *                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Premium Access  ← TYPE THIS                    │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Description (optional)                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Full access to all premium features           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Cancel]  [Create]  ← CLICK CREATE                   │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**⚠️ CRITICAL**: Entitlement ID must be exactly `premium` (lowercase, no spaces)

### What You Should See After Creating:

```
┌────────────────────────────────────────────────────────┐
│  RevenueCat Dashboard                                  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  [← Back]  Entitlements                                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  [+ New Entitlement]                             │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  👑 premium                                      │  │ ← YOU SEE THIS NOW
│  │     Premium Access                               │  │
│  │     0 products attached                          │  │
│  │                                                   │  │
│  │     [View Details] [Edit] [Delete]               │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

✅ **Checkpoint**: You should see "premium" entitlement with "0 products attached"

---

## Step 2: Attach Products to Entitlement (3 minutes)

### What You'll Click:

Click on the **"premium"** entitlement box you just created:

```
┌─────────────────────────────────────────────────┐
│  👑 premium                                      │  ← CLICK HERE
│     Premium Access                               │
│     0 products attached                          │
└─────────────────────────────────────────────────┘
```

### Visual Guide:

```
┌────────────────────────────────────────────────────────┐
│  Entitlement: premium                            [✕]   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Identifier: premium                                   │
│  Display Name: Premium Access                          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Attached Products (0)                          │  │
│  │                                                   │  │
│  │  No products attached yet                        │  │
│  │                                                   │  │
│  │  [Attach Products]  ← CLICK THIS BUTTON         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Edit] [Delete Entitlement]                          │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### After Clicking "Attach Products":

```
┌────────────────────────────────────────────────────────┐
│  Attach Products to "premium"                    [✕]   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Select products to attach to this entitlement:       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ☑️ com.glowcheck.monthly.premium              │  │ ← CHECK THIS
│  │     Monthly Glow Premium • $8.99/month          │  │
│  │                                                   │  │
│  │  ☑️ com.glowcheck.yearly1.premium              │  │ ← CHECK THIS
│  │     Yearly Glow Premium • $99/year              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Cancel]  [Attach Selected]  ← CLICK ATTACH          │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**⚠️ CRITICAL**: Check BOTH products before clicking "Attach Selected"

### What You Should See After Attaching:

```
┌────────────────────────────────────────────────────────┐
│  Entitlement: premium                            [✕]   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Identifier: premium                                   │
│  Display Name: Premium Access                          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Attached Products (2)                          │  │ ← NOW SHOWS 2!
│  │                                                   │  │
│  │  📦 com.glowcheck.monthly.premium               │  │
│  │     $8.99/month • Status: Approved              │  │
│  │                                                   │  │
│  │  📦 com.glowcheck.yearly1.premium               │  │
│  │     $99/year • Status: Approved                 │  │
│  │                                                   │  │
│  │  [Attach More Products]                          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

✅ **Checkpoint**: You should see both products attached with "Status: Approved"

---

## Step 3: Create Offering (7 minutes)

### What You'll Click:

```
Left Sidebar
├─ Overview
├─ Charts
├─ Customers
├─ Product catalog
├─ Entitlements ← (Just finished)
├─ Offerings ← CLICK HERE
└─ ...
```

### Visual Guide:

```
┌────────────────────────────────────────────────────────┐
│  RevenueCat Dashboard                                  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  [← Back]  Offerings                                   │
│                                                         │
│  Offerings let you organize products into packages     │
│  that your app can display to users.                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  [+ New Offering]  ← CLICK THIS BUTTON          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  No offerings yet                                      │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### After Clicking "+ New Offering":

```
┌────────────────────────────────────────────────────────┐
│  Create Offering                                  [✕]  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Offering Identifier *                                 │
│  ┌─────────────────────────────────────────────────┐  │
│  │  default         ← TYPE EXACTLY THIS            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Description *                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Default Premium Offering                       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Cancel]  [Create]  ← CLICK CREATE                   │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**⚠️ CRITICAL**: Offering identifier must be exactly `default` (lowercase)

### What You Should See After Creating:

```
┌────────────────────────────────────────────────────────┐
│  RevenueCat Dashboard                                  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  [← Back]  Offerings                                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  📦 default                                      │  │ ← YOU SEE THIS NOW
│  │     Default Premium Offering                     │  │
│  │     0 packages • Not Current                     │  │
│  │                                                   │  │
│  │     [View Details] [Edit] [Delete]               │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

✅ **Checkpoint**: You should see "default" offering with "0 packages"

---

## Step 4: Add Packages to Offering (5 minutes)

### What You'll Click:

Click on the **"default"** offering box:

```
┌─────────────────────────────────────────────────┐
│  📦 default                                      │  ← CLICK HERE
│     Default Premium Offering                     │
│     0 packages • Not Current                     │
└─────────────────────────────────────────────────┘
```

### Visual Guide:

```
┌────────────────────────────────────────────────────────┐
│  Offering: default                               [✕]   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Identifier: default                                   │
│  Description: Default Premium Offering                 │
│                                                         │
│  Current Offering: ⭘ No  ← WILL CHANGE THIS LATER    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Packages (0)                                    │  │
│  │                                                   │  │
│  │  No packages yet                                 │  │
│  │                                                   │  │
│  │  [+ Add Package]  ← CLICK THIS BUTTON           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Adding Monthly Package:

```
┌────────────────────────────────────────────────────────┐
│  Add Package to "default"                        [✕]   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Package Identifier *                                  │
│  ┌─────────────────────────────────────────────────┐  │
│  │  monthly         ← TYPE THIS                    │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Select Product *                                      │
│  ┌─────────────────────────────────────────────────┐  │
│  │  [Select Product ▼]                             │  │ ← CLICK DROPDOWN
│  │                                                   │  │
│  │  Dropdown shows:                                 │  │
│  │  • com.glowcheck.monthly.premium  ← SELECT THIS │  │
│  │  • com.glowcheck.yearly1.premium                │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Package Type *                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  [Select Type ▼]                                │  │ ← CLICK DROPDOWN
│  │                                                   │  │
│  │  Dropdown shows:                                 │  │
│  │  • CUSTOM                                        │  │
│  │  • MONTHLY  ← SELECT THIS                       │  │
│  │  • ANNUAL                                        │  │
│  │  • WEEKLY                                        │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Cancel]  [Add Package]  ← CLICK ADD PACKAGE         │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**⚠️ CRITICAL**: 
- Package identifier: `monthly`
- Product: `com.glowcheck.monthly.premium`
- Type: `MONTHLY`

### After Adding Monthly Package:

Now click "+ Add Package" again to add yearly:

```
┌────────────────────────────────────────────────────────┐
│  Offering: default                               [✕]   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Packages (1)                                    │  │
│  │                                                   │  │
│  │  📦 monthly                                      │  │
│  │     com.glowcheck.monthly.premium               │  │
│  │     MONTHLY • $8.99/month                        │  │
│  │                                                   │  │
│  │  [+ Add Package]  ← CLICK TO ADD YEARLY         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Adding Yearly Package:

```
┌────────────────────────────────────────────────────────┐
│  Add Package to "default"                        [✕]   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Package Identifier *                                  │
│  ┌─────────────────────────────────────────────────┐  │
│  │  annual          ← TYPE THIS                    │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Select Product *                                      │
│  ┌─────────────────────────────────────────────────┐  │
│  │  com.glowcheck.yearly1.premium  ← SELECT THIS   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Package Type *                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ANNUAL  ← SELECT THIS                          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Cancel]  [Add Package]  ← CLICK ADD PACKAGE         │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**⚠️ CRITICAL**: 
- Package identifier: `annual`
- Product: `com.glowcheck.yearly1.premium`
- Type: `ANNUAL`

### After Adding Both Packages:

```
┌────────────────────────────────────────────────────────┐
│  Offering: default                               [✕]   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Identifier: default                                   │
│  Description: Default Premium Offering                 │
│                                                         │
│  Current Offering: ⭘ No  ← NEED TO ENABLE THIS!      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Packages (2)                                    │  │ ← NOW SHOWS 2!
│  │                                                   │  │
│  │  📦 monthly                                      │  │
│  │     com.glowcheck.monthly.premium               │  │
│  │     MONTHLY • $8.99/month                        │  │
│  │                                                   │  │
│  │  📦 annual                                       │  │
│  │     com.glowcheck.yearly1.premium               │  │
│  │     ANNUAL • $99/year                            │  │
│  │                                                   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

✅ **Checkpoint**: You should see 2 packages (monthly and annual)

---

## Step 5: Set as Current Offering (1 minute)

### MOST CRITICAL STEP!

Look for the "Current Offering" toggle and enable it:

```
┌────────────────────────────────────────────────────────┐
│  Offering: default                               [✕]   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Current Offering: ⭘ No  ← CLICK THIS TOGGLE         │
│                     👆                                 │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### After Enabling:

```
┌────────────────────────────────────────────────────────┐
│  Offering: default                               [✕]   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Current Offering: ⦿ Yes  ⭐ ← SHOULD SHOW YES NOW    │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Click "Save" or "Done":

```
┌────────────────────────────────────────────────────────┐
│                                                         │
│  [Cancel]  [Save Changes]  ← CLICK SAVE               │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Final View:

```
┌────────────────────────────────────────────────────────┐
│  RevenueCat Dashboard                                  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  [← Back]  Offerings                                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ⭐ default  (Current)                           │  │ ��� SEE THIS!
│  │     Default Premium Offering                     │  │
│  │     2 packages                                   │  │
│  │                                                   │  │
│  │     📦 monthly → com.glowcheck.monthly.premium  │  │
│  │     📦 annual → com.glowcheck.yearly1.premium   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## ✅ COMPLETE! Verification Checklist

Go through this checklist to verify everything:

### Entitlements Tab:
```
- [ ] See "premium" entitlement
- [ ] Shows "2 products attached"
- [ ] Both products listed:
      - [ ] com.glowcheck.monthly.premium
      - [ ] com.glowcheck.yearly1.premium
```

### Offerings Tab:
```
- [ ] See "default" offering
- [ ] Shows "⭐ (Current)" indicator
- [ ] Shows "2 packages"
- [ ] Both packages listed:
      - [ ] monthly → monthly product
      - [ ] annual → yearly product
```

---

## 🎯 Expected Final State

```
ENTITLEMENTS
├─ premium (2 products)
    ├─ com.glowcheck.monthly.premium ✅
    └─ com.glowcheck.yearly1.premium ✅

OFFERINGS
└─ default ⭐ (Current, 2 packages)
    ├─ monthly → com.glowcheck.monthly.premium ✅
    └─ annual → com.glowcheck.yearly1.premium ✅
```

---

## 🧪 Test It Works

In your app console, you should now see:

```javascript
✅ "RevenueCat initialized successfully"
✅ "Retrieved products from RevenueCat: [
     { productId: 'com.glowcheck.monthly.premium', ... },
     { productId: 'com.glowcheck.yearly1.premium', ... }
   ]"
```

**If you see**: `"No current offering available, using fallback products"`
→ Offering is not set as "Current". Go back and enable it!

---

## 🎉 Success!

RevenueCat is now fully configured! 

**Next**: Update app.json and test purchases.

**Guide**: See `EXACT_CHANGES_NEEDED.md` → Change #1

---

## ⏱️ Time Spent

- Create Entitlement: 5 minutes ✅
- Attach Products: 3 minutes ✅
- Create Offering: 2 minutes ✅
- Add Packages: 5 minutes ✅
- Set as Current: 1 minute ✅

**Total**: 16 minutes

**Great work!** 🎉
