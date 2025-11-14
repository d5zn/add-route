# 5zn.io - Cycling Activity Visualization

Modern web application for visualizing Strava cycling routes and workout data with beautiful graphics.

## 🏗️ Architecture

### Overview
```
┌─────────────────────────────────────────────────────────┐
│                     Railway Cloud                        │
│  ┌────────────────┐              ┌──────────────────┐   │
│  │  Web Service   │◄────────────►│   PostgreSQL     │   │
│  │  (Python HTTP) │              │   Database       │   │
│  │  Port: 8000    │              │                  │   │
│  └────────────────┘              └──────────────────┘   │
│         │                                                │
│         │ Serves Static Files + API                     │
│         ▼                                                │
│  ┌────────────────────────────────────────────────┐     │
│  │  Frontend (Single Page Application)            │     │
│  │  • index.html                                   │     │
│  │  • styles-5zn.css                               │     │
│  │  • 5zn-canvas-component.js (Canvas 1080x1920)  │     │
│  │  • 5zn-store.js (State Management)             │     │
│  │  • app-5zn-logic.js (Business Logic)           │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │    Strava OAuth API    │
              │  (Activity Data)       │
              └────────────────────────┘
```

## 🎯 Core Components

### Frontend Architecture

#### Layout Structure (Fixed Panels)
```
┌──────────────────────────────────────┐
│  Navbar (48px) - Fixed Top           │ z-index: 100
├──────────────────────────────────────┤
│                                      │
│  Preview Area (Flexible Height)      │ z-index: 1
│  • Canvas: 1080x1920px (9:16)        │
│  • Auto-scales to fit container      │
│  • States: not-connected, connected, │
│           loading                    │
│                                      │
├──────────────────────────────────────┤
│  Editing Panel (180px) - Fixed Bot   │ z-index: 90
│  • Photo Tab: Upload background      │
│  • Data Tab: Select metrics          │
└──────────────────────────────────────┘
```

#### Canvas System
- **Resolution**: 1080x1920 pixels (internal rendering)
- **Aspect Ratios**: 
  - 9:16 (Portrait, default)
  - 4:5 (Square, 1080x1350)
- **Display**: Auto-scales to fit available space
- **Rendering**: Uses DPR=1 for consistent quality

### Backend (Python HTTP Server)

**File**: `server.py`

Features:
- ✅ Static file serving
- ✅ Strava OAuth token exchange
- ✅ PostgreSQL database integration
- ✅ Rate limiting (100 req/60s per IP)
- ✅ Security headers (CSP, CORS, XSS protection)
- ✅ Admin API for user management

**Endpoints**:
- `GET /` - Serves index.html
- `POST /api/strava/token` - OAuth token exchange
- `GET /api/admin/users` - List connected users

### Database (PostgreSQL on Railway)

**Connection**:
```
postgresql://postgres:mkuEzDfDJnCePKiizLumEMTuwRqFVJqY@postgres.railway.internal:5432/railway
```

**Schema**: `database_schema.sql`

**Tables**:
- `athletes` - Strava user data
  - athlete_id (PK)
  - username, firstname, lastname, email
  - city, country
  - profile_picture
  - access_token_hash (hashed for security)
  - timestamps (connected_at, last_seen_at)

## 📁 Project Structure

```
5zn-web/
│
├── 🎯 Main Application
│   ├── index.html                  # Main HTML (production)
│   ├── activity.html               # Activity detail page
│   ├── landing.html                # Landing page
│   ├── information.html            # Information center
│   ├── styles-5zn.css             # Main stylesheet
│   ├── config.js                  # Configuration (Strava API keys)
│   └── polyline.js                # Polyline encoding/decoding
│
├── 🧩 JavaScript Components
│   ├── 5zn-store.js               # State management
│   ├── 5zn-canvas-component.js    # Canvas rendering (1080x1920)
│   └── app-5zn-logic.js           # Business logic & Strava integration
│
├── 🔧 Backend
│   ├── server.py                  # Production HTTP server
│   ├── server_config.py.example   # Server configuration template
│   ├── requirements.txt           # Python dependencies
│   └── import_templates.py        # Template import script
│
├── 🗄️ Database
│   └── db/
│       ├── README.md              # Database documentation
│       └── schemas/
│           ├── 01_main.sql        # Core schema (athletes, tokens)
│           ├── 02_admin.sql       # Admin schema (clubs, templates)
│           └── 03_analytics.sql   # Analytics schema
│
├── 👨‍💼 Admin Panel (React/Vite)
│   └── admin/
│       ├── src/                   # React source code
│       ├── dist/                  # Built admin panel
│       ├── package.json           # Node dependencies
│       └── README.md              # Admin documentation
│
├── 🔐 OAuth
│   └── oauth/
│       └── index.html             # OAuth callback handler
│
├── 🎨 Assets
│   ├── assets/
│   │   └── polymer-symbol.svg     # Logo
│   ├── favicon.ico
│   └── *.svg                      # Various logos
│
└── 📚 Documentation
    ├── README.md                  # This file
    └── docs/
        ├── README.md              # Documentation index
        ├── DOCS.md                # Complete docs
        ├── PROJECT_STRUCTURE.md   # File structure details
        ├── deployment/            # Deployment guides
        ├── guides/                # How-to guides
        └── archive/               # Historical docs
```

## 🚀 Deployment (Railway)

### Current Deployment

