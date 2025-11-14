-- Database schema for Trinky Web
-- Compatible with PostgreSQL, MySQL, SQLite

-- Table: athletes
CREATE TABLE IF NOT EXISTS athletes (
    id BIGSERIAL PRIMARY KEY,
    athlete_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255),
    email VARCHAR(255),
    city VARCHAR(255),
    country VARCHAR(255),
    profile_picture TEXT,
    access_token_hash VARCHAR(64),
    strava_created_at TIMESTAMP,
    strava_updated_at TIMESTAMP,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: tokens (для безопасности)
CREATE TABLE IF NOT EXISTS tokens (
    id BIGSERIAL PRIMARY KEY,
    athlete_id BIGINT NOT NULL REFERENCES athletes(athlete_id),
    access_token TEXT NOT NULL,  -- В реальности зашифровать!
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE
);

-- Table: user_sessions (для отслеживания сессий)
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGSERIAL PRIMARY KEY,
    athlete_id BIGINT NOT NULL REFERENCES athletes(athlete_id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES athletes(athlete_id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_athletes_athlete_id ON athletes(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athletes_email ON athletes(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_athletes_active ON athletes(is_active);
CREATE INDEX IF NOT EXISTS idx_tokens_athlete_id ON tokens(athlete_id);
CREATE INDEX IF NOT EXISTS idx_sessions_athlete_id ON user_sessions(athlete_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- Для обновления updated_at автоматически (PostgreSQL)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON athletes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Для MySQL используйте это:
/*
DELIMITER //
CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON athletes
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;
*/

-- Пример запросов

-- Получить всех активных пользователей
-- SELECT * FROM athletes WHERE is_active = TRUE ORDER BY last_seen_at DESC;

-- Получить пользователя по athlete_id
-- SELECT * FROM athletes WHERE athlete_id = 123456789;

-- Обновить last_seen_at
-- UPDATE athletes SET last_seen_at = CURRENT_TIMESTAMP WHERE athlete_id = 123456789;

-- Удалить неактивных пользователей (GDPR compliance)
-- UPDATE athletes SET is_active = FALSE WHERE last_seen_at < NOW() - INTERVAL '2 years';

-- Статистика
-- SELECT COUNT(*) as total_users FROM athletes;
-- SELECT COUNT(*) as active_users FROM athletes WHERE is_active = TRUE;
-- SELECT DATE_TRUNC('month', connected_at) as month, COUNT(*) as new_users FROM athletes GROUP BY month;
