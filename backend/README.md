# Asset Management Backend API

REST API server for the Asset Management System built with Node.js, Express, and SQLite.

## Features

- RESTful API design
- JWT authentication
- SQLite database
- File upload support
- QR code generation
- CORS enabled
- Comprehensive error handling

## Installation

```bash
npm install
```

## Database Setup

```bash
npm run init-db
```

This creates the SQLite database and initializes it with:
- Default admin user (username: `admin`, password: `admin123`)
- Default categories
- Default locations

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (admin only)

### Assets
- `GET /api/assets` - List all assets (with filters)
- `GET /api/assets/:id` - Get asset details
- `POST /api/assets` - Create asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset (admin only)
- `GET /api/assets/:id/qrcode` - Generate QR code

### Scans
- `POST /api/scans` - Submit scan
- `GET /api/scans/recent` - Get recent scans

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category

### Locations
- `GET /api/locations` - List locations
- `POST /api/locations` - Create location

### Reports
- `GET /api/reports/summary` - Dashboard statistics

### Health
- `GET /health` - Health check endpoint

## Environment Variables

Create `.env` file:

```env
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=production
```

## Project Structure

```
backend/
├── server.js              # Main application file
├── scripts/
│   └── initDatabase.js    # Database initialization
├── data/
│   └── assets.db          # SQLite database (created on init)
├── uploads/               # Uploaded files directory
├── package.json
└── .env
```

## Authentication

All endpoints except `/api/auth/login` and `/health` require authentication.

Include JWT token in requests:
```
Authorization: Bearer <token>
```

## Database Schema

See main README for complete schema details.

## Development

The server uses `nodemon` for hot-reloading during development:

```bash
npm run dev
```

## Production Deployment

1. Set strong `JWT_SECRET` in `.env`
2. Run `npm ci --only=production`
3. Initialize database: `npm run init-db`
4. Start server: `npm start`
5. Consider using PM2 for process management

```bash
npm install -g pm2
pm2 start server.js --name asset-api
pm2 save
pm2 startup
```

## Testing

Test health endpoint:
```bash
curl http://localhost:3000/health
```

Test login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Troubleshooting

### Port already in use
```bash
# Change PORT in .env or:
PORT=3001 npm start
```

### Database locked
- Ensure only one instance is running
- Check file permissions
- Re-initialize if corrupted: `npm run init-db`

### CORS errors
- Verify CORS configuration in `server.js`
- Check frontend URL matches allowed origins
