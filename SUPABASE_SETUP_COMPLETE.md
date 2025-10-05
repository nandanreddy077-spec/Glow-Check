# Complete Supabase Setup Guide

## Overview
This guide will help you set up your Supabase database with all the necessary tables, functions, and policies for the Glow Check app.

## Step-by-Step Setup

### 1. Run the Main Database Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `complete-supabase-setup.sql`
4. Click **Run** to execute

### 2. Run the Additional Functions
1. In the same SQL Editor
2. Copy and paste the contents of `supabase-functions-update.sql`
3. Click **Run** to execute

This will add:
- `get_user_subscription_status()` - Gets user's subscription and trial status
- `record_payment_method_added()` - Records when user adds payment method
- `start_trial_with_payment()` - Starts trial after payment method is added
- `activate_subscription_after_trial()` - Activates subscription after trial ends
- `can_perform_analysis()` - Checks if user can perform an analysis
- `track_scan_usage()` - Tracks scan usage for trial users
- `get_trial_status()` - Gets detailed trial status

### 3. Verify Setup
Run this query to verify all tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- circles
- comments
- glow_analyses
- posts
- profiles
- skincare_plans
- style_analyses
- subscriptions
- trial_tracking
- user_memberships
- user_stats

### 4. Verify Functions
Run this query to verify all functions exist:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

You should see:
- activate_subscription_after_trial
- can_perform_analysis
- get_trial_status
- get_user_subscription_status
- handle_new_user
- has_active_subscription
- increment_trial_usage
- is_in_trial_period
- record_payment_method_added
- start_trial_with_payment
- track_scan_usage
- update_updated_at_column

## Database Schema Summary

### Core Tables

#### profiles
Stores user profile information including subscription status
- `id` - User ID (references auth.users)
- `full_name` - User's full name
- `avatar_url` - Profile picture URL
- `is_premium` - Premium status
- `has_added_payment` - Whether user has added payment method
- `subscription_status` - Current subscription status
- `subscription_product_id` - Product ID of subscription
- `revenuecat_user_id` - RevenueCat user ID

#### subscriptions
Tracks user subscriptions from Apple/Google
- `user_id` - User ID
- `platform` - 'ios' or 'android'
- `product_id` - Product identifier
- `transaction_id` - Transaction ID from store
- `purchase_token` - Purchase token (Android)
- `status` - 'active', 'expired', 'cancelled', 'pending', 'grace_period', 'on_hold'
- `is_trial` - Whether this is a trial subscription
- `trial_ends_at` - When trial ends
- `expires_at` - When subscription expires

#### trial_tracking
Tracks free trial usage
- `id` - User ID
- `trial_started_at` - When trial started
- `trial_ends_at` - When trial ends
- `analyses_used` - Number of analyses used
- `max_analyses` - Maximum analyses allowed (default: 3)
- `is_trial_expired` - Whether trial has expired

#### glow_analyses
Stores beauty analysis results
- `user_id` - User ID
- `image_url` - Analysis image URL
- `overall_score` - Overall beauty score (0-100)
- `skin_score`, `makeup_score`, `hair_score` - Individual scores
- `recommendations` - AI recommendations (JSONB)
- `analysis_data` - Full analysis data (JSONB)

#### style_analyses
Stores outfit/style analysis results
- `user_id` - User ID
- `image_url` - Analysis image URL
- `occasion` - Occasion type
- `overall_score` - Overall style score (0-100)
- `color_harmony_score`, `fit_score`, `style_score` - Individual scores
- `dominant_colors`, `recommended_colors` - Color analysis (JSONB)
- `recommendations` - AI recommendations (JSONB)

#### user_stats
Gamification and progress tracking
- `id` - User ID
- `total_analyses` - Total number of analyses
- `current_streak` - Current daily streak
- `longest_streak` - Longest streak achieved
- `glow_points` - Gamification points
- `level` - User level
- `badges`, `achievements` - Earned badges/achievements (JSONB)

### Community Tables

#### circles
Beauty circles/communities
- `name`, `description` - Circle info
- `creator_id` - Creator user ID
- `member_count` - Number of members
- `is_private` - Whether circle is private

#### posts
Posts within circles
- `circle_id` - Circle ID
- `author_id` - Author user ID
- `caption` - Post caption
- `image_url` - Post image
- `reactions` - Post reactions (JSONB)

#### comments
Comments on posts
- `post_id` - Post ID
- `author_id` - Author user ID
- `text` - Comment text

## Key Functions

### get_user_subscription_status(user_uuid)
Returns complete subscription status including:
- Premium status
- Trial status
- Subscription details
- Analyses usage

### start_trial_with_payment(user_uuid, platform, product_id, transaction_id, purchase_token)
Starts a 3-day trial after user adds payment method:
- Creates trial tracking record
- Records payment method
- Creates pending subscription

### track_scan_usage(user_uuid, scan_type)
Tracks when user performs a scan:
- Increments analyses_used
- Checks if trial should expire
- Updates user stats

### can_perform_analysis(user_uuid, analysis_type)
Checks if user can perform an analysis:
- Returns true if premium
- Returns true if in trial with scans remaining
- Returns false otherwise

## Security

All tables have Row Level Security (RLS) enabled with policies that ensure:
- Users can only access their own data
- Circle members can only see posts in their circles
- Public circles are visible to all users

## Next Steps

After setting up the database:

1. **Configure Environment Variables**
   - Add your Supabase URL and anon key to `.env`
   - Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set

2. **Test the Setup**
   - Create a test user
   - Verify trial tracking is created automatically
   - Test subscription flow

3. **Set Up Webhooks** (Optional)
   - Configure Apple App Store Server Notifications
   - Configure Google Play Real-time Developer Notifications
   - These will keep subscription status in sync

## Troubleshooting

### "Failed to get subscription status" Error
This error occurs when the `get_user_subscription_status` function doesn't exist. Make sure you've run `supabase-functions-update.sql`.

### RLS Policy Errors
If you get permission denied errors, check that:
- RLS is enabled on all tables
- Policies are created correctly
- User is authenticated

### Trial Not Starting
Check that:
- `trial_tracking` record exists for user
- `handle_new_user()` trigger is working
- User is authenticated

## Support

For issues with:
- Database setup: Check Supabase logs in dashboard
- Authentication: Check Supabase Auth logs
- Functions: Use SQL Editor to test functions directly
