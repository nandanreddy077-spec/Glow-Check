# Google Sign-In Setup Guide

Google Sign-In has been integrated into your Glow Check app using Supabase OAuth. This allows users to quickly sign in with their Google account.

## Current Implementation

✅ **Already Implemented:**
- Google Sign-In button added to Login screen
- Google Sign-In button added to Signup screen  
- AuthContext updated with `signInWithGoogle()` method
- Uses Supabase OAuth (works in Expo Go)
- Beautiful UI matching the app's design

## Setup Required

To enable Google Sign-In in production, you need to configure it in Supabase:

### 1. Configure Google OAuth in Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click to expand
4. Toggle **Enable Google Provider** to ON

### 2. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen (if not done)
6. Create credentials for:
   - **Web application** (for Supabase)
   - **iOS** (for mobile app)
   - **Android** (for mobile app)

### 3. Configure Web Application OAuth Client

**Authorized JavaScript origins:**
```
https://jsvzqgtqkanscjoafyoi.supabase.co
```

**Authorized redirect URIs:**
```
https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback
```

### 4. Configure iOS OAuth Client

**Bundle ID:**
```
com.glowcheck01.app
```

**Redirect URI:**
```
com.glowcheck01.app:/oauth2redirect/google
```

### 5. Configure Android OAuth Client

**Package name:**
```
com.glowcheck01.app
```

**SHA-1 certificate fingerprint:**
- Get from your keystore for production
- For development, you can get it from Expo:
  ```bash
  expo credentials:manager
  ```

### 6. Add Credentials to Supabase

Back in Supabase Dashboard (Authentication → Providers → Google):

1. **Client ID**: Paste your Web OAuth Client ID
2. **Client Secret**: Paste your Web OAuth Client Secret
3. Click **Save**

### 7. Update App Configuration

Add to your `.env` file:
```bash
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_IOS=your-ios-client-id-here
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_ANDROID=your-android-client-id-here
```

### 8. Test Google Sign-In

**Development (Expo Go):**
- Currently shows a placeholder message
- Full testing requires custom dev client or production build

**Production:**
- After setup, users will see Google's OAuth consent screen
- After approval, they'll be authenticated and returned to the app

## User Experience

When users tap "Continue with Google":

1. **Development**: Shows message that Google Sign-In needs configuration
2. **Production** (after setup):
   - Opens Google OAuth consent screen
   - User selects their Google account
   - User approves permissions
   - Automatically creates account and signs in
   - Redirects to app's main screen

## Features

- **Fast authentication**: No need to remember passwords
- **Security**: OAuth 2.0 standard, managed by Google
- **Beautiful UI**: Matches the app's feminine aesthetic
- **Fallback**: Email/password still available
- **Cross-platform**: Works on iOS, Android, and Web

## Benefits for Conversion

- **Reduced friction**: One tap sign-in
- **Trust**: Google branding increases trust
- **Speed**: Faster than filling out forms
- **Mobile-first**: Optimized for mobile experience

## Next Steps

1. Complete Supabase Google OAuth setup (steps above)
2. Test with production build or custom dev client
3. Monitor conversion rates
4. Consider adding Apple Sign-In for iOS (recommended)

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard
2. Verify OAuth credentials are correct
3. Ensure redirect URIs match exactly
4. Check that Google+ API is enabled

---

**Note**: The current implementation will show a message to users that Google Sign-In is not yet configured. Once you complete the setup above, it will work automatically without code changes.
