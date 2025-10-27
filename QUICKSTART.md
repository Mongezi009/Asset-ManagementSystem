# Quick Start Guide

Get your Asset Management System up and running in minutes!

## Option 1: Docker (Recommended)

**Prerequisites:** Docker and Docker Compose installed

```bash
# 1. Navigate to project directory
cd AssetManagementSystem

# 2. Start everything
docker-compose up -d

# 3. Access the application
# Open http://localhost in your browser

# 4. Login with default credentials
# Username: admin
# Password: admin123
```

That's it! The system is now running.

## Option 2: Manual Setup

**Prerequisites:** Node.js 18+ installed

### Step 1: Start Backend

```bash
cd backend
npm install
npm run init-db
npm start
```

Backend now running at `http://localhost:3000`

### Step 2: Start Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

Frontend now running at `http://localhost:3001`

### Step 3: Access Application

1. Open `http://localhost:3001` in browser
2. Login with `admin` / `admin123`
3. Start adding assets!

## First Steps After Login

### 1. Add Your First Asset

1. Click "Assets" → "Add Asset"
2. Fill in:
   - Asset Tag: `LAPTOP-001`
   - Name: `Dell XPS 15`
   - Category: `Computers`
   - Location: `Headquarters - Floor 1`
3. Click "Create Asset"

### 2. Generate QR Code

1. Click on the asset you just created
2. View the QR code on the right
3. Click "Print" to print asset label

### 3. Configure Android App

1. Install Android app on your device
2. Open app and enter:
   - Server URL: `http://YOUR_COMPUTER_IP:3000/api`
   - Username: `admin`
   - Password: `admin123`
3. Point camera at QR code to scan!

## Finding Your Computer's IP Address

### Windows
```bash
ipconfig
```
Look for "IPv4 Address"

### Mac/Linux
```bash
ifconfig
```
or
```bash
ip addr show
```

### Example
If your IP is `192.168.1.100`, use:
```
http://192.168.1.100:3000/api
```

## Next Steps

1. **Change default password**: Create new admin user, delete default
2. **Add categories**: Customize asset categories for your needs
3. **Add locations**: Set up your organization's locations
4. **Import assets**: Add your existing assets
5. **Train users**: Show team how to scan assets

## Common Issues

### Can't access from Android
- Make sure phone and computer are on same WiFi network
- Use computer's IP address, not `localhost`
- Check firewall isn't blocking port 3000

### Port already in use
```bash
# Backend - use different port
PORT=3001 npm start

# Frontend will use next available port automatically
```

### Database not initialized
```bash
cd backend
npm run init-db
```

## Stop Services

### Docker
```bash
docker-compose down
```

### Manual
Press `Ctrl+C` in each terminal window

## Need Help?

See the main README.md for detailed documentation.

## Security Reminder

**IMPORTANT:** Before using in production:
1. Change admin password
2. Set strong JWT_SECRET
3. Use HTTPS
4. Configure firewall
5. Regular backups
