# Asset Management Frontend

React-based web dashboard for the Asset Management System.

## Features

- Responsive design (mobile, tablet, desktop)
- User authentication with JWT
- Asset listing with search
- Asset detail views
- QR code display and printing
- Dashboard with statistics
- Modern UI with clean design

## Installation

```bash
npm install
```

## Development

```bash
npm start
```

Runs at `http://localhost:3001` (or next available port)

## Production Build

```bash
npm run build
```

Creates optimized production build in `build/` directory.

## Configuration

### API URL

Edit `src/App.js`:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
```

Or set environment variable:

```bash
export REACT_APP_API_URL=http://your-server:3000/api
npm start
```

### Production Build with Custom API

```bash
REACT_APP_API_URL=http://api.yourserver.com/api npm run build
```

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── App.js         # Main application component
│   ├── App.css        # Styles
│   └── index.js       # Entry point
├── package.json
└── Dockerfile
```

## Pages

### Login Page
- Server URL configuration
- Username/password authentication
- Credential persistence

### Dashboard
- Total asset count
- Recent scans (7 days)
- Assets by status
- Assets by category
- Recent scan history table

### Asset List
- Searchable asset table
- Filter by category, location, status
- Quick view buttons
- Add new asset button

### Asset Detail
- Complete asset information
- QR code display
- Print functionality
- Scan history
- Maintenance records

### Add Asset Form
- Asset tag (required)
- Name (required)
- Category selection
- Location selection
- Serial number
- Purchase details
- Condition and status

## Styling

The app uses custom CSS with:
- CSS variables for theming
- Responsive breakpoints
- Print-specific styles
- Modern card-based layout

Color scheme:
- Primary: Blue (#2563eb)
- Success: Green (#10b981)
- Danger: Red (#ef4444)
- Warning: Orange (#f59e0b)

## API Integration

Uses Axios for HTTP requests with:
- Automatic token injection via interceptor
- Error handling
- Token storage in localStorage

## Authentication Flow

1. User enters credentials
2. App calls `/api/auth/login`
3. Token stored in localStorage
4. Token added to all subsequent requests
5. Invalid token redirects to login

## Deployment

### Serve Static Build

```bash
npm install -g serve
serve -s build -p 3001
```

### With Nginx

```nginx
server {
    listen 80;
    root /path/to/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
    }
}
```

### With Docker

See `Dockerfile` and `docker-compose.yml` in root directory.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Blank page after build
- Check console for errors
- Verify API_URL is correct
- Check build output

### CORS errors
- Ensure backend CORS is configured
- Use proxy in development (`package.json` has proxy config)

### Login fails
- Verify backend is running
- Check API URL configuration
- Inspect network tab for errors
