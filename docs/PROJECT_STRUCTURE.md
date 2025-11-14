# 📂 Project Structure - 5zn.io

Current file structure of the 5zn-web application.

```
5zn-web/
│
├── 📄 Core Application Files
│   ├── index.html                      # Main HTML (production)
│   ├── styles-5zn.css                  # Main stylesheet
│   ├── server.py                       # Production HTTP server
│   └── config.js                       # Configuration (Strava keys)
│
├── 🎨 JavaScript Components
│   ├── 5zn-store.js                    # State management
│   ├── 5zn-canvas-component.js         # Canvas rendering (1080x1920)
│   ├── app-5zn-logic.js                # Business logic & Strava API
│   └── polyline.js                     # Polyline encoding/decoding
│
├── 🗄️ Database
│   ├── database_schema.sql             # PostgreSQL schema
│   ├── server_config.py                # Server configuration
│   └── server_config.py.example        # Configuration template
│
├── 🔐 OAuth
│   └── oauth/
│       └── index.html                  # OAuth callback handler
│
├── 🎯 Assets
│   ├── assets/
│   │   └── polymer-symbol.svg          # Logo
│   ├── favicon.ico                     # Site icon
│   └── logo_NIP.svg                    # Alternative logo
│
├── 📚 Documentation
│   ├── README.md                       # ⭐ Main documentation
│   ├── DOCS.md                         # Documentation index
│   ├── PROJECT_STRUCTURE.md            # This file
│   ├── DATABASE_LOCATION.md            # Database info
│   ├── RAILWAY_DEPLOY.md               # Deployment guide
│   ├── RAILWAY_DB_SETUP.md             # DB setup guide
│   ├── OAUTH_SETUP.md                  # OAuth configuration
│   └── SECURITY_SETUP.md               # Security practices
│
├── 🚀 Deployment
│   ├── railway.json                    # Railway configuration
│   ├── railway.env.example             # Environment variables template
│   ├── requirements.txt                # Python dependencies
│   ├── Dockerfile                      # Docker configuration
│   ├── docker-compose.yml              # Docker Compose
│   ├── deploy.sh                       # Deployment script
│   └── start-dev.sh                    # Local dev script
│
├── 🎨 Admin & Tools
│   ├── admin_panel.html                # User management panel
│   └── activity.html                   # Activity viewer
│
├── 📦 Dependencies
│   ├── package.json                    # NPM dependencies
│   └── package-lock.json               # Locked versions
│
└── 🔒 Ignored (not in git)
    ├── node_modules/                   # NPM packages
    ├── __pycache__/                    # Python cache
    ├── data/                           # JSON user data (fallback)
    └── server_config.py                # Local configuration
```

## 📊 File Count Summary

### Production Files
- **HTML**: 3 files (index.html, admin_panel.html, activity.html)
- **CSS**: 1 file (styles-5zn.css)
- **JavaScript**: 4 core files + config
- **Python**: 1 server file
- **SQL**: 1 schema file

### Documentation
- **Markdown**: 8 documentation files
- **Configuration Examples**: 2 files

### Total (excluding node_modules)
- ~25 core application files
- ~8 documentation files
- ~5 configuration files

## 🔑 Key Files Explained

### Frontend Core
| File | Purpose | Lines | Size |
|------|---------|-------|------|
| `index.html` | Main application entry | ~220 | ~10 KB |
| `styles-5zn.css` | All styles | ~650 | ~15 KB |
| `5zn-canvas-component.js` | Canvas renderer | ~410 | ~13 KB |
| `5zn-store.js` | State management | ~150 | ~5 KB |
| `app-5zn-logic.js` | Business logic | ~800 | ~30 KB |

### Backend Core
| File | Purpose | Lines | Size |
|------|---------|-------|------|
| `server.py` | HTTP server + API | ~500 | ~18 KB |
| `database_schema.sql` | DB schema | ~50 | ~2 KB |
| `config.js` | Configuration | ~45 | ~2 KB |

