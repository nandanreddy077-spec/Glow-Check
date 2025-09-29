# Production Build Guide for Glow Check

## Prerequisites

1. **EAS CLI Installation**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   # Use credentials: nandan_07 / autobio123!
   ```

3. **Initialize EAS Project**
   ```bash
   eas init --id your-eas-project-id
   ```

## App Configuration

### 1. Update app.json
Replace your current `app.json` with the production-ready configuration in `app-production.json`:

```bash
cp app-production.json app.json
```

### 2. Create EAS Build Configuration
Create `eas.json` in your project root:

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium",
        "bundleIdentifier": "com.glowcheck01.app"
      },
      "android": {
        "resourceClass": "medium",
        "buildType": "aab",
        "package": "com.glowcheck01.app"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "2V4DJQD8G3"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## Environment Variables

Create `.env.production` file:

```env
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_UpDZroTEjwQSDDRJdqLgYihNxsh
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_xCXiGuMlJXxLNPQUlodNDLnAAYZ

# Product IDs
EXPO_PUBLIC_IAP_MONTHLY_PRODUCT_ID=com.glowcheck01.app.premium.monthly
EXPO_PUBLIC_IAP_YEARLY_PRODUCT_ID=com.glowcheck01.app.premium.annual

# App Store Configuration
EXPO_PUBLIC_APP_STORE_TEAM_ID=2V4DJQD8G3
EXPO_PUBLIC_APP_STORE_BUNDLE_ID=com.glowcheck01.app
EXPO_PUBLIC_APP_STORE_SHARED_SECRET=5063e6dd7c174550b12001c140f6b803

# Google Play Configuration
EXPO_PUBLIC_GOOGLE_PLAY_PACKAGE_NAME=com.glowcheck01.app
```

## Building the Apps

### 1. Build Android AAB
```bash
eas build --platform android --profile production
```

This will:
- Create an Android App Bundle (.aab file)
- Include RevenueCat for in-app purchases
- Use bundle ID: com.glowcheck01.app
- Generate a signed production build

### 2. Build iOS IPA
```bash
eas build --platform ios --profile production
```

This will:
- Create an iOS App Archive (.ipa file)
- Include RevenueCat for in-app purchases
- Use bundle ID: com.glowcheck01.app
- Generate a signed production build

### 3. Build Both Platforms
```bash
eas build --platform all --profile production
```

## Download Built Files

After builds complete:

1. **Via EAS CLI:**
   ```bash
   eas build:list
   eas build:download [BUILD_ID]
   ```

2. **Via Expo Dashboard:**
   - Visit https://expo.dev/accounts/nandan_07/projects/glow-check/builds
   - Download the .aab and .ipa files

## App Store Submission

### iOS App Store
1. Download the .ipa file
2. Use Xcode or Application Loader to upload to App Store Connect
3. Configure app metadata, screenshots, and pricing
4. Submit for review

### Google Play Store
1. Download the .aab file
2. Upload to Google Play Console
3. Configure store listing, screenshots, and pricing
4. Submit for review

## Payment Configuration

The app is configured with:
- **RevenueCat** for cross-platform subscription management
- **iOS API Key:** appl_UpDZroTEjwQSDDRJdqLgYihNxsh
- **Android API Key:** goog_xCXiGuMlJXxLNPQUlodNDLnAAYZ
- **Bundle ID:** com.glowcheck01.app (both platforms)

### Subscription Products
- **Monthly Premium:** $8.99/month with 3-day free trial
- **Yearly Premium:** $99.00/year with 3-day free trial

## Important Notes

1. **No Fallbacks:** The payment system only works with real payments through App Store/Google Play
2. **Production Only:** In-app purchases don't work in Expo Go - only in production builds
3. **RevenueCat Integration:** Handles subscription management, receipts, and cross-platform sync
4. **Real Payments:** Users will be charged real money for subscriptions

## Troubleshooting

If builds fail:
1. Check that all certificates are valid
2. Ensure bundle IDs match in App Store Connect/Google Play Console
3. Verify RevenueCat configuration
4. Check EAS build logs for specific errors

## Next Steps

1. Test the built apps on physical devices
2. Verify in-app purchases work correctly
3. Submit to app stores
4. Monitor RevenueCat dashboard for subscription analytics