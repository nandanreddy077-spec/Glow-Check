# Freemium Flow Implementation

## Overview
Comprehensive 3-tier freemium model with strategic conversion points.

## User Flows

### 1. Free User (New/Unpaid)
**Scan Limits:**
- 1 glow analysis scan (total, ever)
- 1 style guide scan (total, ever)

**Glow Analysis Results:**
- Full access to first 4 personalized beauty tips
- Tips 5-8 are blurred with upgrade CTA
- Can click "Start Your Glow Journey"
- Can choose a plan in glow journey

**Glow Coach (After creating plan):**
- All headings visible (Morning Glow, Evening Renewal, etc.)
- Content inside boxes (like "gentle morning cleanse" details) is **BLURRED**
- Can tick boxes but can't see content
- Upgrade prompt overlays content areas

**After First Scan:**
- Second scan attempt → Analysis happens
- Results screen shows with important info blurred
- Popup appears: "Start 3-day free trial"

---

### 2. Trial User (3-Day Free Trial)
**Activation:**
- Triggered when free user wants second scan
- Must choose a plan ($8.99/month or $99/year)
- No charge until trial ends

**Scan Limits:**
- 2 scans per day for glow analysis
- 2 scans per day for style guide
- Resets daily at midnight

**Glow Analysis Results:**
- All 8 personalized beauty tips visible
- Nothing blurred in analysis results
- Full access to comprehensive analysis

**Glow Coach:**
- Headings visible
- Content in boxes still **BLURRED**
- Special "Cancel Trial & Pay Now" button
- Clicking button:
  - Cancels 3-day trial
  - Charges immediately
  - Unlocks everything

**Trial Duration:**
- 3 days from activation
- After 3 days: automatic conversion to paid
- Can upgrade early via "Cancel Trial & Pay Now"

---

### 3. Paid User
**Scan Limits:**
- Unlimited glow analysis scans
- Unlimited style guide scans

**Full Access:**
- All analysis results unblurred
- All 8+ personalized beauty tips
- Complete glow coach content visible
- All boxes content visible
- No restrictions

---

## Database Schema

### user_scan_usage Table
```sql
- user_id
- glow_analysis_scans (total ever)
- style_guide_scans (total ever)
- today_glow_scans (resets daily)
- today_style_scans (resets daily)
- last_scan_date (for daily reset)
- last_glow_scan
- last_style_scan
- updated_at
```

---

## Implementation Status

### ✅ Completed
1. **FreemiumContext Updated**
   - Added `isFreeUser`, `isTrialUser`, `isPaidUser` flags
   - Daily scan tracking for trial users
   - Scan limit enforcement
   - Trial upgrade modal state

2. **Analysis Results Screen**
   - 8 tips shown (first 4 visible for free, last 4 blurred)
   - Blur overlay with upgrade CTA
   - Smart routing based on user type

### 🚧 Pending
1. **Style Results Screen** - Apply same blur logic after first scan
2. **Glow Coach Screen** - Blur content boxes while showing headings
3. **Scan Limit UI** - Show scans remaining in UI
4. **Trial Upgrade Modal** - Popup when free user attempts second scan
5. **Cancel Trial Button** - In glow coach for trial users
6. **Database Migration** - Add new columns to user_scan_usage table

---

## Conversion Strategy

### Hook Points
1. **After First Scan** - Show value, then prompt for trial
2. **Blurred Content** - Teaser of premium features
3. **Daily Scans** - Create habit during trial
4. **Early Upgrade** - "Cancel Trial & Pay Now" for eager users

### Psychology
- Give enough value to show worth (1 free scan)
- Create FOMO with blurred content
- Build habit with trial (2 scans/day for 3 days)
- Remove friction with trial (no immediate charge)
- Offer early upgrade path for committed users

---

## Next Steps

1. Update database schema
2. Complete remaining UI components
3. Test all three user flows
4. Analytics tracking for conversion funnel
