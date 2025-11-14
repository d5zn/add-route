# 🔧 Railway Deployment Fix

## 🐛 Problem
Railway healthcheck was failing with:
- "service unavailable"
- "1/1 replicas never became healthy!"

## ✅ Solutions Applied

### 1. Fixed railway.json
**Before**:
```json
{
  "build": { "builder": "DOCKERFILE" },
  "deploy": { "startCommand": "python3 server.prod.py" }
}
```

**After**:
```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": { "startCommand": "python3 server.py" }
}
```

**Changes**:
- ✅ Changed from DOCKERFILE to NIXPACKS (simpler, faster)
- ✅ Fixed command to use `server.py` (old `server.prod.py` was deleted)

### 2. Updated server.py
**Added**:
- ✅ `socketserver.TCPServer.allow_reuse_address = True` - prevents "Address already in use"
- ✅ Railway environment detection (`RAILWAY_ENVIRONMENT`)
- ✅ Better logging for Railway Cloud
- ✅ Automatic port binding from `$PORT` environment variable

### 3. Created nixpacks.toml
**Purpose**: Configure Nixpacks builder for Railway
```toml
[phases.setup]
nixPkgs = ["python311", "postgresql"]

[start]
cmd = "python3 server.py"
```

### 4. Created .railwayignore
**Purpose**: Exclude unnecessary files from deployment
- Development files (__pycache__, *.pyc)
- Documentation (*.md except README.md)
- Local data (data/, *.db)
- IDE files (.vscode/, .idea/)

### 5. Created Procfile
**Purpose**: Alternative startup method
```
web: python3 server.py
```

### 6. Updated Dockerfile
**Changed**: `CMD ["python3", "server.py"]` (was server.prod.py)

## 🚀 Deployment Steps

### Push to Railway
```bash
# Stage all changes
git add .

# Commit
git commit -m "Fix Railway deployment: update to server.py and NIXPACKS"

# Push (Railway auto-deploys)
git push origin main
```

### Railway will now:
1. ✅ Use NIXPACKS builder (faster than Docker)
2. ✅ Install Python 3.11 + PostgreSQL client
3. ✅ Install dependencies from requirements.txt
4. ✅ Start server with `python3 server.py`
5. ✅ Connect to PostgreSQL database
6. ✅ Pass healthcheck on path `/`

## 🔍 Verify Deployment

### Check Railway Logs
```bash
# Look for:
🚀 5zn Web Server (RAILWAY) running on port 8000
☁️ Running on Railway Cloud
✅ Database: Connected
```

### Test Healthcheck
```bash
curl https://5zn-web.up.railway.app/
# Should return 200 OK (index.html)
```

### Environment Variables Required
```bash
# Railway should have:
PORT=8000                    # Auto-set by Railway
DATABASE_URL=postgresql://... # Auto-set when PostgreSQL added
RAILWAY_ENVIRONMENT=production # Auto-set by Railway

# You need to set:
STRAVA_CLIENT_ID=your_id
STRAVA_CLIENT_SECRET=your_secret
ENVIRONMENT=production
```

## 📊 Expected Build Time
- NIXPACKS build: ~30-40 seconds
- Much faster than Dockerfile: ~60+ seconds

## ✅ Success Indicators

### Railway Dashboard:
- ✅ Status: Running (green)
- ✅ Healthcheck: Passing
- ✅ Logs show: "5zn Web Server (RAILWAY) running"
- ✅ Logs show: "Database: Connected"

### Application:
- ✅ https://5zn-web.up.railway.app/ loads
- ✅ OAuth redirect works
- ✅ Database queries succeed

## 🐛 If Still Failing

### Check Logs
```bash
railway logs --tail 100
```

### Common Issues:

**Issue**: Module not found
```bash
# Solution: Check requirements.txt
railway run pip list
```

**Issue**: Port binding error
```bash
# Solution: Verify $PORT is used
railway run env | grep PORT
```

**Issue**: Database connection fails
```bash
# Solution: Check DATABASE_URL
railway run env | grep DATABASE_URL
```

**Issue**: Healthcheck timeout
```bash
# Solution: Increase timeout in railway.json
"healthcheckTimeout": 200
```

## 📝 Files Changed
- ✅ `railway.json` - Fixed builder and start command
- ✅ `server.py` - Added Railway detection and port binding
- ✅ `Dockerfile` - Updated to use server.py
- ✅ `nixpacks.toml` - New file for NIXPACKS configuration
- ✅ `.railwayignore` - New file to exclude dev files
- ✅ `Procfile` - New file as fallback startup method

## 🎯 Next Steps After Fix

1. **Verify deployment**: Check Railway logs for success
2. **Test application**: Visit the URL
3. **Configure environment**: Add Strava API keys
4. **Test OAuth flow**: Connect with Strava
5. **Monitor**: Watch Railway metrics

---

**Status**: ✅ Ready to deploy  
**Last Updated**: October 2025  
**Expected Result**: Healthy deployment on Railway

