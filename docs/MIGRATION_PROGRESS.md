# Next.js Migration Progress Report

**Date:** November 14, 2025  
**Status:** Phase 1 Complete (Steps 1-5 of 9)

## ✅ Completed Steps

### Step 1: Analyze Current Project Structure ✅
- Created comprehensive architecture analysis document: `docs/ARCHITECTURE-NEXT.md`
- Documented current tech stack:
  - Vanilla JS frontend (PWA + Canvas)
  - React admin panel (Vite + MUI + Zustand + Konva)
  - Python backend (http.server + psycopg2)
  - PostgreSQL database
- Defined target tech stack and migration strategy

### Step 2: Initialize Next.js App ✅
- Installed Next.js 16 with TypeScript
- Set up Tailwind CSS v3 (stable version)
- Configured PostCSS and autoprefixer
- Created base folder structure:
  ```
  app/
    layout.tsx       # Root layout
    page.tsx         # Landing page
    admin/           # Admin routes
      layout.tsx
      page.tsx
      login/
        page.tsx
    app/
      page.tsx       # App preview
    globals.css
  ```
- Installed shadcn/ui dependencies:
  - class-variance-authority
  - clsx
  - tailwind-merge
  - lucide-react
  - @radix-ui/react-slot
- Created base UI components:
  - `components/ui/button.tsx`
  - `lib/utils.ts` (cn utility)
- Updated `tsconfig.json` to exclude old admin directory
- Successfully built Next.js app

### Step 3: Connect to PostgreSQL via Prisma ✅
- Installed Prisma and Prisma Client
- Created comprehensive `prisma/schema.prisma` based on existing SQL schemas:
  - **Main Schema** (01_main.sql):
    - `Athlete` model (athletes table)
    - `Token` model (tokens table)
    - `UserSession` model (user_sessions table)
  - **Admin Schema** (02_admin.sql):
    - `Club` model (clubs table)
    - `Template` model (templates table)
  - **Analytics Schema** (03_analytics.sql):
    - `AuthEvent` model (auth_events table)
    - `Download` model (downloads table)
    - `Visit` model (visits table)
- Created `lib/db.ts` with Prisma client singleton
- Generated Prisma Client successfully
- All models include proper indexes, foreign keys, and relations

### Step 4: Port Authentication & Sessions ✅
- Created `lib/auth.ts` with HMAC-based session management:
  - `verifyAdminCredentials()` - verify admin username/password
  - `createAdminSession()` - create signed session token
  - `getAdminSession()` - retrieve and validate session
  - `setAdminSession()` - set HTTP-only session cookie
  - `clearAdminSession()` - remove session cookie
  - `requireAdminAuth()` - throw if not authenticated
- Created `middleware.ts` for route protection:
  - Protects `/admin/*` routes (except `/admin/login`)
  - Protects `/api/admin/*` routes (except `/api/admin/login`)
  - Redirects unauthenticated users to login page
  - Returns 401 for API requests without valid session
- Created API endpoints:
  - `POST /api/admin/login` - admin login
  - `POST /api/admin/logout` - admin logout
  - `GET /api/admin/me` - get current session
- Updated `/admin/login` page with functional form:
  - Client-side form handling
  - Error display
  - Loading states
  - Redirect after successful login

### Step 5: Port API Endpoints ✅
Created all major API route handlers with Prisma integration:

**Public API:**
- `GET /api/templates?clubId=X` - Get published templates for a club

**Admin API (protected by auth):**
- `GET /api/admin/clubs` - List all clubs
- `POST /api/admin/clubs` - Create new club
- `GET /api/admin/clubs/[id]` - Get club by ID
- `PUT /api/admin/clubs/[id]` - Update club
- `DELETE /api/admin/clubs/[id]` - Delete club
- `GET /api/admin/templates?clubId=X` - List templates (optionally filtered)
- `POST /api/admin/templates` - Create new template
- `GET /api/admin/templates/[id]` - Get template by ID
- `PUT /api/admin/templates/[id]` - Update template
- `DELETE /api/admin/templates/[id]` - Delete template

**Strava OAuth:**
- Created `lib/strava.ts` with Strava API client:
  - `getStravaAuthUrl()` - generate OAuth URL
  - `exchangeStravaCode()` - exchange code for tokens
  - `refreshStravaToken()` - refresh access token
  - `getStravaActivities()` - fetch athlete activities
  - `getStravaActivity()` - fetch single activity
- `GET /api/strava/auth` - Redirect to Strava authorization
- `GET /api/strava/callback` - Handle OAuth callback
  - Creates/updates athlete record
  - Stores tokens securely
  - Tracks auth event for analytics

**Additional packages installed:**
- `nanoid` - for generating unique IDs

---

## 🚧 Remaining Steps

### Step 6: Migrate React Admin Panel (Pending)
**Tasks:**
- Migrate admin pages to Next.js App Router:
  - `/admin/templates` - template list
  - `/admin/templates/[id]` - template editor
  - `/admin/clubs` - club list
  - `/admin/clubs/[id]` - club detail
  - `/admin/analytics` - analytics dashboard
- Port Konva-based template editor
- Migrate Zustand stores to React hooks/context
- Replace MUI components with shadcn/ui
- Update API client to use new endpoints

### Step 7: Migrate Vanilla JS Frontend (Pending)
**Tasks:**
- Create main app pages:
  - `/app` - main application view
  - `/share/[id]` - shareable route view
