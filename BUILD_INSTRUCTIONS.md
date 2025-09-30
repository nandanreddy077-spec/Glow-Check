# Build Instructions for Glow Check App

## Prerequisites

1. **Expo Account**: nandan_07 (already configured)
2. **Bundle ID**: com.glowcheck01.app (configured for both iOS and Android)
3. **RevenueCat API Keys**:
   - iOS: appl_UpDZroTEjwQSDDRJdqLgYihNxsh
   - Android: goog_xCXiGuMlJXxLNPQUlodNDLnAAYZ

## Required Manual Fixes Before Building

### 1. Fix package.json
Remove these dependencies:
```json
"@stripe/stripe-react-native": "0.45.0",
"zustand": "^5.0.2"
```

Run after editing:
```bash
bun install
```

### 2. Fix app.json

Update these fields:
```json
{
  "expo": {
    "name": "Glow Check",
    "slug": "glowcheck",
    "ios": {
      "bundleIdentifier": "com.glowcheck01.app"
    },
    "android": {
      "package": "com.glowcheck01.app"
    }
  }
}
```

Remove these sections from app.json:
- Remove the entire `@stripe/stripe-react-native` plugin configuration
- Remove the entire `expo-location` plugin configuration
- Remove location permissions from iOS infoPlist
- Remove location permissions from Android permissions array

## Building with EAS

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
# Username: nandan_07
# Password: autobio123!
```

### Step 3: Configure EAS Build
Create `eas.json` in the root directory:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "bundleIdentifier": "com.glowcheck01.app"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production-aab": {
      "extends": "production",
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Step 4: Build for Android (.aab)
```bash
eas build --platform android --profile production-aab
```

This will:
- Build an Android App Bundle (.aab) file
- Upload it to Expo's servers
- Provide a download link when complete

### Step 5: Build for iOS (.ipa)
```bash
eas build --platform ios --profile production
```

**Important**: For iOS builds, you'll need:
- Apple Developer Account credentials
- Distribution certificate
- Provisioning profile

EAS will guide you through setting these up if not already configured.

### Step 6: Download Built Files

After builds complete, you can:
1. Download from the Expo dashboard: https://expo.dev/accounts/nandan_07/projects/glowcheck/builds
2. Or use the direct download link provided in the terminal

## Alternative: Build Both Platforms at Once
```bash
eas build --platform all --profile production
```

## Troubleshooting

### Issue: "Invalid bundle identifier"
- Ensure app.json has `com.glowcheck01.app` for both iOS and Android
- Run `eas build:configure` to regenerate configuration

### Issue: "Stripe dependency error"
- Remove `@stripe/stripe-react-native` from package.json
- Remove Stripe plugin from app.json
- Run `bun install` to update lock file

### Issue: "Location permission errors"
- Remove expo-location plugin from app.json
- Remove location permissions from iOS and Android configurations

### Issue: "Build fails with dependency conflicts"
- Clear node_modules: `rm -rf node_modules`
- Clear lock file: `rm bun.lock`
- Reinstall: `bun install`

## Post-Build Steps

### For Android (.aab):
1. Download the .aab file
2. Upload to Google Play Console
3. Create a new release
4. Submit for review

### For iOS (.ipa):
1. Download the .ipa file
2. Upload to App Store Connect using Transporter app
3. Create a new version
4. Submit for review

## Important Notes

1. **Payment Integration**: The app uses RevenueCat for in-app purchases. Ensure:
   - Products are configured in App Store Connect (com.glowcheck01.app.premium.monthly, com.glowcheck01.app.premium.annual)
   - Products are configured in Google Play Console
   - RevenueCat dashboard has both products linked

2. **API Keys**: All API keys are configured in .env file and will be bundled with the app

3. **First Build**: The first build may take 20-30 minutes. Subsequent builds are faster.

4. **Build Logs**: If build fails, check logs at: https://expo.dev/accounts/nandan_07/projects/glowcheck/builds

## Quick Build Commands

```bash
# Android AAB (for Play Store)
eas build -p android --profile production-aab

# iOS IPA (for App Store)
eas build -p ios --profile production

# Both platforms
eas build --platform all --profile production
```

## Support

If you encounter issues:
1. Check build logs in Expo dashboard
2. Verify all dependencies are installed: `bun install`
3. Ensure app.json has correct bundle IDs
4. Verify .env file has all required API keys
