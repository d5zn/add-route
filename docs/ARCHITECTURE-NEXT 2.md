# Next.js Migration Architecture

## Current Architecture Summary

### 1. Vanilla JS Frontend (PWA + Canvas)
**Location:** Root directory
- **Entry Point:** `index.html`
- **Main Files:**
  - `addicted-store.js` - State management (Zustand-like pattern)
  - `addicted-canvas-component.js` - Canvas rendering component
  - `app-addicted-logic.js` - Application logic
  - `polyline.js` - Polyline decoding for Strava routes
  - `config.js` - Configuration
- **Features:**
  - Strava OAuth integration
  - Route visualization with Canvas API
  - Club selection (NOT IN PARIS, HEDONISM)
  - Template selection and rendering
  - Data metrics display (distance, elevation, time, speed)
  - Photo upload and mono conversion
  - Aspect ratio switching (9:16, 4:5)
  - PWA capabilities
- **State Management:**
  - Custom store with pub/sub pattern
  - LocalStorage for persistence (selected_club, selected_template)
  - Activity data from Strava API

### 2. React Admin Panel
**Location:** `admin/` directory
- **Tech Stack:**
  - React 18 + TypeScript
  - Vite (build tool)
  - MUI + Emotion (UI components)
  - React Router (navigation)
  - Zustand + Immer (state management)
  - Konva + react-konva (canvas editor)
- **Structure:**
  - `src/pages/` - ClubOverviewPage, ClubDetailPage, TemplateEditorPage, ErrorPage
  - `src/components/` - Canvas editor, Inspector panels, Layout components
  - `src/store/` - useClubStore (clubs + templates), useEditorStore (template editing)
  - `src/services/` - API client
  - `src/types/` - TypeScript types (Club, Template, EditorElement, etc.)
- **Features:**
  - Club management (CRUD)
  - Template editor with Konva canvas
  - Inspector panels for element properties
  - Template sync and version control
  - Mock data fallback for offline development

### 3. Python Backend
**Location:** `server.py` (main file, ~2800 lines)
- **Framework:** Python http.server + psycopg2
- **Port:** 8000 (default)
- **Authentication:**
  - Admin: Username/password with HMAC-signed cookies
  - Session secret: `ADMIN_SESSION_SECRET` env var
  - Default credentials: admin/54321
- **Endpoints:**
  
  **Public API:**
  - `GET /api/templates?clubId=X` - Get templates for a club
  - `POST /api/strava/token` - Exchange Strava OAuth code for tokens
  - `GET /api/analytics/*` - Analytics data
  
  **Admin API (requires auth):**
  - `POST /route/admin/api/login` - Admin login
  - `POST /route/admin/api/logout` - Admin logout
  - `GET /route/admin/api/clubs` - List all clubs
  - `GET /route/admin/api/templates` - List all templates
  - `POST /route/admin/api/templates` - Create template
  - `GET /route/admin/api/templates/:id` - Get template by ID
  - `POST /route/admin/api/templates/:id` - Update template
  - `DELETE /route/admin/api/templates/:id` - Delete template
  - `POST /route/admin/api/check-templates` - Check template consistency
  - `POST /route/admin/api/sync-templates` - Sync templates between DB and fallback

- **Static Files:**
  - `/route/*` - Main app files
  - `/route/admin/*` - Admin panel (serves from `admin/dist/`)
  - `/oauth/` - OAuth callback page

### 4. PostgreSQL Database
**Schemas:** `db/schemas/`

**Main Schema (01_main.sql):**
- `athletes` - Strava user data
- `tokens` - Access/refresh tokens (encrypted)
- `user_sessions` - Session tracking

**Admin Schema (02_admin.sql):**
- `clubs` - Club metadata with JSONB theme
- `templates` - Template definitions with JSONB pages

**Analytics Schema (03_analytics.sql):**
- Analytics and metrics tracking

**Key Features:**
- Triggers for `updated_at` auto-update
- JSONB columns for flexible config storage
- Foreign key constraints
- Indexes for performance

---

## New Architecture Plan (Next.js)

### Target Stack

