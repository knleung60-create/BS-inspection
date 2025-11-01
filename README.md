# Building Services Inspection App

A mobile application for Android devices designed to help building inspection teams record and track defects efficiently. All data is stored locally on the device.

## Features

- **Defect Recording**: Upload photos and record defect details one by one
- **Service Type Selection**: Choose from PD, FS, MVAC, EL, or Bonding
- **Category Management**: Select from predefined defect categories specific to each service type
- **Location Tracking**: Record the exact location of each defect
- **Photo Documentation**: Take photos or select from gallery to document defects
- **Defect Log**: View, filter, and manage all recorded defects
- **Statistics Dashboard**: View comprehensive statistics by service type and category
- **Local Storage**: All data stored securely on the device using SQLite

## Service Types

- **PD**: Plumbing & Drainage
- **FS**: Fire Services
- **MVAC**: Mechanical Ventilation & Air Conditioning
- **EL**: Electrical
- **Bonding**: Bonding Tests

## Technology Stack

- **Framework**: React Native with Expo
- **Database**: SQLite (expo-sqlite)
- **UI Components**: React Native Paper (Material Design)
- **Navigation**: React Navigation
- **Image Handling**: Expo Image Picker
- **File System**: Expo File System

## Project Structure

```
building-services-app/
├── App.js                      # Main app component with navigation
├── app.json                    # Expo configuration
├── eas.json                    # EAS Build configuration
├── package.json                # Dependencies
├── constants/
│   └── defectData.js          # Service types and categories
├── database/
│   └── db.js                  # SQLite database functions
├── screens/
│   ├── HomeScreen.js          # Home screen with main navigation
│   ├── AddDefectScreen.js     # Add new defect form
│   ├── DefectLogScreen.js     # View and manage defects
│   └── StatisticsScreen.js    # Statistics dashboard
├── BUILD_INSTRUCTIONS.md       # How to build the APK
└── USER_GUIDE.md              # User manual
```

## Installation

### For Users

1. Download the APK file
2. Transfer it to your Android device
3. Enable "Install from Unknown Sources" in device settings
4. Open the APK file and tap "Install"
5. Launch the app

### For Developers

1. Clone or extract the project
2. Install dependencies:
   ```bash
   cd building-services-app
   pnpm install
   ```
3. Start development server:
   ```bash
   pnpm start
   ```
4. Scan QR code with Expo Go app on your Android device

## Building APK

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for detailed instructions on building the Android APK.

**Quick Build (Recommended)**:
```bash
eas login
eas build --platform android --profile preview
```

## Usage

See [USER_GUIDE.md](USER_GUIDE.md) for detailed usage instructions.

**Quick Start**:
1. Open app and tap "Add New Defect"
2. Select service type and category
3. Enter location and take photo
4. Submit to save the defect
5. View all defects in "Defect Log"
6. Check statistics in "Statistics"

## Database Schema

The app uses SQLite with the following schema:

```sql
CREATE TABLE defects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  defectId TEXT UNIQUE NOT NULL,
  serviceType TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  remarks TEXT,
  photoPath TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
```

## Permissions

The app requires the following Android permissions:
- **CAMERA**: To take photos of defects
- **READ_EXTERNAL_STORAGE**: To access photos from gallery
- **WRITE_EXTERNAL_STORAGE**: To save photos
- **READ_MEDIA_IMAGES**: To read media images (Android 13+)

## Data Storage

- **Database**: SQLite database stored in app's private directory
- **Photos**: Stored in `{FileSystem.documentDirectory}defect_photos/`
- **Persistence**: Data persists across app restarts
- **Privacy**: All data stored locally, no cloud sync

## Development

### Prerequisites

- Node.js 18+
- pnpm
- Expo CLI
- Android device or emulator

### Running in Development

```bash
# Install dependencies
pnpm install

# Start Metro bundler
pnpm start

# Run on Android
pnpm run android
```

### Testing

Test the app using:
1. Expo Go app (for quick testing)
2. Android emulator (requires Android Studio)
3. Physical Android device (recommended)

## Validation Rules

- **Photo**: Required, JPEG/PNG format, max 5MB
- **Service Type**: Required, must be one of: PD, FS, MVAC, EL, Bonding
- **Category**: Required, must match service type's category list
- **Location**: Required, cannot be empty
- **Remarks**: Optional, max 500 characters

## Defect ID Format

Defect IDs are automatically generated in the format:
```
DEF-YYYYMMDD-HHMMSS-RRR
```

Example: `DEF-20251028-143025-742`

## Version

**Current Version**: 1.0.0  
**Release Date**: October 2025

## License

Proprietary - All rights reserved

## Support

For technical support or questions:
- Refer to [USER_GUIDE.md](USER_GUIDE.md) for usage help
- Refer to [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for build issues
- Contact your system administrator for additional support

## Changelog

### Version 1.0.0 (October 2025)
- Initial release
- Core defect recording functionality
- SQLite local storage
- Photo capture and upload
- Defect log with filtering
- Statistics dashboard
- Support for 5 service types (PD, FS, MVAC, EL, Bonding)
- Material Design UI with React Native Paper

## Future Enhancements

Potential features for future versions:
- Export defects to PDF/Excel
- Backup and restore functionality
- Multi-language support
- Offline sync capability
- Barcode/QR code scanning for locations
- Voice notes for remarks
- Signature capture for approval
