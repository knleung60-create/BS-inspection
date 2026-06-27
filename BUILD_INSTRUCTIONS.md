# Building Services Inspection App - Build Instructions

## Overview

This document provides step-by-step instructions to build the Android APK file from the source code.

## Prerequisites

Before building the app, ensure you have the following installed:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/

2. **pnpm** (package manager)
   ```bash
   npm install -g pnpm
   ```

3. **Expo CLI**
   ```bash
   pnpm add -g expo-cli eas-cli
   ```

4. **Expo Account** (free)
   - Sign up at: https://expo.dev/signup

## Method 1: Build APK using EAS Build (Recommended)

EAS Build is Expo's cloud build service that builds your app without requiring Android Studio or SDK installation.

### Step 1: Install Dependencies

```bash
cd building-services-app
pnpm install
```

### Step 2: Login to Expo

```bash
eas login
```

Enter your Expo account credentials.

### Step 3: Configure EAS Build

The project already includes `eas.json` configuration file. Review it:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Step 4: Build APK

For preview/testing build:
```bash
eas build --platform android --profile preview
```

For production build:
```bash
eas build --platform android --profile production
```

### Step 5: Download APK

Once the build completes:
1. You'll receive a link to download the APK
2. Click the link or visit https://expo.dev/accounts/[your-username]/projects/building-services-app/builds
3. Download the APK file
4. Transfer it to your Android device

## Method 2: Build APK Locally (Advanced)

This method requires Android Studio and Android SDK.

### Step 1: Install Android Studio

Download and install Android Studio from:
https://developer.android.com/studio

### Step 2: Install Android SDK

1. Open Android Studio
2. Go to Tools > SDK Manager
3. Install:
   - Android SDK Platform 34 (or latest)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools

### Step 3: Set Environment Variables

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Reload your shell:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

### Step 4: Generate Native Android Project

```bash
cd building-services-app
pnpm expo prebuild --platform android
```

This creates an `android/` directory with native Android project.

### Step 5: Build APK

```bash
cd android
./gradlew assembleRelease
```

The APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Method 3: Development Build (For Testing)

For quick testing without building a full APK:

### Step 1: Install Expo Go App

On your Android device, install "Expo Go" from Google Play Store.

### Step 2: Start Development Server

```bash
cd building-services-app
pnpm start
```

### Step 3: Scan QR Code

1. A QR code will appear in your terminal
2. Open Expo Go app on your Android device
3. Scan the QR code
4. The app will load on your device

**Note**: This method requires your computer and phone to be on the same network.

## Installing APK on Android Device

### Option 1: Direct Installation

1. Transfer the APK file to your Android device
2. Open the APK file on your device
3. If prompted, enable "Install from Unknown Sources" in Settings
4. Tap "Install"
5. Once installed, tap "Open" to launch the app

### Option 2: Using ADB (Android Debug Bridge)

If you have ADB installed:

```bash
adb install path/to/app-release.apk
```

## Troubleshooting

### Issue: "eas: command not found"

**Solution**: Install EAS CLI globally
```bash
pnpm add -g eas-cli
```

### Issue: Build fails with "No Expo account"

**Solution**: Login to Expo
```bash
eas login
```

### Issue: "ANDROID_HOME not set"

**Solution**: Set environment variables as described in Method 2, Step 3

### Issue: Gradle build fails

**Solution**: 
1. Check Java version: `java -version` (should be Java 11 or higher)
2. Clean gradle cache: `cd android && ./gradlew clean`
3. Try building again

### Issue: App crashes on startup

**Solution**:
1. Check that all dependencies are installed: `pnpm install`
2. Clear Metro bundler cache: `pnpm start --clear`
3. Rebuild the app

## App Signing (For Production)

For production release, you should sign your APK:

### Generate Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Signing in EAS

Create `credentials.json`:

```json
{
  "android": {
    "keystore": {
      "keystorePath": "./my-release-key.keystore",
      "keystorePassword": "YOUR_PASSWORD",
      "keyAlias": "my-key-alias",
      "keyPassword": "YOUR_PASSWORD"
    }
  }
}
```

Then build with:
```bash
eas build --platform android --profile production
```

## Additional Resources

- Expo Documentation: https://docs.expo.dev/
- EAS Build Documentation: https://docs.expo.dev/build/introduction/
- React Native Documentation: https://reactnative.dev/docs/getting-started
- Android Developer Guide: https://developer.android.com/guide

## Support

For build-related issues:
1. Check Expo documentation
2. Visit Expo forums: https://forums.expo.dev/
3. Check GitHub issues: https://github.com/expo/expo/issues

---

**Version**: 1.0.0  
**Last Updated**: October 2025
