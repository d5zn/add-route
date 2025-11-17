# Railway Deployment Guide

This guide explains how to deploy the Next.js application to Railway via GitHub.

## Prerequisites

1. Railway account (sign up at [railway.app](https://railway.app))
2. GitHub repository with the code
3. PostgreSQL database (Railway provides this)

## Step 1: Connect GitHub Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select the repository: `d5zn/add-route` (or your fork)
6. Railway will automatically detect it's a Next.js project

## Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will create a PostgreSQL database
4. Note the connection string (you'll need it for `DATABASE_URL`)

## Step 3: Configure Environment Variables

Go to your service → **Variables** tab and add:

### Required Variables:

```bash
# Database (from PostgreSQL service)
DATABASE_URL=postgresql://user:password@host:port/database?schema=public

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
ADMIN_SESSION_SECRET=your_secure_session_secret_here

# Strava OAuth
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
STRAVA_REDIRECT_URI=https://your-app.railway.app/api/strava/callback

# Next.js
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
NODE_ENV=production
```

### How to get values:

1. **DATABASE_URL**: 
   - Go to PostgreSQL service → **Variables** tab
   - Copy `DATABASE_URL` or `POSTGRES_URL`
   - Or use the connection string from PostgreSQL service

2. **ADMIN_USERNAME / ADMIN_PASSWORD**:
   - Choose secure credentials for admin access
   - Use strong password (min 12 characters)

3. **ADMIN_SESSION_SECRET**:
   - Generate a random secret: `openssl rand -hex 32`
   - Or use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

4. **STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET**:
   - Get from [Strava API Settings](https://www.strava.com/settings/api)
   - Create application if needed

5. **STRAVA_REDIRECT_URI**:
   - Use your Railway app URL: `https://your-app.railway.app/api/strava/callback`
   - Update this in Strava API settings too

6. **NEXT_PUBLIC_APP_URL**:
   - Your Railway app URL (Railway provides this after first deploy)

## Step 4: Run Database Migrations

After first deployment, run migrations:

### Option 1: Via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migrations
railway run npx prisma migrate deploy
```

### Option 2: Via Railway Dashboard

1. Go to your service
2. Click **"Deployments"** → **"View Logs"**
3. Check if migrations ran automatically (they should via `postinstall` script)

### Option 3: Manual SQL

If migrations fail, you can run SQL manually:

1. Go to PostgreSQL service → **Data** tab
2. Run SQL from `db/schemas/*.sql` files in order:
   - `01_main.sql`
   - `02_admin.sql`
   - `03_analytics.sql`
   - `04_init_clubs.sql` (if exists)

## Step 5: Verify Deployment

1. Railway will automatically deploy on every push to main branch
2. Check deployment status in Railway dashboard
3. Visit your app URL (provided by Railway)
4. Test:
   - Landing page: `/`
   - Admin login: `/admin/login`
   - App: `/app`

## Step 6: Custom Domain (Optional)

1. Go to service → **Settings** → **Domains**
2. Click **"Generate Domain"** or **"Custom Domain"**
3. Update `NEXT_PUBLIC_APP_URL` and `STRAVA_REDIRECT_URI` with new domain

## Troubleshooting

### Build Fails

**Error:** `Module not found` or TypeScript errors
- **Solution:** Check that all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error:** Prisma client not generated
- **Solution:** Railway should run `prisma generate` automatically
- Check build logs for errors
- Manually run: `railway run npx prisma generate`

### Database Connection Fails

**Error:** `Can't reach database server`
- **Solution:** 
  - Verify `DATABASE_URL` is correct
  - Check PostgreSQL service is running
  - Ensure database is in same Railway project

### Environment Variables Not Working

**Error:** Variables undefined
- **Solution:**
  - Check variable names are exact (case-sensitive)
  - Redeploy after adding variables
  - Check Railway logs for errors

### Migration Errors

**Error:** Migration fails
- **Solution:**
  - Check database schema matches Prisma schema
  - Run migrations manually via Railway CLI
  - Or apply SQL files directly

## Railway Configuration Files

- **`railway.json`** - Railway deployment config
- **`nixpacks.toml`** - Build configuration
- **`Procfile`** - Process definition
- **`.railwayignore`** - Files to exclude from deployment

## Continuous Deployment

Railway automatically deploys when you push to:
- `main` branch (production)
- Other branches (preview deployments)

To disable auto-deploy:
1. Go to service → **Settings**
2. Toggle **"Auto Deploy"** off

## Monitoring

- **Logs:** Service → **Deployments** → **View Logs**
- **Metrics:** Service → **Metrics** tab
- **Health Checks:** Railway checks `/` endpoint automatically

## Rollback

1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **"Redeploy"**

## Cost Optimization

- Railway free tier includes:
  - $5/month credit
  - 500 hours of usage
  - 1GB storage
- Monitor usage in **Usage** tab
- Consider upgrading if needed

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: GitHub Issues

---

**Last Updated:** November 14, 2025

