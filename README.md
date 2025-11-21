# Add Route / 5zn / addicted

Web application for visualizing and sharing Strava cycling routes.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### Production Build

```bash
# Build
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
5zn-web/
├── app/                    # Next.js App Router
│   ├── api/               # API Route Handlers
│   ├── admin/             # Admin panel
│   └── app/               # Main application
├── components/            # React components
├── lib/                   # Utilities & helpers
├── prisma/               # Database schema
├── store/                # Zustand stores
├── types/                # TypeScript types
└── docs/                 # Documentation
```

## 🗄️ Database

### Setup

1. Create PostgreSQL database
2. Set `DATABASE_URL` in `.env`
3. Run migrations:

```bash
npx prisma migrate dev
# or for production
npx prisma migrate deploy
```

## 🔐 Environment Variables

Create `.env` file:

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

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI:** shadcn/ui
- **Database:** PostgreSQL + Prisma
- **State:** Zustand
- **Validation:** Zod

## 📝 Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

## 📄 License

MIT