```
Framework:     Next.js 15+ (App Router)
Language:      TypeScript (strict mode)
Styling:       Tailwind CSS
UI Components: shadcn/ui
ORM:           Prisma
Database:      PostgreSQL (existing)
Auth:          Custom JWT/session (port existing HMAC logic)
Deployment:    Vercel / Railway compatible
```

### Folder Structure

```
5zn-web/
├── app/
│   ├── (public)/                    # Public routes
│   │   ├── page.tsx                 # Landing page
│   │   ├── app/
│   │   │   └── page.tsx             # Main app (route visualization)
│   │   └── share/[id]/
│   │       └── page.tsx             # Shareable route view
│   ├── admin/                       # Protected admin routes
│   │   ├── layout.tsx               # Admin shell
│   │   ├── page.tsx                 # Admin dashboard
│   │   ├── login/
│   │   │   └── page.tsx             # Admin login
│   │   ├── clubs/
│   │   │   ├── page.tsx             # Club list
│   │   │   └── [id]/page.tsx        # Club detail
│   │   ├── templates/
│   │   │   ├── page.tsx             # Template list
│   │   │   └── [id]/page.tsx        # Template editor
│   │   └── analytics/
│   │       └── page.tsx             # Analytics dashboard
│   ├── api/                         # API Route Handlers
│   │   ├── templates/
│   │   │   └── route.ts             # GET /api/templates
│   │   ├── strava/
│   │   │   ├── auth/route.ts        # Strava OAuth start
│   │   │   ├── callback/route.ts    # OAuth callback
│   │   │   └── token/route.ts       # POST /api/strava/token
│   │   ├── analytics/
│   │   │   └── [...slug]/route.ts   # Analytics endpoints
│   │   └── admin/
│   │       ├── login/route.ts       # POST /api/admin/login
│   │       ├── logout/route.ts      # POST /api/admin/logout
│   │       ├── clubs/
│   │       │   ├── route.ts         # GET/POST /api/admin/clubs
│   │       │   └── [id]/route.ts    # GET/PUT/DELETE /api/admin/clubs/:id
│   │       └── templates/
│   │           ├── route.ts         # GET/POST /api/admin/templates
│   │           ├── [id]/route.ts    # GET/PUT/DELETE /api/admin/templates/:id
│   │           ├── sync/route.ts    # POST /api/admin/templates/sync
│   │           └── check/route.ts   # POST /api/admin/templates/check
│   ├── layout.tsx                   # Root layout
│   └── middleware.ts                # Auth middleware
├── prisma/
│   └── schema.prisma                # Prisma schema (mirrors existing DB)
├── src/
│   ├── lib/
│   │   ├── db.ts                    # Prisma client singleton
│   │   ├── auth.ts                  # Auth helpers (session, cookies, HMAC)
│   │   ├── strava.ts                # Strava API client
│   │   └── validation.ts            # Zod schemas
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── canvas/
│   │   │   ├── RouteCanvas.tsx      # Client component for route rendering
│   │   │   └── TemplateEditor.tsx   # Konva-based template editor
│   │   ├── admin/
│   │   │   ├── ClubForm.tsx
│   │   │   ├── TemplateList.tsx
│   │   │   └── ...
│   │   └── app/
│   │       ├── ActivitySelector.tsx
│   │       ├── ClubSelector.tsx
│   │       └── TemplateSelector.tsx
│   ├── hooks/
│   │   ├── useStrava.ts             # Strava integration hooks
│   │   └── useTemplate.ts           # Template state hooks
│   └── types/
│       ├── strava.ts                # Strava API types
│       ├── template.ts              # Template config types
│       └── index.ts
├── public/
│   ├── assets/                      # Static assets
│   └── ...
└── package.json
```

### Migration Strategy

#### Phase 1: Foundation
1. ✅ Analyze current structure (DONE - this document)
2. Initialize Next.js app with TypeScript
3. Set up Tailwind CSS and shadcn/ui
4. Create base layouts

#### Phase 2: Database & Auth
1. Install Prisma and connect to PostgreSQL
2. Generate Prisma schema from existing DB
3. Port HMAC session logic to Next.js middleware
4. Implement admin login flow

#### Phase 3: API Migration
1. Port all public API endpoints
2. Port all admin API endpoints
3. Add proper error handling and validation
4. Test API compatibility with existing clients

