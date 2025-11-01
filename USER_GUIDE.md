# Building Services Inspection App - User Guide

## Overview

The Building Services Inspection App is a mobile application designed for Android devices to help inspection teams record and track building defects efficiently. All data is stored locally on your device.

## Features

### 1. Add New Defect
Record defects with the following information:
- **Service Type**: Select from PD, FS, MVAC, EL, or Bonding
- **Defect Category**: Choose from predefined categories based on service type
- **Location**: Enter the location where the defect was found
- **Remarks**: Add optional notes (up to 500 characters)
- **Photo**: Take a photo or select from gallery

### 2. View Defect Log
- Browse all recorded defects
- Filter by service type
- View detailed information for each defect
- Delete defects if needed

### 3. View Statistics
- See total number of defects
- View breakdown by service type
- See detailed statistics for each defect category

## Service Types and Categories

### PD (Plumbing & Drainage)
- External Wall openings seal up improper pipes
- Air duct routing incorrect
- Air duct / pipe improper fixed/ insufficient support
- Wall openings sealing up improper/ poor workmanship
- Incomplete Installation work
- Access panel cannot reach valves/water heater
- Water pipes and drainage pipe routing incorrect
- Pipework improper fixed /insufficient pipe bracket
- Hydraulic test of water pipes fail

### FS (Fire Services)
- Pressure test for FS pipe fail
- Sprinkler head setting out/ location incorrect
- Smoke detector setting out/ location incorrect
- FS pipes routing incorrect
- FS pipe improper fixed/insufficient pipe bracket
- Wall openings sealing up improper/ poor workmanship

### EL (Electrical)
- Ceiling junction boxes location/ setting out incorrect
- Ceiling junction boxes cover improper/ missing
- Access panel cannot access the electrical equipment
- Ceiling junction boxes without marking
- Bonding for false ceiling frame incomplete/ missing

### Bonding
- Window bonding test fail
- Louvre bonding test fail
- French door bonding test fail
- Balcony / Up railing bonding test fail

### MVAC (Mechanical Ventilation & Air Conditioning)
- External Wall openings seal up improper
- Pressure test for refrigerant pipe fail
- Vacuum test for refrigerant pipe fail
- Drain test for CDP fail
- Air duct routing incorrect
- Refrigerant and CDP routing incorrect
- Air duct / pipe improper fixed/ insufficient support
- Wall openings sealing up improper/ poor workmanship
- Incomplete Installation work

## How to Use

### Recording a Defect

1. Open the app and tap **"Add New Defect"**
2. Select the **Service Type** (e.g., PD, FS, MVAC, EL, Bonding)
3. Select the **Defect Category** from the list that appears
4. Enter the **Location** where the defect was found
5. (Optional) Add **Remarks** with additional details
6. Tap **"Take Photo"** to use camera or **"Choose Photo"** to select from gallery
7. Review the information and tap **"Submit Defect"**
8. A confirmation will show the Defect ID

### Viewing Defects

1. From the home screen, tap **"View Defect Log"**
2. Use the **Filter** button to filter by service type
3. Scroll through the list to view all defects
4. Each defect shows:
   - Defect number and ID
   - Service type
   - Category
   - Location
   - Remarks (if any)
   - Date and time
   - Photo

### Deleting a Defect

1. Open the **Defect Log**
2. Find the defect you want to delete
3. Tap the **"Delete"** button
4. Confirm the deletion

### Viewing Statistics

1. From the home screen, tap **"View Statistics"**
2. See the summary showing:
   - Total number of defects
   - Breakdown by service type
3. Scroll down to see detailed statistics for each service type
4. Each section shows the count for each defect category

## Data Storage

All data is stored locally on your Android device using SQLite database. Photos are saved in the app's private storage directory. Your data will remain on the device even if you close the app.

## Permissions Required

The app requires the following permissions:
- **Camera**: To take photos of defects
- **Photo Library**: To select existing photos from your device

## Tips

- Always take clear photos showing the defect clearly
- Be specific when entering location information
- Use remarks to add context that might be helpful later
- Review the defect log regularly to track progress
- Use statistics to identify common defect patterns

## Troubleshooting

**Problem**: Cannot take photos
- **Solution**: Check that camera permission is granted in device settings

**Problem**: Cannot select photos from gallery
- **Solution**: Check that storage/media permission is granted in device settings

**Problem**: App crashes when submitting defect
- **Solution**: Ensure all required fields are filled and photo is selected

**Problem**: Defects not showing in log
- **Solution**: Check if any filters are applied; reset to "All" to see all defects

## Support

For technical support or to report issues, please contact your system administrator.

---

**Version**: 1.0.0  
**Last Updated**: October 2025
