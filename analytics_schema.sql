-- Analytics schema for addicted Web
-- Tracks: connections, downloads, visits, club statistics

-- Table: auth_events (уникальные подключения/авторизации)
CREATE TABLE IF NOT EXISTS auth_events (
    id BIGSERIAL PRIMARY KEY,
    athlete_id BIGINT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint for one connection per athlete per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_events_unique_day 
ON auth_events(athlete_id, DATE(created_at));

-- Table: downloads (скачивания)
CREATE TABLE IF NOT EXISTS downloads (
    id BIGSERIAL PRIMARY KEY,
    athlete_id BIGINT,
    club_id VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    file_format VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE SET NULL
);

-- Table: visits (посещения страницы)
CREATE TABLE IF NOT EXISTS visits (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    athlete_id BIGINT,
    club_id VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    page_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE SET NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auth_events_athlete_id ON auth_events(athlete_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON auth_events(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_events_date ON auth_events(DATE(created_at));

CREATE INDEX IF NOT EXISTS idx_downloads_athlete_id ON downloads(athlete_id);
CREATE INDEX IF NOT EXISTS idx_downloads_club_id ON downloads(club_id);
CREATE INDEX IF NOT EXISTS idx_downloads_created_at ON downloads(created_at);
CREATE INDEX IF NOT EXISTS idx_downloads_date ON downloads(DATE(created_at));

CREATE INDEX IF NOT EXISTS idx_visits_session_id ON visits(session_id);
CREATE INDEX IF NOT EXISTS idx_visits_athlete_id ON visits(athlete_id);
CREATE INDEX IF NOT EXISTS idx_visits_club_id ON visits(club_id);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(DATE(created_at));

-- Views for statistics
CREATE OR REPLACE VIEW stats_unique_connections AS
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT athlete_id) as unique_connections
FROM auth_events
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW stats_downloads_by_club AS
SELECT 
    club_id,
    COUNT(*) as total_downloads,
    COUNT(DISTINCT athlete_id) as unique_users
FROM downloads
GROUP BY club_id;

CREATE OR REPLACE VIEW stats_visits_by_day AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_visits,
    COUNT(DISTINCT session_id) as unique_visits
FROM visits
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW stats_visits_by_month AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_visits,
    COUNT(DISTINCT session_id) as unique_visits
FROM visits
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

