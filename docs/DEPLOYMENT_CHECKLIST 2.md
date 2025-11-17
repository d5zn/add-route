# Deployment Checklist

Use this checklist before deploying to Railway.

## Pre-Deployment

### ✅ Code Quality
- [ ] All TypeScript errors resolved
- [ ] Build passes: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] No console errors in development

### ✅ Environment Variables
- [ ] All required variables documented in `railway.env.example`
- [ ] `.env` file not committed (in `.gitignore`)
- [ ] Production secrets are secure

### ✅ Database
- [ ] Prisma schema matches database structure
- [ ] Migrations are up to date
- [ ] `prisma generate` runs successfully
- [ ] Database connection tested locally

### ✅ Dependencies
- [ ] All dependencies in `package.json`
- [ ] No missing peer dependencies
- [ ] Production dependencies only (no dev deps in runtime)

### ✅ Configuration Files
- [ ] `railway.json` configured correctly
- [ ] `nixpacks.toml` has correct build steps
- [ ] `Procfile` has correct start command
- [ ] `.railwayignore` excludes unnecessary files

## Railway Setup

### ✅ Project Configuration
- [ ] Railway project created
- [ ] GitHub repository connected
- [ ] Auto-deploy enabled (if desired)

### ✅ Database Service
- [ ] PostgreSQL service added
- [ ] Database URL copied
- [ ] Connection tested

### ✅ Environment Variables
- [ ] `DATABASE_URL` set (from PostgreSQL service)
- [ ] `ADMIN_USERNAME` set
- [ ] `ADMIN_PASSWORD` set (strong password)
- [ ] `ADMIN_SESSION_SECRET` set (random secret)
- [ ] `STRAVA_CLIENT_ID` set
- [ ] `STRAVA_CLIENT_SECRET` set
- [ ] `STRAVA_REDIRECT_URI` set (Railway app URL)
- [ ] `NEXT_PUBLIC_APP_URL` set (Railway app URL)
- [ ] `NODE_ENV=production` set

### ✅ Build & Deploy
- [ ] First deployment successful
- [ ] Build logs show no errors
- [ ] Prisma Client generated successfully
- [ ] Database migrations applied

## Post-Deployment

### ✅ Functionality Tests
- [ ] Landing page loads: `/`
- [ ] Admin login works: `/admin/login`
- [ ] Admin dashboard accessible: `/admin/clubs`
- [ ] App page loads: `/app`
- [ ] Strava OAuth flow works
- [ ] API endpoints respond correctly

### ✅ Database
- [ ] Tables created successfully
- [ ] Can create clubs via admin
- [ ] Can create templates via admin
- [ ] Data persists after restart

### ✅ Security
- [ ] Admin routes protected
- [ ] Session cookies work
- [ ] HTTPS enabled (Railway default)
- [ ] Environment variables not exposed

### ✅ Performance
- [ ] Page load times acceptable
- [ ] API response times good
- [ ] No memory leaks
- [ ] Build size reasonable

## Monitoring

### ✅ Logs
- [ ] Can view logs in Railway dashboard
- [ ] No critical errors in logs
- [ ] Warnings are acceptable

### ✅ Metrics
- [ ] CPU usage normal
- [ ] Memory usage normal
- [ ] Network traffic reasonable

## Rollback Plan

- [ ] Know how to rollback (Railway dashboard → Deployments)
- [ ] Previous working deployment identified
- [ ] Database backup strategy in place

## Documentation

- [ ] Deployment guide updated
- [ ] Environment variables documented
- [ ] Troubleshooting guide available
- [ ] Team notified of deployment

---

**Checklist completed by:** _______________  
**Date:** _______________  
**Deployment URL:** _______________

