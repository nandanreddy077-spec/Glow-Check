# Build Issues Found and How to Fix Them

## Critical Issues Preventing .aab and .ipa Builds

### 1. ❌ Stripe Package Must Be Removed
**Issue**: The app has `@stripe/stripe-react-native` installed but you're using Apple/Google payments through RevenueCat.

**Fix in `package.json`**:
Remove line 17:
```json
"@stripe/stripe-react-native": "0.45.0",
```

**Fix in `app.json`**:
Remove the Stripe plugin (lines 70-76):
```json
[
  "@stripe/stripe-react-native",
  {
    "merchantIdentifier": "string | string[]",
    "enableGooglePay": "boolean"
  }
],
```

### 2. ❌ Wrong Bundle Identifiers
**Issue**: Bundle IDs don't match your configured `com.glowcheck01.app`

**Fix in `app.json`**:
- Line 4: Change slug from `"glowcheck-app-development-9yhnj3q7-z0c6x351-k17jcry2-qj0yhdmu-s2mtilai-6gzkcsz3-rhhhbp65"` to `"glowcheck"`
- Line 3: Change name from `"Glow Check "` (with trailing space) to `"Glow Check"`
- Line 18: Change iOS bundleIdentifier from `"app.rork.glowcheck-app-development-9yhnj3q7-z0c6x351-k17jcry2-qj0yhdmu-s2mtilai-6gzkcsz3-rhhhbp65"` to `"com.glowcheck01.app"`
- Line 40: Change Android package from `"app.rork.glowcheck-app-development-9yhnj3q7-z0c6x351-k17jcry2-qj0yhdmu-s2mtilai-6gzkcsz3-rhhhbp65"` to `"com.glowcheck01.app"`

### 3. ❌ Invalid Notification Icon Paths
**Issue**: Notification plugin references non-existent files

**Fix in `app.json`** (lines 80-85):
Remove these lines:
```json
"icon": "./local/assets/notification_icon.png",
"sounds": [
  "./local/assets/notification_sound.wav"
],
```

Keep only:
```json
"color": "#ffffff",
"defaultChannel": "default",
```

### 4. ❌ Unnecessary Location Permissions
**Issue**: App requests location permissions but doesn't use location features

**Fix in `app.json`**:

**iOS infoPlist** (lines 27-32) - Remove:
```json
"NSLocationAlwaysAndWhenInUseUsageDescription": "Allow $(PRODUCT_NAME) to use your location.",
"NSLocationAlwaysUsageDescription": "Allow $(PRODUCT_NAME) to use your location.",
"NSLocationWhenInUseUsageDescription": "Allow $(PRODUCT_NAME) to use your location.",
"UIBackgroundModes": [
  "location"
]
```

**Android permissions** (lines 47-51) - Remove:
```json
"ACCESS_COARSE_LOCATION",
"ACCESS_FINE_LOCATION",
"FOREGROUND_SERVICE",
"FOREGROUND_SERVICE_LOCATION",
"ACCESS_BACKGROUND_LOCATION"
```

**expo-location plugin** (lines 89-97) - Remove entire plugin:
```json
[
  "expo-location",
  {
    "isAndroidForegroundServiceEnabled": true,
    "isAndroidBackgroundLocationEnabled": true,
    "isIosBackgroundLocationEnabled": true,
    "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location."
  }
]
```

Also remove from `package.json` line 30:
```json
"expo-location": "~18.1.4",
```

---

## Corrected app.json

Here's the complete corrected `app.json`:

```json
{
  "expo": {
    "name": "Glow Check",
    "slug": "glowcheck",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.glowcheck01.app",
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "Allow $(PRODUCT_NAME) to access your photos",
        "NSCameraUsageDescription": "Allow $(PRODUCT_NAME) to access your camera",
        "NSMicrophoneUsageDescription": "Allow $(PRODUCT_NAME) to access your microphone",
        "CFBundleAllowMixedLocalizations": true,
        "CFBundleLocalizations": [
          "fr"
        ]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.glowcheck01.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.SCHEDULE_EXACT_ALARM"
      ]
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://rork.com/"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to let you share them with your friends."
        }
      ],
      [
        "expo-notifications",
        {
          "color": "#ffffff",
          "defaultChannel": "default",
          "enableBackgroundRemoteNotifications": false
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

## Corrected package.json

Remove these lines:
- Line 17: `"@stripe/stripe-react-native": "0.45.0",`
- Line 30: `"expo-location": "~18.1.4",`

---

## How to Build After Fixes

### Step 1: Apply All Fixes Above
1. Update `app.json` with the corrected version
2. Update `package.json` by removing Stripe and expo-location
3. Run `bun install` to update dependencies

### Step 2: Create eas.json
Create a file named `eas.json` in your project root:

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

### Step 3: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 4: Login to Expo
```bash
eas login
# Use your credentials: nandan_07 / autobio123!
```

### Step 5: Configure Project
```bash
eas build:configure
```

### Step 6: Build .aab (Android)
```bash
eas build --platform android --profile production-aab
```

### Step 7: Build .ipa (iOS)
```bash
eas build --platform ios --profile production
```

**Note**: For iOS builds, you'll need:
- Apple Developer account enrolled in Apple Developer Program ($99/year)
- Distribution certificate and provisioning profile
- EAS will guide you through creating these if you don't have them

### Step 8: Download Builds
Once builds complete, EAS will provide download links for your .aab and .ipa files.

---

## Additional Notes

### RevenueCat Setup
Your RevenueCat is already configured in `.env`:
- iOS API Key: `appl_UpDZroTEjwQSDDRJdqLgYihNxsh`
- Android API Key: `goog_xCXiGuMlJXxLNPQUlodNDLnAAYZ`

However, RevenueCat SDK (`react-native-purchases`) is NOT installed. The app currently uses fallback mode that redirects to stores. For production, you should either:

**Option A**: Keep fallback mode (current setup)
- Users will be redirected to App Store/Play Store to subscribe
- Simpler but less integrated experience

**Option B**: Install RevenueCat SDK (recommended for production)
```bash
npx expo install react-native-purchases
```
Then the payment flow will work natively in-app.

### Testing Payments
- **Development**: Payments will redirect to stores (fallback mode)
- **Production with RevenueCat SDK**: Real in-app purchases will work
- Make sure to test with sandbox accounts before going live

---

## Summary Checklist

- [ ] Fix `app.json` bundle identifiers
- [ ] Remove Stripe from `app.json` and `package.json`
- [ ] Remove expo-location from `package.json`
- [ ] Fix notification plugin config in `app.json`
- [ ] Remove location permissions from `app.json`
- [ ] Run `bun install`
- [ ] Create `eas.json`
- [ ] Install EAS CLI globally
- [ ] Login to EAS with your Expo account
- [ ] Run `eas build:configure`
- [ ] Build Android: `eas build --platform android --profile production-aab`
- [ ] Build iOS: `eas build --platform ios --profile production`
- [ ] Download and test builds
- [ ] (Optional) Install `react-native-purchases` for native payment flow