#### Phase 4: Admin Panel Migration
1. Migrate admin pages to Next.js App Router
2. Port Zustand stores to React hooks/context
3. Integrate Konva template editor
4. Replace MUI with shadcn/ui (gradual)

#### Phase 5: Frontend Migration
1. Create public-facing pages
2. Port canvas rendering logic to React components
3. Implement Strava OAuth flow
4. Migrate activity visualization
5. Add PWA support (optional)

#### Phase 6: Template Config
1. Define TypeScript types for template configs
2. Add Zod validation schemas
3. Ensure backward compatibility with existing templates
4. Add migration scripts if needed

#### Phase 7: Testing & Cleanup
1. Test all features end-to-end
2. Mark old code as deprecated
3. Update documentation
4. Deploy to production

---

## Key Technical Decisions

### 1. Prisma Schema Design
- Mirror existing PostgreSQL tables exactly
- Use `Prisma.JsonValue` for JSONB columns (theme, pages)
- Keep all existing column names and types
- No breaking changes to database schema

### 2. Authentication Strategy
- Port existing HMAC-based session logic
- Use HTTP-only cookies (same as Python version)
- Middleware protection for `/admin` routes
- Environment variables: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`

### 3. Template Config Validation
- Define strict TypeScript types based on `admin/src/types/template.ts`
- Use Zod for runtime validation
- Apply defaults for missing fields in old templates
- Single source of truth for config shape

### 4. Canvas Rendering
- Keep Canvas API for route rendering (not WebGL)
- Wrap in React client components with `useEffect`
- Reuse existing polyline decoding logic
- Maintain visual parity with current app

### 5. State Management
- Use React Server Components where possible
- Client state via React hooks (`useState`, `useReducer`)
- Optional: Zustand for complex admin state (if needed)
- No global store for public app (prefer RSC + URL state)

### 6. Deployment
- Environment variables for all secrets
- Build static admin panel assets
- Node.js runtime for API routes
- Compatible with Vercel, Railway, or Docker

---

## Risk Mitigation

### 1. Database Compatibility
**Risk:** Breaking existing data or queries
**Mitigation:**
- Use `prisma db pull` to introspect existing schema
- Test all queries against real database
- Keep SQL migration scripts as backup

### 2. Template Format Changes
**Risk:** Breaking existing templates
**Mitigation:**
- Define strict TypeScript types first
- Add backward compatibility layer
- Test with real production templates
- Provide migration script if needed

### 3. Strava OAuth Flow
**Risk:** Breaking user authentication
**Mitigation:**
- Test OAuth flow thoroughly
- Keep existing callback URLs
- Maintain token encryption/storage format

### 4. Canvas Rendering Differences
**Risk:** Visual output doesn't match original
**Mitigation:**
- Port canvas logic exactly as-is first
- Side-by-side visual comparison tests
- Gradual refactoring after initial port

### 5. Performance
**Risk:** Next.js app slower than Python + Vanilla JS
**Mitigation:**
- Use React Server Components for server-side rendering
- Code-split client components
- Optimize images and assets
- Profile and optimize hot paths

---

## Success Criteria

- ✅ All existing features work in Next.js app
- ✅ Database schema unchanged
- ✅ All API endpoints replicated
- ✅ Admin panel fully functional
- ✅ Route visualization matches original
- ✅ Strava OAuth flow works
- ✅ Template editor fully functional
- ✅ Build passes TypeScript strict mode
- ✅ Deployable to Vercel/Railway
- ✅ Performance equivalent or better

---

## Timeline Estimate

- **Phase 1-2 (Foundation + DB):** 1-2 days
- **Phase 3 (API Migration):** 2-3 days
- **Phase 4 (Admin Panel):** 3-4 days
- **Phase 5 (Frontend):** 3-4 days
- **Phase 6 (Template Config):** 1-2 days
- **Phase 7 (Testing):** 2-3 days

**Total:** ~2-3 weeks for full migration

---

## Next Steps

1. ✅ Create this architecture document
2. Initialize Next.js app (Step 2)
3. Set up Prisma and connect to database (Step 3)
4. Begin API endpoint migration (Steps 4-5)

---

*Document created: 2025-11-14*
*Last updated: 2025-11-14*