### Documentation
| File | Purpose |
|------|---------|
| `README.md` | Main documentation (architecture, setup, features) |
| `DOCS.md` | Documentation index & guide |
| `DATABASE_LOCATION.md` | Database connection & management |
| `RAILWAY_DEPLOY.md` | Deployment instructions |
| `OAUTH_SETUP.md` | Strava OAuth configuration |
| `SECURITY_SETUP.md` | Security best practices |

## 📦 Dependencies

### Python (requirements.txt)
```
psycopg2-binary==2.9.9  # PostgreSQL adapter
```
*Note: Uses Python standard library otherwise*

### JavaScript (package.json)
```
None - Pure vanilla JavaScript
```
*No build step, no bundler, runs directly in browser*

## 🎯 Entry Points

### Development
```bash
python3 server.py
# → http://localhost:8000/index.html
```

### Production (Railway)
```bash
python3 server.py
# → https://5zn-web.up.railway.app/
```

### Admin Panel
```
http://localhost:8000/admin_panel.html
```

## 🔄 Data Flow

```
┌─────────────┐
│   Browser   │
│ (index.html)│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  JavaScript Components          │
│  ┌──────────────────────────┐  │
│  │ app-5zn-logic.js         │  │ ◄── Strava API
│  │ (Business Logic)         │  │
│  └────────┬─────────────────┘  │
│           │                     │
│           ▼                     │
│  ┌──────────────────────────┐  │
│  │ 5zn-store.js             │  │
│  │ (State Management)       │  │
│  └────────┬─────────────────┘  │
│           │                     │
│           ▼                     │
│  ┌──────────────────────────┐  │
│  │ 5zn-canvas-component.js  │  │
│  │ (Canvas Rendering)       │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
       │
       ▼
┌─────────────┐
│  server.py  │ ◄────────────────┐
│  (HTTP API) │                  │
└──────┬──────┘                  │
       │                         │
       ▼                         │
┌─────────────┐          ┌───────────────┐
│ PostgreSQL  │          │  Strava API   │
│  (Railway)  │          │  (External)   │
└─────────────┘          └───────────────┘
```

## 🏗️ Build Process

### No Build Required! 
This project uses vanilla JavaScript and CSS.

**No bundling:**
- ✅ No Webpack
- ✅ No Babel
- ✅ No TypeScript compilation
- ✅ No SASS/LESS compilation

**Just serve:**
```bash
python3 server.py
```

Files are served directly to the browser!

## 📝 Code Statistics

### Total Lines of Code
```
JavaScript:  ~2,400 lines
CSS:         ~650 lines
Python:      ~500 lines
HTML:        ~220 lines
SQL:         ~50 lines
─────────────────────────
Total:       ~3,820 lines
```

### File Sizes (Uncompressed)
```
Total JavaScript:  ~50 KB
Total CSS:         ~15 KB
Total HTML:        ~10 KB
Total Python:      ~18 KB
─────────────────────────
Total:            ~93 KB
```

## 🔍 File Patterns

### Naming Conventions
- **HTML**: `kebab-case.html`
- **CSS**: `kebab-case.css`
- **JavaScript**: `kebab-case.js`
- **Python**: `snake_case.py`
- **SQL**: `snake_case.sql`
- **Markdown**: `SCREAMING_CASE.md`

### Import Patterns
```html
<!-- In HTML -->
<script src="config.js?v=3"></script>
<script src="5zn-store.js?v=3"></script>
<script src="5zn-canvas-component.js?v=3"></script>
<script src="app-5zn-logic.js?v=3"></script>
```

### Version Query Strings
All static files use `?v=X` for cache busting:
```
styles-5zn.css?v=3
5zn-store.js?v=3
```

## 🚀 Size Comparison

### Total Project Size
```
Without node_modules: ~150 KB
With node_modules:    ~5 MB
```

### Minimal Footprint
- ✅ No heavy frameworks (React, Vue, Angular)
- ✅ No build tools (Webpack, Rollup)
- ✅ Lightweight dependencies
- ✅ Fast load times

---

**Last Updated**: October 2025  
**Total Files**: ~35 (excluding node_modules)  
**Total Code**: ~3,820 lines

