# 🚀 Deployment Checklist

Complete checklist before pushing to Railway production.

## ✅ Pre-Deployment

### 1. Strava OAuth Setup
- [ ] Created app on https://www.strava.com/settings/api
- [ ] Noted down Client ID
- [ ] Noted down Client Secret
- [ ] Set Authorization Callback Domain to Railway URL

### 2. Railway Project
- [ ] Created project on https://railway.app
- [ ] Added PostgreSQL service
- [ ] Connected GitHub repository

### 3. Environment Variables
- [ ] Set `STRAVA_CLIENT_ID` on Railway
- [ ] Set `STRAVA_CLIENT_SECRET` on Railway  
- [ ] Set `ENVIRONMENT=production` on Railway
- [ ] Verified `DATABASE_URL` is auto-set by PostgreSQL service

### 4. Code Review
- [ ] All files use `server.py` (not server.prod.py)
- [ ] `railway.json` uses NIXPACKS builder
- [ ] `railway.json` has correct start command: `python3 server.py`
- [ ] `config.js` has placeholders only (no real credentials)
- [ ] `.gitignore` includes `server_config.py`, `data/`, `.env`

## 🔄 Deployment Steps

### Step 1: Commit Changes
```bash
git status
git add .
git commit -m "Production ready: Railway config + env injection"
```

### Step 2: Push to GitHub
```bash
git push origin main
```

### Step 3: Railway Auto-Deploy
Railway will automatically:
- ✅ Detect push
- ✅ Build with NIXPACKS
- ✅ Install dependencies
- ✅ Start `python3 server.py`
- ✅ Run healthcheck

### Step 4: Monitor Logs
```bash
railway logs --tail 50
```

Look for:
```
🚀 5zn Web Server (RAILWAY) running on port 8000
☁️ Running on Railway Cloud
✅ Database: Connected
```

## 🧪 Post-Deployment Testing

### 1. Health Check
```bash
curl https://5zn-web.up.railway.app/
# Should return 200 OK
```

### 2. Config Injection
```bash
curl -s https://5zn-web.up.railway.app/ | grep "CLIENT_ID"
# Should show real ID, not "YOUR_STRAVA_CLIENT_ID"
```

### 3. Strava OAuth Flow
- [ ] Visit https://5zn-web.up.railway.app/
- [ ] Click "Connect with Strava"
- [ ] Redirects to Strava OAuth page
- [ ] After authorization, redirects back
- [ ] Token is stored
- [ ] Workouts load

### 4. Database Connection
- [ ] Visit https://5zn-web.up.railway.app/admin_panel.html
- [ ] Check users table loads
- [ ] Connect with Strava
- [ ] Verify user appears in admin panel

### 5. Canvas Rendering
- [ ] Select a workout
- [ ] Upload background photo
- [ ] Canvas renders at 1080x1920
- [ ] Export works

## ❌ Rollback Plan

If deployment fails:

### Option 1: Redeploy Previous Version
```bash
railway rollback
```

### Option 2: Fix and Redeploy
```bash
# Fix issue locally
git commit -m "Fix: [describe fix]"
git push origin main
```

### Option 3: Check Logs
```bash
railway logs --tail 100
# Look for errors
```

## 🔍 Common Issues

### Issue: Healthcheck Failed
**Check**: 
- Railway logs for Python errors
- `server.py` starts correctly
- Port binding to `$PORT`

**Fix**:
```bash
railway logs | grep "error"
```

### Issue: "YOUR_STRAVA_CLIENT_ID" error
**Check**: 
- Environment variables on Railway
- Config injection in server.py

**Fix**:
```bash
railway variables
# Make sure STRAVA_CLIENT_ID is set
railway up --detach
```

### Issue: Database Connection Failed
**Check**: 
- PostgreSQL service is running
- `DATABASE_URL` is set

**Fix**:
- Add PostgreSQL service if missing
- Verify connection string in Railway

### Issue: OAuth Redirect Not Working
**Check**: 
- Strava app settings
- Authorization Callback Domain

**Fix**:
- Update Strava settings to match Railway URL
- Verify `REDIRECT_URI` in config

## ✅ Success Criteria

Deployment is successful when:

- ✅ Railway status shows "Running" (green)
- ✅ Healthcheck passes
- ✅ Logs show no errors
- ✅ Homepage loads
- ✅ Strava OAuth works
- ✅ Database queries succeed
- ✅ Canvas renders correctly
- ✅ Admin panel shows users

## 📊 Monitoring

### Check Status
```bash
railway status
```

### View Metrics
- Go to Railway Dashboard
- Click on service
- View "Metrics" tab
- Check:
  - CPU usage
  - Memory usage
  - Request count
  - Error rate

### Set Up Alerts (Optional)
- Railway Dashboard → Settings → Notifications
- Add webhook for deployment failures
- Add email for healthcheck failures

## 🎯 Performance Targets

- Response time: < 500ms
- Uptime: > 99%
- Error rate: < 1%
- Build time: < 60s

---

**Deployment Date**: ____________  
**Deployed By**: ____________  
**Git Commit**: ____________  
**Railway URL**: https://5zn-web.up.railway.app/  

**Status**: ⬜ Ready | ⬜ Deployed | ⬜ Verified | ⬜ Production

