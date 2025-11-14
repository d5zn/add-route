# 🗄️ База данных 5zn.io

## ✅ Production (Railway)

**Status**: Активна и работает  
**Type**: PostgreSQL  
**Host**: Railway Internal Network  
**Connection**:
```
postgresql://postgres:mkuEzDfDJnCePKiizLumEMTuwRqFVJqY@postgres.railway.internal:5432/railway
```

### Информация о БД

- **Provider**: Railway PostgreSQL
- **Version**: Latest (auto-managed)
- **Network**: Internal Railway network (приватная)
- **Backups**: Автоматические через Railway
- **SSL**: Включен по умолчанию

### Доступ к данным

#### 1. Railway Dashboard
```
1. Зайти на railway.app
2. Выбрать проект 5zn-web
3. Открыть PostgreSQL service
4. Использовать встроенный Query Editor
```

#### 2. Админ панель (через API)
```
https://5zn-web.up.railway.app/admin_panel.html

Показывает:
- Список пользователей
- Статистику подключений
- Последние активности
```

#### 3. Локальное подключение (для разработки)
```bash
# Установить psql клиент
brew install postgresql  # macOS
sudo apt install postgresql-client  # Linux

# Подключиться (используйте внешний URL из Railway Dashboard)
psql postgresql://postgres:password@external-host.railway.app:port/railway
```

### Схема базы данных

**File**: `database_schema.sql`

**Таблица athletes**:
```sql
CREATE TABLE athletes (
    id SERIAL PRIMARY KEY,
    athlete_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    firstname VARCHAR(255),
    lastname VARCHAR(255),
    email VARCHAR(255) NOT NULL DEFAULT 'not_provided',
    city VARCHAR(255),
    country VARCHAR(255),
    profile_picture TEXT,
    access_token_hash VARCHAR(255),
    strava_created_at TIMESTAMP,
    strava_updated_at TIMESTAMP,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 💻 Local Development (JSON Fallback)

Для локальной разработки без подключения к Railway DB:

**Расположение**: `data/` папка в корне проекта
```
5zn-web/
└── data/
    ├── athlete_123456789.json
    ├── athlete_987654321.json
    └── athlete_456789123.json
```

### Автоматический fallback

Сервер автоматически использует JSON если PostgreSQL недоступен:
```
⚠️ No database connection, using JSON fallback
💾 Saved athlete data (JSON): data/athlete_12345.json
```

### Просмотр JSON данных

```bash
# Посмотреть всех пользователей
ls data/

# Посмотреть данные пользователя
cat data/athlete_123456789.json | python -m json.tool
```

## 🔄 Environment Variables

### Railway (Production)
```bash
DATABASE_URL=postgresql://postgres:...@postgres.railway.internal:5432/railway
ENVIRONMENT=production
```

### Local (Development)
```bash
# Оставьте пустым для JSON fallback
# DATABASE_URL=  

# Или укажите локальную БД
DATABASE_URL=postgresql://localhost/5zn_dev
```

## 🔧 Database Management

### Инициализация (автоматическая)

Сервер автоматически применяет схему при запуске:
```python
def init_database():
    """Initialize database with schema"""
    # Читает database_schema.sql
    # Применяет к PostgreSQL
```

### Ручная миграция

Если нужно применить схему вручную:
```bash
# На Railway через CLI
railway connect postgresql
\i database_schema.sql

# Локально
psql 5zn_dev < database_schema.sql
```

### Backup & Restore

Railway автоматически создает backups, но можно сделать вручную:
```bash
# Экспорт
railway connect postgresql -- pg_dump > backup.sql

# Импорт
railway connect postgresql < backup.sql
```

## 📊 Monitoring

### Railway Dashboard
- Real-time metrics
- Query performance
- Connection count
- Storage usage

### Application Logs
```bash
# Смотреть логи
railway logs

# Фильтр по БД операциям
railway logs | grep "Database"
```

## 🔒 Security

### Implemented
- ✅ Токены хешируются (SHA-256)
- ✅ Никакие access tokens не хранятся в plain text
- ✅ SSL/TLS шифрование
- ✅ Приватная сеть Railway
- ✅ Rate limiting на API endpoints

### Best Practices
- ⚠️ Не коммитить `DATABASE_URL` в git
- ⚠️ Использовать environment variables
- ⚠️ Регулярно проверять Railway security advisories
- ✅ `data/` папка в `.gitignore`

## 🐛 Troubleshooting

### Connection Errors

**Problem**: `No database connection`
```bash
# Проверить environment variable
echo $DATABASE_URL

# Проверить сеть
railway status
```

**Solution**: 
1. Проверить Railway dashboard
2. Убедиться что PostgreSQL service запущен
3. Проверить DATABASE_URL в environment variables

### Migration Issues

**Problem**: Schema not applied
```bash
# Применить схему вручную
railway connect postgresql
\i database_schema.sql
```

### JSON Fallback Active

**Normal**: В dev режиме без PostgreSQL
**Warning**: В production - проверить DATABASE_URL

## 📝 Migration from JSON to PostgreSQL

Если нужно перенести данные из JSON в PostgreSQL:

```python
# migrate_json_to_db.py
import json
import os
import psycopg2

# Подключение
conn = psycopg2.connect(os.environ['DATABASE_URL'])
cursor = conn.cursor()

# Миграция
for filename in os.listdir('data/'):
    if filename.startswith('athlete_'):
        with open(f'data/{filename}', 'r') as f:
            user = json.load(f)
            
            cursor.execute("""
                INSERT INTO athletes (
                    athlete_id, username, firstname, lastname, 
                    email, city, country, profile_picture,
                    connected_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (athlete_id) DO NOTHING
            """, (
                user['athlete_id'],
                user.get('username'),
                user.get('firstname'),
                user.get('lastname'),
                user.get('email', 'not_provided'),
                user.get('city'),
                user.get('country'),
                user.get('profile_picture'),
                user.get('connected_at')
            ))

conn.commit()
print("✅ Migration complete")
```

---

## 📍 Summary

### Production (Railway)
```
✅ PostgreSQL на Railway
✅ Автоматические backups
✅ SSL/TLS шифрование
✅ Приватная сеть
```

### Development (Local)
```
📁 JSON файлы в data/
🔄 Автоматический fallback
✅ Легкая разработка без БД
```

---

**Last Updated**: October 2025  
**Status**: ✅ Production Ready
