
System / Project Task for Cursor

You are an AI coding assistant working inside a monorepo for the 5zn / addicted / Add Route project.

The current project consists of three separate parts:
	1.	A Vanilla JS web app (PWA + Canvas) for visualizing Strava routes.
	2.	A separate React admin panel (TypeScript + Vite + MUI + Konva) for managing clubs and templates.
	3.	A Python HTTP server (http.server + psycopg2) that serves static files and exposes REST API endpoints backed by PostgreSQL.

The goal is to gradually migrate EVERYTHING to a single Next.js app (frontend + admin + API) while reusing the existing PostgreSQL database schema as much as possible.

⸻

🎯 High-level goals
	1.	Replace the Python backend with Next.js App Router route handlers (or API routes).
	2.	Merge the Vanilla JS frontend and the React admin panel into one Next.js project:
	•	Public app for athletes and sharing routes.
	•	/admin area for clubs, templates, analytics, etc.
	3.	Keep using PostgreSQL as the database.
	4.	Preserve existing functionality:
	•	Strava OAuth flow and token storage.
	•	Clubs, templates, routes, analytics.
	•	Canvas/route rendering (can be progressively refactored).

You should work incrementally and keep the code clean, typed, and modular.

⸻

🧱 Target tech stack

Use this stack for the new unified app:
	•	Framework: Next.js (latest, App Router, TypeScript)
	•	Language: TypeScript (strict mode ON)
	•	Styling: Tailwind CSS
	•	UI: shadcn/ui for admin and shared components
	•	State management: React Server Components where possible, plus client components with React hooks
	•	DB access: Prisma ORM with PostgreSQL
	•	Auth: NextAuth or a simple custom JWT/cookie auth (you can re-use existing session logic if reasonable)
	•	HTTP: Next.js Route Handlers under app/api/*
	•	Deployment: compatible with Vercel / Railway (Node runtime)

⸻

📁 Step 1 – Analyze current project structure
	1.	Inspect the repo and understand:
	•	Where the Vanilla JS app lives (HTML entry point, main JS, canvas logic, store).
	•	Where the React admin app lives (admin/ folder, Vite config, entry point, routes, stores with Zustand).
	•	Where the Python server is (server.py, helpers, session/auth logic, Strava endpoints).
	•	Where the SQL schemas are (db/schemas/*.sql).
	2.	Create or update a docs/ARCHITECTURE-NEXT.md with:
	•	A short summary of the current architecture (Vanilla + React + Python).
	•	A short plan of the new architecture (Next.js + Prisma + unified app).

Do not delete old code yet. We will migrate step by step.

⸻

🧬 Step 2 – Initialize the Next.js App

Create a new Next.js App Router app inside the repo (or treat the current root as the Next.js root):
	•	Enable TypeScript.
	•	Add Tailwind CSS.
	•	Install shadcn/ui and generate a base UI setup.
	•	Add a base layout:
	•	/ – simple landing page “Add Route / 5zn”.
	•	/admin – placeholder page that says “Admin panel (Next.js migration in progress)”.

Make sure the dev server runs and builds successfully.

⸻

🗄️ Step 3 – Connect to PostgreSQL via Prisma
	1.	Install Prisma and set it up for PostgreSQL.
	2.	Create prisma/schema.prisma that reflects the existing DB tables:
Use the existing SQL files in db/schemas/ as the source of truth:
	•	athletes
	•	tokens
	•	user_sessions
	•	clubs
	•	templates
	•	analytics
	•	any other relevant tables
You must not randomly change the schema. Model the existing tables in Prisma as accurately as possible.
	3.	Run prisma db pull if possible (if we have DB access) or manually define models and then run:

npx prisma generate

	4.	Create src/lib/db.ts (or app/lib/db.ts) that exports a singleton Prisma client.

⸻

🔐 Step 4 – Port authentication & sessions

Currently, the Python server implements:
	•	Session management (cookies + HMAC)
	•	Admin user auth
	•	Possibly athlete login/state

For now:
	1.	Implement a simple admin login flow in Next.js:
	•	Route: app/admin/login/page.tsx
	•	A simple form with username + password (reuse ADMIN_USERNAME and ADMIN_PASSWORD from environment if needed).
	•	On successful login:
	•	Set a secure, HTTP-only cookie with a signed session token.
	•	Redirect to /admin.
	2.	Implement middleware to protect admin routes:
	•	middleware.ts:
	•	For paths starting with /admin, check the session cookie.
	•	If not authenticated → redirect to /admin/login.

You can reuse the existing Python HMAC logic for signing if it’s simple to port, or switch to a new Node-based solution (e.g., crypto + HMAC-SHA256). The important part is:
	•	Admin-only routes must be protected.
	•	The mechanism should be clean and easy to extend later.

⸻

🌐 Step 5 – Port API endpoints from Python to Next.js

The Python server exposes various endpoints, such as:
	•	Public:
	•	GET /api/templates?clubId=X
	•	POST /api/strava/token
	•	GET /api/analytics/...
	•	Admin:
	•	GET /route/admin/api/clubs
	•	GET /route/admin/api/templates
	•	POST /route/admin/api/templates/:id
	•	DELETE /route/admin/api/templates/:id
	•	GET /route/admin/api/check-templates
	•	POST /route/admin/api/sync-templates

Task:
	1.	For each endpoint, locate its implementation in server.py and related modules.
	2.	Recreate them as Next.js Route Handlers under app/api/...:
Example structure:

app/
  api/
    templates/
      route.ts          // GET /api/templates
    strava/
      token/
        route.ts        // POST /api/strava/token
    admin/
      clubs/
        route.ts        // GET /api/admin/clubs
      templates/
        route.ts        // GET/POST /api/admin/templates
      templates/
        [id]/
          route.ts      // GET/POST/DELETE /api/admin/templates/:id


	3.	Use Prisma instead of direct psycopg2 queries.
	4.	Reproduce the same logic and validation as the Python code.
	5.	Ensure that admin routes validate the session and return 401/403 when needed.

Do not implement Strava OAuth from scratch yet; for now just replicate the existing flow.

⸻

🧩 Step 6 – Migrate the React Admin Panel into /admin

The current admin is a separate React + Vite app with:
	•	MUI + Emotion
	•	Zustand + Immer
	•	Konva + react-konva
	•	React Router

Goal: Move this functionality into the Next.js app under /admin.

Steps:
	1.	Create an admin layout:
	•	app/admin/layout.tsx – shared shell (sidebar/topbar, etc.).
	•	app/admin/page.tsx – redirect to a default section (e.g. /admin/templates).
	2.	Create pages for key sections:
	•	/admin/templates – list templates.
	•	/admin/templates/[id] – edit template.
	•	/admin/clubs – list clubs.
	•	/admin/analytics – basic analytics view.
	3.	Copy relevant React components and logic from the admin/ folder into the Next.js project:
	•	Canvas editor: Konva-based template editor.
	•	Stores (Zustand) → migrate as client-side hooks.
	•	Utils and helpers.
	4.	Gradually replace MUI with shadcn/ui (optional but preferable):
	•	Tables, forms, buttons, dialogs → shadcn/ui.
	•	Color pickers and Konva canvas still fine to keep as-is.
	5.	Update data fetching:
	•	Replace direct HTTP calls to the Python backend with fetch calls to the new Next.js API routes under /api/admin/*.

Make sure the admin uses TypeScript everywhere and that types match the Prisma models.

⸻

🧮 Step 7 – Migrate the Vanilla JS frontend into Next.js

The current Vanilla app uses:
	•	HTML + CSS
	•	Vanilla JS modules
	•	Custom store
	•	Canvas components
	•	Strava OAuth and REST calls
	•	PWA features

Target:
	•	Build the public experience as Next.js pages under / and maybe /app or /routes.
	•	Move the canvas rendering logic into React components (client components) that can still use the Canvas API.
	•	Keep the existing visual behavior as close as possible initially.

Steps:
	1.	Identify the main user flows and screens in the Vanilla app:
	•	Connect Strava
	•	Select an activity
	•	Render a route using a template
	•	Export/share visuals
	2.	For each flow, create Next.js routes:
	•	/ – landing.
	•	/app – main application (e.g., a “workspace” to pick a club/template and generate a visual).
	•	/share/[id] – publicly shareable route/template output (or /r/[slug]).
	3.	Wrap existing canvas logic into a React component:
	•	Create a RouteCanvas component as a client component that:
	•	Accepts props like polyline, templateConfig, colors, etc.
	•	Internally uses useEffect to draw on <canvas>.
	4.	Replace direct DOM/querySelector usage with React refs and state.
	5.	Replace direct calls to old /api/... endpoints with calls to the new Next.js route handlers.
	6.	If PWA is still desired:
	•	Add the relevant manifest and service worker in the Next.js app (this can be done in a later phase).

⸻

📊 Step 8 – Preserve and model templates & configs

The templates table stores JSONB configs for the layout, colors, and styles.
	1.	Define a type-safe config model:
	•	Create src/lib/templateConfig.ts with:
	•	A TypeScript type TemplateConfig.
	•	A runtime zod schema for validation.
	•	Default config values.
	2.	On the backend (route handlers) and in the admin UI:
	•	Always validate template configs against this schema.
	•	If an old template is missing some fields, apply defaults.
	3.	Use the same TemplateConfig type:
	•	In admin editor.
	•	In the public renderer.

This will help keep templates stable during future changes.

⸻

⚙️ Step 9 – Clean-up & deprecation

After the Next.js app fully replicates the behavior of:
	•	Python API,
	•	Vanilla JS UI,
	•	React admin (Vite),

you can:
	1.	Mark the old code as deprecated:
	•	server.py
	•	admin/ folder (old Vite app)
	•	Vanilla app entry files.
	2.	Once the Next.js app is stable in production:
	•	Remove old dev scripts.
	•	Update docs to describe the new architecture only.

⸻

✅ Coding style & expectations
	•	Use TypeScript strict mode.
	•	Use Prisma models as single source of truth for DB schema (mirroring the existing SQL).
	•	Prefer React Server Components when possible, but Canvas/editor parts should be client components.
	•	Admin pages should be protected via middleware/session checks.
	•	Follow clean folder structure:

app/
  (public)/
    page.tsx
    share/[id]/page.tsx
  (admin)/
    admin/
      layout.tsx
      page.tsx
      templates/
        page.tsx
        [id]/page.tsx
      clubs/
        page.tsx
      analytics/
        page.tsx
  api/
    ...
prisma/
  schema.prisma
src/
  lib/
    db.ts
    auth.ts
    templateConfig.ts
    stravaClient.ts
  components/
    RouteCanvas.tsx
    admin/
      ...



Work step by step, keeping the app buildable and testable after each change.
