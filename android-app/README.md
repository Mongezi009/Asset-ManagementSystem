# Asset Scanner - Android App

Mobile application for scanning and managing assets using barcode/QR code scanning.

## Features

- **Barcode Scanning**: Scan QR codes and barcodes using device camera
- **Real-time Processing**: Instant asset lookup and verification
- **Offline Capability**: Cache scanned data for later sync
- **Manual Entry**: Enter asset tags manually if scanning fails

## Requirements

- Android 7.0 (API 24) or higher
- Camera permission
- Network connectivity

## Building the App

### Prerequisites

- Android Studio Arctic Fox or later
- Android SDK with API 34
- Kotlin 1.8+

### Build Steps

1. Open Android Studio
2. Select "Open an Existing Project"
3. Navigate to the `android-app` directory
4. Wait for Gradle sync to complete
5. Click "Run" or use `Shift + F10`

### Generate APK

```bash
./gradlew assembleDebug
```

The APK will be available at: `app/build/outputs/apk/debug/app-debug.apk`

## Configuration

### Server URL Setup

On first launch, configure the backend API URL:
- Format: `http://YOUR_SERVER_IP:3000/api`
- Example: `http://192.168.1.100:3000/api`
- Default credentials: `admin` / `admin123`

### Camera Permissions

The app will request camera permission on first launch. Grant permission to enable barcode scanning.

## Usage

1. **Login**: Enter server URL, username, and password
2. **Scan**: Point camera at barcode/QR code
3. **Verify**: App automatically submits scan to server
4. **Manual Entry**: Use manual button for non-scannable assets

## Architecture

- **MVVM Pattern**: Clean separation of concerns
- **Retrofit**: REST API communication
- **CameraX**: Modern camera API
- **ML Kit**: Barcode detection
- **Coroutines**: Asynchronous operations

## Dependencies

- AndroidX Core KTX
- CameraX for camera functionality
- ML Kit for barcode scanning
- Retrofit for API calls
- Kotlin Coroutines

## Troubleshooting

### Camera Not Working
- Ensure camera permission is granted
- Check if device has a working camera
- Restart the app

### Connection Errors
- Verify server URL is correct
- Ensure device is on same network as server
- Check firewall settings

### Barcode Not Detected
- Ensure good lighting
- Hold steady and at proper distance
- Try manual entry if barcode is damaged

## Security Notes

- Uses JWT authentication
- Credentials stored securely in SharedPreferences
- HTTPS recommended for production use
- Set `android:usesCleartextTraffic="false"` in production

## Future Enhancements

- Offline mode with local database
- Batch scanning
- Asset history view
- Photo capture for assets
- Push notifications
- Dark mode support
