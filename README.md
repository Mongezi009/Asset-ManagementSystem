# Asset Management System

A comprehensive, self-hosted asset management system with barcode scanning capabilities for Android devices. Track, manage, and audit your organization's assets with ease.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.2.0-blue)
![Android](https://img.shields.io/badge/android-API%2024%2B-green)

## Features

### 🎯 Core Features
- **Asset Management**: Complete CRUD operations for assets with categories and locations
- **Barcode Scanning**: Android app with ML Kit barcode/QR code scanning
- **Audit Trail**: Track all asset scans with user and timestamp
- **QR Code Generation**: Generate and print QR codes for assets
- **Search & Filter**: Powerful search across asset tags, names, and descriptions
- **Reports & Analytics**: Dashboard with asset summaries and statistics
- **Self-Hosted**: Full control over your data

### 📱 Web Dashboard
- User authentication with JWT
- Responsive design for mobile/tablet/desktop
- Asset listing with real-time search
- Asset detail pages with scan history
- Print-friendly asset labels
- Dashboard with statistics

### 📲 Android App
- Camera-based barcode/QR scanning
- Real-time asset verification
- Manual entry fallback
- Configurable server connection
- Offline-ready architecture

## Architecture

```
AssetManagementSystem/
├── backend/           # Node.js/Express REST API
├── frontend/          # React web application
├── android-app/       # Android scanning app
└── docker-compose.yml # Docker deployment config
```

## Quick Start with Docker

The easiest way to get started is using Docker Compose:

```bash
# Clone or navigate to the project
cd AssetManagementSystem

# Set environment variables (optional)
export JWT_SECRET="your-secure-secret-key"

# Start all services
docker-compose up -d

# Access the web interface
# Open http://localhost in your browser
```

**Default credentials:**
- Username: `admin`
- Password: `admin123`

## Manual Installation

### Prerequisites

- Node.js 18+ and npm
- Android Studio (for Android app)
- SQLite (bundled with Node.js)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and set your JWT_SECRET
# nano .env

# Initialize database
npm run init-db

# Start development server
npm run dev

# Or production
npm start
```

The backend API will be available at `http://localhost:3000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Or build for production
npm run build
```

The frontend will be available at `http://localhost:3001` (development)

### Android App Setup

1. Open Android Studio
2. Open the `android-app` directory
3. Wait for Gradle sync
4. Configure server URL in the app or update `ApiService.kt`
5. Build and run on device/emulator

Or build APK:
```bash
cd android-app
./gradlew assembleDebug
```

APK location: `app/build/outputs/apk/debug/app-debug.apk`

## Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
```

### Frontend Configuration

Edit `frontend/src/App.js` to update API URL:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
```

Or set environment variable:
```bash
export REACT_APP_API_URL=http://your-server:3000/api
```

### Android App Configuration

On first launch, enter:
- **Server URL**: `http://YOUR_SERVER_IP:3000/api`
- **Username**: `admin`
- **Password**: `admin123`

## Database Schema

### Tables

- **users**: User accounts with roles (admin/user)
- **categories**: Asset categories (Computers, Furniture, etc.)
- **locations**: Physical locations (buildings, floors, rooms)
- **assets**: Main asset records with all details
- **scans**: Audit trail of all asset scans
- **maintenance**: Maintenance history records

## API Documentation

### Authentication

**POST** `/api/auth/login`
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "token": "jwt-token-here",
  "user": { "id": 1, "username": "admin", "role": "admin" }
}
```

### Assets

**GET** `/api/assets` - List all assets (with optional filters)
- Query params: `?search=laptop&category=1&status=Active`

**GET** `/api/assets/:id` - Get asset details with history

**POST** `/api/assets` - Create new asset
```json
{
  "asset_tag": "ASSET-001",
  "name": "Dell Laptop",
  "category_id": 1,
  "location_id": 1,
  "purchase_price": 999.99
}
```

**PUT** `/api/assets/:id` - Update asset

**DELETE** `/api/assets/:id` - Delete asset (admin only)

### Scanning

**POST** `/api/scans` - Submit a scan
```json
{
  "asset_tag": "ASSET-001",
  "scan_type": "check",
  "notes": "Annual audit"
}
```

**GET** `/api/scans/recent` - Get recent scans

### QR Codes

**GET** `/api/assets/:id/qrcode` - Generate QR code for asset

### Reports

**GET** `/api/reports/summary` - Dashboard statistics

## Usage Guide

### Adding Assets

1. Log in to web dashboard
2. Navigate to "Assets" → "Add Asset"
3. Fill in asset details (tag, name, category, etc.)
4. Save asset
5. View asset detail page to print QR code label

### Scanning Assets

1. Open Android app
2. Log in with credentials
3. Point camera at barcode/QR code
4. App automatically submits scan
5. View scan history in web dashboard

### Generating Reports

1. Navigate to Dashboard
2. View asset statistics by status and category
3. Export data (future feature)

### Printing Asset Labels

1. Open asset detail page
2. Click "Print" button
3. QR code and details will be formatted for printing
4. Print using browser print dialog

## Production Deployment

### Using Docker (Recommended)

```bash
# Set production JWT secret
export JWT_SECRET="$(openssl rand -base64 32)"

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Using Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name assets.yourcompany.com;

    location / {
        proxy_pass http://localhost:3001;
    }

    location /api {
        proxy_pass http://localhost:3000;
    }
}
```

### Security Considerations

1. **Change default credentials** immediately
2. **Set strong JWT_SECRET** in production
3. **Use HTTPS** with SSL certificates
4. **Configure firewall** to restrict access
5. **Regular backups** of `backend/data/assets.db`
6. **Update dependencies** regularly

## Backup & Restore

### Backup Database

```bash
# Copy SQLite database
cp backend/data/assets.db backup/assets-$(date +%Y%m%d).db

# Backup uploads folder
tar -czf backup/uploads-$(date +%Y%m%d).tar.gz backend/uploads/
```

### Restore Database

```bash
# Stop services
docker-compose down

# Restore database
cp backup/assets-20231225.db backend/data/assets.db

# Restore uploads
tar -xzf backup/uploads-20231225.tar.gz -C backend/

# Start services
docker-compose up -d
```

## Troubleshooting

### Backend won't start
- Check if port 3000 is available
- Verify database was initialized: `npm run init-db`
- Check logs for errors

### Android app can't connect
- Ensure device is on same network
- Use server's IP address, not localhost
- Check firewall settings
- Verify backend is running

### QR codes not scanning
- Ensure good lighting
- Hold camera steady
- Try manual entry
- Check camera permissions

### Database errors
- Ensure SQLite is installed
- Check file permissions on `data/` directory
- Re-initialize: `npm run init-db`

## Future Enhancements

- [ ] Multi-tenant support
- [ ] Advanced reporting and charts
- [ ] Email notifications
- [ ] Photo attachments for assets
- [ ] Bulk import/export (CSV/Excel)
- [ ] Asset depreciation tracking
- [ ] Mobile web app (PWA)
- [ ] Role-based permissions
- [ ] Custom fields for assets
- [ ] Integration with existing systems

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review API endpoints in code

## Credits

Built with:
- **Backend**: Node.js, Express, SQLite, JWT
- **Frontend**: React, Axios, React Router
- **Android**: Kotlin, CameraX, ML Kit, Retrofit
- **Deployment**: Docker, Nginx

---

**Note**: Change all default passwords and secrets before deploying to production!