**Service URL**: https://5zn-web.up.railway.app (or custom domain)
**Database**: PostgreSQL (internal Railway network)

### Environment Variables

Required on Railway:
```bash
# Strava OAuth
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret

# Database (Auto-configured by Railway)
DATABASE_URL=postgresql://...

# Server
PORT=8000
ENVIRONMENT=production

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
DEBUG=False
```

### Deploy Commands

Railway automatically detects Python and runs:
```bash
python3 server.py
```

Configured in `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python3 server.py",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 💻 Local Development

### Prerequisites
```bash
# Python 3.8+
python3 --version

# PostgreSQL (optional - uses JSON fallback)
psycopg2-binary
```

### Setup

1. **Clone & Install**
```bash
git clone <repository>
cd 5zn-web
pip3 install psycopg2-binary  # Optional
```

2. **Configure Strava OAuth**

Edit `config.js`:
```javascript
STRAVA: {
    CLIENT_ID: 'YOUR_STRAVA_CLIENT_ID',
    CLIENT_SECRET: 'YOUR_STRAVA_CLIENT_SECRET',
    REDIRECT_URI: 'http://localhost:8000/oauth/',
    SCOPE: 'read,activity:read_all'
}
```

Create `server_config.py`:
```python
# Strava OAuth
STRAVA_CLIENT_ID = 'your_client_id'
STRAVA_CLIENT_SECRET = 'your_client_secret'

# CORS
ALLOWED_ORIGINS = ['http://localhost:8000']
DEBUG = True
```

3. **Run Server**
```bash
python3 server.py
```

Server starts at: http://localhost:8000

### Development Mode Features
- Auto-opens browser
- Debug logging enabled
- Relaxed CSP headers
- No HTTPS requirement

## 🎨 Canvas System

### Resolution & Scaling

**Internal Canvas**: 1080x1920 pixels
- High-quality rendering
- Consistent export resolution
- Professional output

**Display Scaling**:
```javascript
// Automatically fits between navbar (48px) and editing panel (180px)
availableHeight = window.innerHeight - 48 - 180
canvasDisplayHeight = availableHeight
canvasDisplayWidth = canvasDisplayHeight * (9/16)
```

### Aspect Ratios

**9:16 Portrait (Default)**
- Canvas: 1080x1920px
- Instagram Stories, TikTok format

**4:5 Square**
- Canvas: 1080x1350px
- Instagram Feed format

### Rendering Pipeline

1. **Load Activity Data** from Strava API
2. **Decode Polyline** to coordinates
3. **Upload Background Image** (optional)
4. **Render to Canvas** at 1080x1920
5. **Scale Display** to fit screen
6. **Export** as high-res image

## 🔐 Security

### Implemented Features
- ✅ Rate limiting (100 req/60s per IP)
- ✅ Content Security Policy (CSP)
- ✅ CORS with whitelist
- ✅ XSS Protection headers
- ✅ Token hashing (SHA-256)
- ✅ HTTPS-only in production (HSTS)
- ✅ No sensitive data logging

### Security Headers
```
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

## 📊 State Management

**File**: `5zn-store.js`

Simple store pattern with observers:
```javascript
const store = new SznStore({
    image: '',
    title: '',
    date: '',
    fontColor: 'white',
    postStyle: 'portrait', // 9:16 or square 4:5
    RideData: [...],
    speedData: [...]
});

store.subscribe((state) => {
    // React to state changes
});
```

## 🎯 Key Features

### User Features
- 🔗 **Strava Integration** - Connect via OAuth
- 📊 **Activity Selection** - Choose from recent workouts
- 🖼️ **Background Upload** - Custom background images
- 🎨 **Metric Selection** - Show/hide data points
- 📱 **Multiple Formats** - 9:16 (Stories) or 4:5 (Feed)
- 💾 **High-res Export** - 1080x1920px images

### Technical Features
- ⚡ **Fast Rendering** - Canvas-based graphics
- 🎯 **Responsive Layout** - Fixed panels + flexible canvas
- 💾 **Database Storage** - PostgreSQL user tracking
- 🔒 **Secure OAuth** - No token storage in frontend
- 📈 **Scalable** - Railway auto-scaling

## 🐛 Troubleshooting

### Canvas Not Displaying
Check console for errors:
```javascript
console.log('Canvas size:', canvas.width, canvas.height);
```

### OAuth Errors
1. Verify `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET`
2. Check redirect URI matches Strava app settings
3. Ensure `ALLOWED_ORIGINS` includes your domain

### Database Connection Issues
Server falls back to JSON files if PostgreSQL unavailable:
```
⚠️ No database connection, using JSON fallback
💾 Saved athlete data (JSON): data/athlete_12345.json
```

## 📚 Additional Documentation

For complete documentation, see [docs/README.md](docs/README.md)

Quick links:
- [Deployment Guide](docs/deployment/RAILWAY_DEPLOY.md) - Railway deployment
- [OAuth Setup](docs/guides/OAUTH_SETUP.md) - Strava OAuth configuration
- [Database Setup](docs/deployment/RAILWAY_DB_SETUP.md) - Database configuration
- [Security Guide](docs/guides/SECURITY_SETUP.md) - Security best practices
- [Admin Panel](admin/README.md) - Admin panel documentation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 License

Private project - All rights reserved

## 👨‍💻 Development Team

Built with ❤️ for cyclists

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Status**: ✅ Production (Railway)