- Port canvas rendering logic to React:
  - Create `RouteCanvas` client component
  - Implement polyline decoding
  - Render route with template styling
- Implement Strava integration:
  - Activity selector
  - Club selector
  - Template selector
- Port state management from `addicted-store.js`
- Add data metrics display (distance, elevation, speed, time)
- Implement photo upload and processing
- Add export/download functionality

### Step 8: Preserve and Model Templates (Pending)
**Tasks:**
- Define TypeScript types for template configs:
  - Based on `admin/src/types/template.ts`
  - Cover all element types (text, image, shape, map, etc.)
- Create Zod validation schemas:
  - Runtime validation for template configs
  - Default values for missing fields
- Ensure backward compatibility with existing templates
- Add migration scripts if needed
- Update API endpoints to validate templates

### Step 9: Clean-up & Deprecation (Pending)
**Tasks:**
- Mark old code as deprecated:
  - `server.py`
  - `admin/` directory (old Vite app)
  - Vanilla app entry files
- Update documentation:
  - Remove references to old architecture
  - Add new Next.js dev instructions
- Update deployment configuration:
  - Railway/Vercel deployment
  - Environment variables
  - Build scripts
- Test all features end-to-end
- Remove deprecated code once Next.js app is stable

---

## 📁 Current File Structure

```
5zn-web/
├── app/                           # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Global styles (Tailwind)
│   ├── admin/                    # Admin routes
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── login/
│   │       └── page.tsx
│   ├── app/
│   │   └── page.tsx              # App preview
│   └── api/                      # API Route Handlers
│       ├── templates/
│       │   └── route.ts          # GET /api/templates
│       ├── strava/
│       │   ├── auth/
│       │   │   └── route.ts      # GET /api/strava/auth
│       │   └── callback/
│       │       └── route.ts      # GET /api/strava/callback
│       └── admin/
│           ├── login/
│           │   └── route.ts      # POST /api/admin/login
│           ├── logout/
│           │   └── route.ts      # POST /api/admin/logout
│           ├── me/
│           │   └── route.ts      # GET /api/admin/me
│           ├── clubs/
│           │   ├── route.ts      # GET/POST /api/admin/clubs
│           │   └── [id]/
│           │       └── route.ts  # GET/PUT/DELETE /api/admin/clubs/[id]
│           └── templates/
│               ├── route.ts      # GET/POST /api/admin/templates
│               └── [id]/
│                   └── route.ts  # GET/PUT/DELETE /api/admin/templates/[id]
├── components/
│   └── ui/
│       └── button.tsx            # shadcn/ui Button component
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # Authentication utilities
│   ├── strava.ts                 # Strava API client
│   └── utils.ts                  # Utility functions (cn)
├── prisma/
│   └── schema.prisma             # Prisma schema (all models)
├── middleware.ts                 # Route protection middleware
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies
├── .env                          # Environment variables (local)
└── docs/
    ├── ARCHITECTURE-NEXT.md      # Architecture analysis
    └── MIGRATION_PROGRESS.md     # This file
```

---

## 🔧 Environment Variables

Required environment variables (add to `.env`):

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/addicted_db?schema=public"

# Admin Authentication
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your_secure_password"
ADMIN_SESSION_SECRET="your_secure_session_secret"

# Strava OAuth
STRAVA_CLIENT_ID="your_strava_client_id"
STRAVA_CLIENT_SECRET="your_strava_client_secret"
STRAVA_REDIRECT_URI="http://localhost:3000/api/strava/callback"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🚀 Running the New Next.js App

### Development
```bash
npm run dev:next
```
Runs Next.js dev server on `http://localhost:3000`

### Build
```bash
npm run build
```

### Production
```bash
npm run start:next
```

### Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (if needed)
npx prisma migrate dev

# Open Prisma Studio (database GUI)
npx prisma studio
```

---

## 📊 Progress Summary

**Completed:** 5/9 steps (55%)  
**Phase 1:** Foundation & API ✅ COMPLETE  
**Phase 2:** Frontend Migration 🚧 IN PROGRESS  
**Phase 3:** Clean-up & Testing 📅 PENDING

### Key Achievements
✅ Next.js app successfully initialized  
✅ Database connected via Prisma  
✅ Authentication system ported  
✅ All major API endpoints ported  
✅ Strava OAuth flow implemented  
✅ Build passing with zero TypeScript errors

### Next Priorities
1. Step 6: Migrate React Admin Panel
2. Step 7: Migrate Vanilla JS Frontend
3. Step 8: Template config validation
4. Step 9: Clean-up and production deployment

---

## ⚡ Performance Notes

- Next.js 16 with Turbopack for fast builds (~1-2s)
- Prisma for type-safe database queries
- React Server Components where possible (admin pages can be RSC)
- Client components only where needed (forms, canvas, interactive UI)
- Tailwind CSS for optimized styling (purged CSS)

---

## 🔒 Security Features

- HMAC-signed session cookies (HTTP-only, Secure in production)
- Middleware protection for admin routes
- Prisma parameterized queries (SQL injection protection)
- Environment variables for all secrets
- Access token hashing for athlete data
- CORS and rate limiting (to be added)

---

*Migration started: 2025-11-14*  
*Last updated: 2025-11-14*  
*Next.js version: 16.0.3*  
*React version: 19.2.0*  
*Prisma version: 6.19.0*

