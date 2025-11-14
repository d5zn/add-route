# 🔐 Railway Environment Variables Setup

## ✅ Required Environment Variables

These need to be set in Railway Dashboard for the app to work:

### 1. Strava OAuth Credentials

```bash
STRAVA_CLIENT_ID=your_actual_client_id_here
STRAVA_CLIENT_SECRET=your_actual_client_secret_here
```

**How to get these:**
1. Go to https://www.strava.com/settings/api
2. Create new application or view existing one
3. Copy "Client ID" and "Client Secret"

### 2. Environment Type

```bash
ENVIRONMENT=production
```

### 3. Port (Auto-set by Railway)

```bash
PORT=8000
# Railway automatically sets this, but you can override if needed
```

### 4. Database (Auto-set by Railway when PostgreSQL added)

```bash
DATABASE_URL=postgresql://postgres:...
# Automatically configured when you add PostgreSQL service
```

## 📋 Complete Environment Variables List

Copy these to Railway Dashboard → Your Project → Variables:

```bash
# Required
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
ENVIRONMENT=production

# Optional (Railway auto-sets these)
PORT=8000
DATABASE_URL=postgresql://...

# For custom domains (optional)
ALLOWED_ORIGINS=https://yourdomain.com,https://5zn-web.up.railway.app
```

## 🚀 How to Set on Railway

### Method 1: Railway Dashboard

1. Go to https://railway.app/project/your-project
2. Click on your service
3. Go to "Variables" tab
4. Click "+ New Variable"
5. Add each variable:
   - Name: `STRAVA_CLIENT_ID`
   - Value: `your_actual_id`
6. Click "Add"
7. Repeat for other variables

### Method 2: Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Set variables
railway variables set STRAVA_CLIENT_ID=your_id
railway variables set STRAVA_CLIENT_SECRET=your_secret
railway variables set ENVIRONMENT=production
```

### Method 3: Using .env file (for Railway CLI)

Create `railway.env`:
```bash
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
ENVIRONMENT=production
```

Upload:
```bash
railway variables set --from-file railway.env
```

## 🔍 Verify Environment Variables

### Check on Railway
```bash
railway variables
```

### Check in Logs
After deployment, logs should show:
```
☁️ Running on Railway Cloud
✅ Database: Connected
```

### Test Strava OAuth
1. Visit https://5zn-web.up.railway.app/
2. Click "Connect with Strava"
3. Should redirect to Strava OAuth (not show "YOUR_STRAVA_CLIENT_ID" error)

## 🐛 Troubleshooting

### Issue: "YOUR_STRAVA_CLIENT_ID" error

**Cause**: Environment variables not set

**Solution**:
1. Check Railway Dashboard → Variables
2. Make sure `STRAVA_CLIENT_ID` is set
3. Redeploy: `railway up`

### Issue: OAuth redirect not working

**Cause**: Incorrect redirect URI in Strava app settings

**Solution**:
1. Go to Strava API Settings
2. Set "Authorization Callback Domain" to: `5zn-web.up.railway.app`
3. Or your custom domain

### Issue: Database not connecting

**Cause**: `DATABASE_URL` not set

**Solution**:
1. Go to Railway Dashboard
2. Add PostgreSQL plugin
3. Railway will auto-set `DATABASE_URL`
4. Redeploy

## 📝 Strava App Settings

### Authorization Callback Domain
```
5zn-web.up.railway.app
```

### Authorization Callback URL (will be automatically constructed)
```
https://5zn-web.up.railway.app/oauth/
```

### Application Website
```
https://5zn-web.up.railway.app
```

## 🔒 Security Notes

- ✅ Never commit real credentials to git
- ✅ Use Railway environment variables only
- ✅ `server_config.py` is in `.gitignore`
- ✅ `config.js` only has placeholders
- ✅ Server injects real config from env vars at runtime

## ✅ Checklist

Before deploying, make sure:

- [ ] Created Strava application on https://www.strava.com/settings/api
- [ ] Set Authorization Callback Domain on Strava
- [ ] Added `STRAVA_CLIENT_ID` to Railway variables
- [ ] Added `STRAVA_CLIENT_SECRET` to Railway variables
- [ ] Set `ENVIRONMENT=production` on Railway
- [ ] Added PostgreSQL service on Railway
- [ ] Tested OAuth flow works

---

**Last Updated**: October 2025  
**Status**: Ready for deployment

