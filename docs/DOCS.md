# 📚 Documentation Index - 5zn.io

Complete documentation for the 5zn.io web application.

## 📖 Main Documentation

### [README.md](README.md) 
**The main starting point**
- Project overview
- Architecture diagrams
- Component structure
- Local development setup
- Key features
- Troubleshooting

**Read this first!**

---

## 🚀 Deployment & Infrastructure

### [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)
**Railway deployment guide**
- Step-by-step deployment process
- Environment variables
- Railway configuration
- CI/CD setup
- Production checklist

### [RAILWAY_DB_SETUP.md](RAILWAY_DB_SETUP.md)
**Database setup on Railway**
- PostgreSQL provisioning
- Schema application
- Connection configuration
- Database management

### [DATABASE_LOCATION.md](DATABASE_LOCATION.md)
**Database information & access**
- Production database (Railway PostgreSQL)
- Local development (JSON fallback)
- Connection strings
- Backup procedures
- Migration guides

---

## 🔐 Security & Configuration

### [SECURITY_SETUP.md](SECURITY_SETUP.md)
**Security best practices**
- OAuth configuration
- API key management
- Rate limiting
- Security headers
- Token handling

### [OAUTH_SETUP.md](OAUTH_SETUP.md)
**Strava OAuth integration**
- App registration on Strava
- Client ID & Secret setup
- Redirect URI configuration
- Scope permissions
- Testing OAuth flow

### [server_config.py.example](server_config.py.example)
**Server configuration template**
- Copy to `server_config.py`
- Fill in Strava credentials
- CORS settings
- Debug options

---

## 🛠️ Development Files

### [railway.json](railway.json)
**Railway service configuration**
```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": { "startCommand": "python3 server.py" }
}
```

### [requirements.txt](requirements.txt)
**Python dependencies**
- psycopg2-binary (PostgreSQL)
- Standard library only otherwise

### [database_schema.sql](database_schema.sql)
**PostgreSQL database schema**
- Athletes table definition
- Indexes
- Constraints

---

## 🎯 Quick Reference

### Structure Overview
```
5zn-web/
├── README.md                  ⭐ Start here
├── DOCS.md                    📚 This file
│
├── Deployment
│   ├── RAILWAY_DEPLOY.md     🚀 Deploy guide
│   ├── RAILWAY_DB_SETUP.md   🗄️ DB setup
│   └── DATABASE_LOCATION.md  📍 DB info
│
├── Security
│   ├── SECURITY_SETUP.md     🔒 Security
│   └── OAUTH_SETUP.md        🔑 OAuth
│
└── Configuration
    ├── server_config.py.example
    ├── railway.json
    └── requirements.txt
```

### For New Developers
1. Read [README.md](README.md) - Architecture & setup
2. Read [OAUTH_SETUP.md](OAUTH_SETUP.md) - Get Strava credentials
3. Copy `server_config.py.example` to `server_config.py`
4. Run `python3 server.py`

### For Deployment
1. Read [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)
2. Set up environment variables
3. Push to Railway
4. Monitor logs

### For Database Work
1. Read [DATABASE_LOCATION.md](DATABASE_LOCATION.md)
2. Connect to Railway PostgreSQL
3. Use admin panel for monitoring

---

## 🔗 External Resources

### Strava API
- [Strava API Documentation](https://developers.strava.com/docs/reference/)
- [OAuth Flow Guide](https://developers.strava.com/docs/authentication/)
- [Activity Streams](https://developers.strava.com/docs/reference/#api-Streams)

### Railway
- [Railway Documentation](https://docs.railway.app/)
- [Railway Dashboard](https://railway.app/)
- [PostgreSQL on Railway](https://docs.railway.app/databases/postgresql)

### Canvas API
- [MDN Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [Canvas Performance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)

---

## 📝 Document Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| README.md | ✅ Current | Oct 2025 |
| DATABASE_LOCATION.md | ✅ Current | Oct 2025 |
| RAILWAY_DEPLOY.md | 📝 To Update | - |
| OAUTH_SETUP.md | ✅ Current | - |
| SECURITY_SETUP.md | ✅ Current | - |

---

## 🆘 Getting Help

### Issues?
1. Check [README.md](README.md) Troubleshooting section
2. Check Railway logs: `railway logs`
3. Check browser console for frontend errors
4. Review [SECURITY_SETUP.md](SECURITY_SETUP.md) for auth issues

### Contact
- Create issue in repository
- Check Railway status page
- Review Strava API status

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Maintained by**: 5zn.io Team

