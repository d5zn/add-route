-- Initialize clubs with synchronized IDs for main app and admin
-- Run this after creating the tables from 02_admin.sql

-- Insert HEDONISM club
INSERT INTO clubs (id, name, slug, description, theme, status, created_at, updated_at)
VALUES (
    'hedonism',
    'HEDONISM',
    'hedonism',
    'Комьюнити любителей бега и хорошего настроения',
    '{
        "primaryColor": "#FF5A5F",
        "secondaryColor": "#00A699",
        "accentColor": "#FC642D",
        "backgroundColor": "#FFFFFF",
        "fontFamily": "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif"
    }'::jsonb,
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    theme = EXCLUDED.theme,
    updated_at = CURRENT_TIMESTAMP;

-- Insert NOT IN PARIS club
INSERT INTO clubs (id, name, slug, description, theme, status, created_at, updated_at)
VALUES (
    'not-in-paris',
    'NOT IN PARIS',
    'not-in-paris',
    'Клуб бегунов NOT IN PARIS',
    '{
        "primaryColor": "#1E40AF",
        "secondaryColor": "#10B981",
        "accentColor": "#F59E0B",
        "backgroundColor": "#FFFFFF",
        "fontFamily": "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif"
    }'::jsonb,
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    theme = EXCLUDED.theme,
    updated_at = CURRENT_TIMESTAMP;

-- Verify clubs were inserted
SELECT id, name, slug, status FROM clubs WHERE status = 'active' ORDER BY created_at;

