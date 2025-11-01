# Building Services Inspection App - Quick Start Guide

## What You Have

You have received the complete source code for the **Building Services Inspection App**, a mobile application for Android devices that helps inspection teams record and track building defects.

## Package Contents

- **Source Code**: Complete React Native/Expo project
- **Documentation**:
  - `README.md` - Project overview
  - `BUILD_INSTRUCTIONS.md` - How to build the Android APK
  - `USER_GUIDE.md` - How to use the app
  - `QUICK_START.md` - This file

## Next Steps

### Option 1: Build APK Immediately (Easiest)

If you want to build the Android APK right away:

1. **Extract the source code**:
   ```bash
   tar -xzf building-services-app-source.tar.gz
   cd building-services-app
   ```

2. **Install Node.js** (if not already installed):
   - Download from: https://nodejs.org/
   - Install version 18 or higher

3. **Install pnpm**:
   ```bash
   npm install -g pnpm
   ```

4. **Install project dependencies**:
   ```bash
   pnpm install
   ```

5. **Install Expo CLI**:
   ```bash
   pnpm add -g eas-cli
   ```

6. **Create Expo account** (free):
   - Sign up at: https://expo.dev/signup

7. **Login to Expo**:
   ```bash
   eas login
   ```

8. **Build APK**:
   ```bash
   eas build --platform android --profile preview
   ```

9. **Wait for build to complete** (5-15 minutes)

10. **Download APK** from the link provided

11. **Install on Android device**:
    - Transfer APK to your device
    - Enable "Install from Unknown Sources"
    - Open APK and tap "Install"

### Option 2: Test Without Building

If you want to test the app quickly without building an APK:

1. **Extract and install dependencies** (steps 1-4 from Option 1)

2. **Install Expo Go** on your Android device:
   - Download from Google Play Store

3. **Start development server**:
   ```bash
   cd building-services-app
   pnpm start
   ```

4. **Scan QR code** with Expo Go app on your device

5. **Test the app** on your device

### Option 3: Review Code First

If you want to review the code before building:

1. **Extract the source code**:
   ```bash
   tar -xzf building-services-app-source.tar.gz
   ```

2. **Open in your code editor**:
   ```bash
   cd building-services-app
   code .  # or use your preferred editor
   ```

3. **Review key files**:
   - `App.js` - Main application entry point
   - `screens/` - All screen components
   - `database/db.js` - Database functions
   - `constants/defectData.js` - Service types and categories

4. **Read documentation**:
   - `README.md` - Project overview
   - `BUILD_INSTRUCTIONS.md` - Build instructions
   - `USER_GUIDE.md` - User manual

## Key Features

✅ **Record Defects**: Upload photos and record defect details  
✅ **5 Service Types**: PD, FS, MVAC, EL, Bonding  
✅ **Predefined Categories**: Service-specific defect categories  
✅ **Local Storage**: All data stored on device using SQLite  
✅ **Photo Documentation**: Camera and gallery support  
✅ **Defect Log**: View, filter, and manage defects  
✅ **Statistics**: Comprehensive statistics dashboard  

## System Requirements

### For Building:
- **Operating System**: Windows, macOS, or Linux
- **Node.js**: Version 18 or higher
- **Internet Connection**: Required for initial setup and cloud build
- **Expo Account**: Free account (sign up at expo.dev)

### For Running:
- **Android Device**: Android 5.0 (Lollipop) or higher
- **Storage**: At least 50MB free space
- **Permissions**: Camera and storage access

## File Structure

```
building-services-app/
├── App.js                      # Main app
├── package.json                # Dependencies
├── app.json                    # Expo config
├── eas.json                    # Build config
├── screens/                    # UI screens
│   ├── HomeScreen.js
│   ├── AddDefectScreen.js
│   ├── DefectLogScreen.js
│   └── StatisticsScreen.js
├── database/
│   └── db.js                   # SQLite functions
├── constants/
│   └── defectData.js          # Data definitions
├── README.md                   # Overview
├── BUILD_INSTRUCTIONS.md       # Build guide
└── USER_GUIDE.md              # User manual
```

## Common Issues

### "pnpm: command not found"
**Solution**: Install pnpm with `npm install -g pnpm`

### "eas: command not found"
**Solution**: Install EAS CLI with `pnpm add -g eas-cli`

### "No Expo account"
**Solution**: Create account at https://expo.dev/signup and run `eas login`

### Build takes too long
**Solution**: EAS cloud builds typically take 5-15 minutes. Be patient.

## Getting Help

1. **Build Issues**: See `BUILD_INSTRUCTIONS.md`
2. **Usage Questions**: See `USER_GUIDE.md`
3. **Code Questions**: See `README.md`
4. **Expo Issues**: Visit https://docs.expo.dev/

## What's Next?

After building the APK:

1. **Install on devices**: Distribute APK to your team
2. **Test thoroughly**: Test all features before production use
3. **Train users**: Share the USER_GUIDE.md with your team
4. **Customize**: Modify categories or add features as needed

## Customization

To customize the app:

1. **Edit categories**: Modify `constants/defectData.js`
2. **Change colors**: Update styles in screen files
3. **Add fields**: Modify database schema in `database/db.js`
4. **Rebuild**: Run `eas build` again after changes

## Support

For technical support:
- Expo Documentation: https://docs.expo.dev/
- React Native Docs: https://reactnative.dev/
- Expo Forums: https://forums.expo.dev/

---

**Ready to start?** Choose one of the options above and follow the steps!

**Need help?** Refer to BUILD_INSTRUCTIONS.md for detailed guidance.
