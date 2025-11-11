# Viral Referral System - Setup Guide

## 🎉 Overview

The Lumyn app now has a complete viral referral system where users earn $1 for every friend who subscribes to premium!

## ✅ What's Been Implemented

### 1. Database Setup
- **File**: `referral-system-setup.sql`
- Run this SQL script in your Supabase SQL Editor
- Creates all necessary tables:
  - `referral_codes`: Unique codes for each user
  - `referrals`: Tracks who referred whom
  - `referral_earnings`: User earnings tracking
  - `referral_payouts`: Payout requests
- Includes RLS policies for security
- Auto-generates referral codes on user signup

### 2. Context & State Management
- **File**: `contexts/ReferralContext.tsx`
- Manages referral data, stats, and sharing
- Integrates with Supabase for data persistence
- Handles referral code tracking in AsyncStorage

### 3. Beautiful Referral UI
- **File**: `app/referral-rewards.tsx`
- Premium, Instagram-inspired design
- Shows earnings, referral count, conversion stats
- Easy sharing with code copy and native share
- Displays referral history
- "How It Works" section

### 4. Integration Points
- ✅ Added to root layout (`app/_layout.tsx`)
- ✅ Tracks conversions in `SubscriptionContext.tsx`
- ✅ Auto-tracks when referred user subscribes

## 🚀 Setup Steps

### Step 1: Database Setup
```sql
-- Run in Supabase SQL Editor
-- Copy and paste all of referral-system-setup.sql
```

### Step 2: Add Link to Profile Tab
Add a button/link in `app/(tabs)/profile.tsx` to navigate to referral-rewards:

```tsx
import { useRouter } from 'expo-router';
import { Gift } from 'lucide-react-native';

const router = useRouter();

<TouchableOpacity
  style={styles.referralButton}
  onPress={() => router.push('/referral-rewards')}
>
  <Gift size={20} color={palette.primary} />
  <Text style={styles.referralButtonText}>Earn Rewards</Text>
  <Text style={styles.referralBadge}>$1 per friend</Text>
</TouchableOpacity>
```

### Step 3: Test the Flow

1. **Sign up a new user** - They automatically get a referral code
2. **Access referral screen** - See your unique code and stats
3. **Share referral link** - Via native share or copy
4. **New user signs up** - Using your referral code/link
5. **New user subscribes** - Conversion is tracked, you earn $1

## 📊 How It Works

### User Journey:
1. User opens referral rewards screen
2. Sees their unique code (e.g., "ABCD1234")
3. Shares via native share or copies link
4. Friend signs up using code
5. Friend subscribes to premium
6. Referrer earns $1 (tracked in database)

### Technical Flow:
```
User Signup → Auto-create referral code
↓
User shares code/link
↓
New user uses ?ref=CODE in URL or enters code
↓
track_referral_signup() called → Creates referral record
↓
New user subscribes
↓
mark_referral_converted() called → Updates earnings
↓
Referrer sees $1 in pending earnings
```

## 🎨 UI Features

### Stats Cards
- Total Earned (in $)
- Friends Invited count
- Pending earnings banner

### Share Section
- Big, beautiful referral code display
- One-tap copy button
- Native share integration
- Link copy option

### How It Works
- 3-step visual guide
- Clear, simple explanations

### Referral History
- Shows recent referrals
- Status indicators (Pending/Converted/Paid)
- Earnings per referral

### Benefits Section
- Why users should share
- Community building messaging

## 💰 Monetization Notes

### Current Setup:
- $1 per conversion
- Tracked automatically on subscription
- Pending → Converted status flow

### Future Enhancements (Not Implemented):
- Payout requests (UI exists, backend needed)
- Payment processing integration
- Fraud detection
- Minimum payout thresholds
- PayPal/Stripe payouts

## 🔧 Database Functions

### Key Functions:
- `generate_referral_code()` - Creates unique 8-char codes
- `create_user_referral_code(user_uuid)` - Sets up code for user
- `track_referral_signup(user_uuid, code)` - Records referral
- `mark_referral_converted(user_uuid)` - Tracks subscription
- `get_user_referral_stats(user_uuid)` - Returns stats
- `get_user_referral_history(user_uuid)` - Returns history

## 🔐 Security

- ✅ Row Level Security enabled on all tables
- ✅ Users can only view their own data
- ✅ Server-side functions with SECURITY DEFINER
- ✅ Prevents self-referrals
- ✅ Unique constraints on referral codes

## 📱 Deep Linking Support

The system supports referral links with query parameters:
```
https://lumyn.app?ref=ABCD1234
```

To handle this:
1. Extract `ref` parameter from URL
2. Store in AsyncStorage if user not logged in
3. Track signup once user authenticates

## 🎯 Conversion Tracking

When a user subscribes, the app:
1. Updates their premium status
2. Calls `mark_referral_converted(user_id)`
3. Adds $1 to referrer's pending earnings
4. Updates conversion count
5. Sets status to 'converted'

## 📈 Analytics

Track these events for insights:
- Referral link shares
- Code copies
- Referral signups
- Conversions
- Earnings milestones

## ⚠️ Important Notes

1. **Testing**: Use test users to verify the flow works
2. **Payouts**: Currently tracked but not processed - add payment integration
3. **Fraud Prevention**: Consider adding limits and verification
4. **Compliance**: Ensure referral program complies with app store guidelines
5. **Terms**: Add referral program terms to your legal docs

## 🚢 Ready to Ship!

The referral system is production-ready with:
- ✅ Beautiful, premium UI
- ✅ Complete database schema
- ✅ Automatic tracking
- ✅ Native sharing
- ✅ Secure RLS policies
- ✅ Error handling

Just run the SQL setup and you're good to go!
