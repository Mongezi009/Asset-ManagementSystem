# 🚀 Asset Management System - Running Guide

## ✅ Setup Complete!

Your Asset Management System is installed and ready to use.

## 📋 What's Running

You should now have **2 PowerShell windows open**:

1. **Backend Window** - Running on http://localhost:3000
   - Shows: "Asset Management API running on http://localhost:3000"
   - Shows: "Default credentials: username=admin, password=admin123"

2. **Frontend Window** - Running on http://localhost:3001
   - Will automatically open your browser
   - Shows: "webpack compiled successfully"

## 🌐 Access the Application

**Open your web browser and go to:**
```
http://localhost:3001
```

If it didn't open automatically, just copy that URL into Chrome, Edge, or Firefox.

## 🔐 Login

Use these default credentials:
- **Username:** `admin`
- **Password:** `admin123`

## ⚠️ Troubleshooting

### Backend Not Running?

If the backend window closed or shows errors:

```powershell
cd C:\dev\AssetManagementSystem\backend
npm start
```

### Frontend Not Running?

If the frontend window closed or shows errors:

```powershell
cd C:\dev\AssetManagementSystem\frontend
npm start
```

### Can't Access http://localhost:3001?

1. Check that both PowerShell windows are still open and running
2. Look for error messages in the windows
3. Make sure no firewall is blocking the ports

### Port Already in Use?

If you see "port 3000 is already in use":

```powershell
# Stop all node processes
Get-Process node | Stop-Process -Force

# Then restart
cd C:\dev\AssetManagementSystem\backend
npm start
```

## 📱 Next Steps

1. **Login** to the web dashboard at http://localhost:3001
2. **Add your first asset:**
   - Click "Assets" → "Add Asset"
   - Fill in the details
   - Save
3. **Generate QR code:**
   - Click on your asset
   - View the QR code
   - Click "Print" to print labels
4. **Configure Android app:**
   - Build the Android app from `android-app/` folder
   - Enter server URL: `http://YOUR_PC_IP:3000/api`
   - Login and start scanning!

## 🔧 Useful Commands

### Stop Everything
Just close both PowerShell windows, or press `Ctrl+C` in each.

### Restart Backend
```powershell
cd C:\dev\AssetManagementSystem\backend
npm start
```

### Restart Frontend
```powershell
cd C:\dev\AssetManagementSystem\frontend
npm start
```

### View Database
```powershell
# Install DB Browser for SQLite, then open:
C:\dev\AssetManagementSystem\backend\data\assets.db
```

## 📚 Documentation

- **README.md** - Complete documentation
- **QUICKSTART.md** - Quick setup guide
- **backend/README.md** - API documentation
- **frontend/README.md** - Web app details
- **android-app/README.md** - Android app guide

## 🎯 Key Features to Try

1. **Dashboard** - View asset statistics
2. **Assets** - Add, edit, search assets
3. **QR Codes** - Generate and print labels
4. **Scan History** - Track who scanned what
5. **Reports** - View asset summaries

## 🔒 Security Reminders

**Before production use:**
1. Change the default password
2. Set a strong JWT_SECRET in `backend/.env`
3. Use HTTPS
4. Configure firewall
5. Regular backups of the database

---

## ✨ You're All Set!

Your Asset Management System is ready to use. Enjoy! 🎉

**Questions?** Check the full README.md or documentation files.
