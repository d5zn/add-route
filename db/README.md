# Database Schemas

This directory contains the PostgreSQL database schemas for the 5zn.io project.

## Schema Files

The schemas are numbered to indicate their dependency order:

1. **01_main.sql** - Core schema for athletes, tokens, and sessions
   - Tables: `athletes`, `tokens`, `user_sessions`
   - Used by the main Strava integration app

2. **02_admin.sql** - Admin panel schema for clubs and templates
   - Tables: `clubs`, `templates`
   - Used by the React admin dashboard

3. **03_analytics.sql** - Analytics tracking schema
   - Tables: `auth_events`, `downloads`, `visits`
   - Used for tracking user engagement and statistics

## Setup

To set up the database, run the schemas in order:

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Run schemas in order
\i db/schemas/01_main.sql
\i db/schemas/02_admin.sql
\i db/schemas/03_analytics.sql
```

## Railway Deployment

Railway will automatically configure the `DATABASE_URL` environment variable.

See `RAILWAY_DB_SETUP.md` for detailed instructions.

## Local Development

For local development with PostgreSQL:

```bash
# Create database
createdb 5zn_dev

# Run schemas
psql 5zn_dev -f db/schemas/01_main.sql
psql 5zn_dev -f db/schemas/02_admin.sql
psql 5zn_dev -f db/schemas/03_analytics.sql
```

## Fallback

If PostgreSQL is unavailable, the server will automatically fall back to JSON file storage in the `data/` directory.



