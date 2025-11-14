# Add Route - Next.js Migration

Welcome to the Next.js version of the Add Route / 5zn / addicted project!

## 🎯 Current Status

**Migration Progress:** 55% Complete (Phase 1)

✅ **Completed:**
- Next.js app initialized with TypeScript & Tailwind CSS
- PostgreSQL connection via Prisma
- Authentication & session management
- All major API endpoints ported
- Strava OAuth integration

🚧 **In Progress:**
- React Admin Panel migration
- Vanilla JS frontend migration
- Template config validation

📅 **Pending:**
- Final cleanup & deprecation

See `docs/MIGRATION_PROGRESS.md` for detailed progress report.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Strava OAuth credentials (optional, for Strava features)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env` file in the root directory:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/addicted_db?schema=public"

# Admin Authentication
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your_secure_password"
ADMIN_SESSION_SECRET="your_secure_session_secret"

# Strava OAuth (optional)
STRAVA_CLIENT_ID="your_strava_client_id"
STRAVA_CLIENT_SECRET="your_strava_client_secret"
STRAVA_REDIRECT_URI="http://localhost:3000/api/strava/callback"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. **Generate Prisma Client:**
```bash
npx prisma generate
```

4. **Run database migrations (if needed):**
```bash
npx prisma db push
```

### Development

**Start Next.js dev server:**
```bash
npm run dev:next
```

The app will be available at `http://localhost:3000`

**Other available commands:**
```bash
# Build for production
npm run build

# Start production server
npm run start:next

# Open Prisma Studio (database GUI)
npx prisma studio

# Run old Python server (during migration)
npm run start
```

---

## 📁 Project Structure

```
5zn-web/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   ├── admin/             # Admin panel (Next.js)
│   ├── app/               # Main app view
│   └── api/               # API Route Handlers
│       ├── templates/     # Public API
│       ├── strava/        # Strava OAuth
│       └── admin/         # Admin API (protected)
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities & helpers
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # Authentication
│   └── strava.ts         # Strava API client
├── prisma/
│   └── schema.prisma     # Database schema
├── admin/                 # OLD React admin (Vite) - to be deprecated
├── db/                    # SQL schema files
├── docs/                  # Documentation
│   ├── ARCHITECTURE-NEXT.md      # Architecture plan
│   └── MIGRATION_PROGRESS.md     # Migration status
├── middleware.ts          # Route protection
├── next.config.ts         # Next.js config
└── tailwind.config.ts     # Tailwind config
```

---

## 🔌 API Endpoints

### Public API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates?clubId=X` | Get published templates for a club |
| GET | `/api/strava/auth` | Start Strava OAuth flow |
| GET | `/api/strava/callback` | Handle Strava OAuth callback |

### Admin API (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/logout` | Admin logout |
| GET | `/api/admin/me` | Get current session |
| GET | `/api/admin/clubs` | List all clubs |
| POST | `/api/admin/clubs` | Create new club |
| GET | `/api/admin/clubs/[id]` | Get club by ID |
| PUT | `/api/admin/clubs/[id]` | Update club |
| DELETE | `/api/admin/clubs/[id]` | Delete club |
| GET | `/api/admin/templates` | List templates |
| POST | `/api/admin/templates` | Create new template |
| GET | `/api/admin/templates/[id]` | Get template by ID |
| PUT | `/api/admin/templates/[id]` | Update template |
| DELETE | `/api/admin/templates/[id]` | Delete template |

All admin endpoints require authentication via session cookie.

---

## 🔐 Authentication

### Admin Login
1. Navigate to `/admin/login`
2. Enter credentials (from `.env`)
3. Session cookie is set (HTTP-only, 7 days)
4. Access protected admin routes

### Strava OAuth
1. User clicks "Connect with Strava"
2. Redirects to `/api/strava/auth`
3. User authorizes on Strava
4. Callback to `/api/strava/callback`
5. Athlete & tokens stored in database

---

## 🗄️ Database

The project uses PostgreSQL with Prisma ORM.

### Database Models

- **Athlete** - Strava user data
- **Token** - Access/refresh tokens
- **UserSession** - User sessions
- **Club** - Club metadata & themes
- **Template** - Template configurations (JSONB)
- **AuthEvent** - Authentication events (analytics)
- **Download** - Download tracking (analytics)
- **Visit** - Page visits (analytics)

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio

# Pull database schema (introspection)
npx prisma db pull

# Push schema without migrations
npx prisma db push
```

---

## 🎨 Tech Stack

### Next.js App
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v3
- **UI:** shadcn/ui components
- **ORM:** Prisma 6
- **Database:** PostgreSQL
- **Auth:** Custom HMAC sessions
- **Deployment:** Vercel / Railway compatible

### Old Apps (Being Migrated)
- **Vanilla JS App:** PWA + Canvas (root directory)
- **Admin Panel:** React + Vite + MUI (admin/ directory)
- **Backend:** Python + http.server (server.py)

---

## 📖 Documentation

- **Architecture Analysis:** `docs/ARCHITECTURE-NEXT.md`
- **Migration Progress:** `docs/MIGRATION_PROGRESS.md`
- **API Documentation:** `docs/API_ENDPOINTS.md` (old)
- **Database Schemas:** `db/schemas/`

---

## 🐛 Troubleshooting

### Build Errors
- Make sure `DATABASE_URL` is set in `.env`
- Run `npx prisma generate` if you get Prisma errors
- Check TypeScript errors with `npm run build`

### Database Connection Issues
- Verify PostgreSQL is running
- Check `DATABASE_URL` format and credentials
- Test connection with `npx prisma studio`

### Authentication Issues
- Clear browser cookies
- Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
- Verify `ADMIN_SESSION_SECRET` is set

---

## 🔄 Migration Status

This is a work-in-progress migration from a multi-repo setup to a unified Next.js app.

**Current phase:** Foundation & API (Complete)  
**Next phase:** Frontend Migration

During migration:
- Old apps still work (`npm start` for Python server)
- New Next.js app is functional but incomplete
- Both can run simultaneously on different ports

---

## 👥 Contributing

This project is under active migration. Please refer to:
- `docs/MIGRATION_PROGRESS.md` for current status
- `README-cursor.md` for migration instructions
- `docs/ARCHITECTURE-NEXT.md` for architecture decisions

---

## 📄 License

MIT

---

**Last Updated:** November 14, 2025  
**Migration Progress:** 55% (5/9 steps complete)

