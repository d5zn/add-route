# Deprecated Code

This document lists code that has been migrated to Next.js and is now deprecated.

## ⚠️ Deprecated Files

### Backend
- **`server.py`** - Python HTTP server
  - **Status:** Deprecated (migrated to Next.js API routes)
  - **Replacement:** Next.js Route Handlers in `app/api/`
  - **Removal Date:** TBD (after full migration verification)

### Frontend
- **`index.html`** - Vanilla JS app entry point
  - **Status:** Deprecated (migrated to Next.js)
  - **Replacement:** `app/app/page.tsx`
  - **Removal Date:** TBD

- **`addicted-store.js`** - Vanilla JS state management
  - **Status:** Deprecated (migrated to Zustand stores)
  - **Replacement:** `store/useAppStore.ts`
  - **Removal Date:** TBD

- **`addicted-canvas-component.js`** - Canvas rendering component
  - **Status:** Deprecated (migrated to React)
  - **Replacement:** `components/app/RouteCanvas.tsx`
  - **Removal Date:** TBD

- **`app-addicted-logic.js`** - Main application logic
  - **Status:** Deprecated (migrated to Next.js pages)
  - **Replacement:** `app/app/page.tsx` and components
  - **Removal Date:** TBD

- **`polyline.js`** - Polyline decoder
  - **Status:** Deprecated (migrated to TypeScript)
  - **Replacement:** `lib/polyline.ts`
  - **Removal Date:** TBD

### Admin Panel
- **`admin/`** directory - Old React + Vite admin panel
  - **Status:** Deprecated (migrated to Next.js)
  - **Replacement:** `app/admin/` pages
  - **Removal Date:** TBD
  - **Note:** Keep for reference during migration, will be removed after full verification

### Static Files
- **`activity.html`**, **`landing.html`**, **`information.html`** - Old HTML pages
  - **Status:** Deprecated
  - **Replacement:** Next.js pages
  - **Removal Date:** TBD

## Migration Status

✅ **Migrated:**
- API endpoints → Next.js Route Handlers
- Admin panel → Next.js `/admin` routes
- Frontend app → Next.js `/app` route
- Database access → Prisma ORM
- Authentication → Next.js middleware + cookies

🚧 **In Progress:**
- Full Konva canvas editor integration
- Advanced template features

📅 **Planned:**
- Remove deprecated files after production verification
- Archive old code in separate branch

## Notes

- Old code is kept for reference during migration
- Do not modify deprecated files
- All new development should use Next.js structure
- See `docs/MIGRATION_PROGRESS.md` for detailed status

