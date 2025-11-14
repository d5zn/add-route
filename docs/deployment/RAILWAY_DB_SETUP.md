# 🚂 Настройка PostgreSQL на Railway

## 🚀 Быстрая настройка

### Шаг 1: Создать PostgreSQL на Railway

1. Зайдите на [Railway](https://railway.app)
2. Создайте новый проект или выберите существующий
3. Нажмите **"+ New"** → **"Database"** → **"Add PostgreSQL"**
4. Railway автоматически создаст PostgreSQL базу данных

### Шаг 2: Получить connection string

1. Нажмите на вашу базу данных
2. Перейдите в **"Variables"** вкладку
3. Скопируйте **DATABASE_URL**

Он будет выглядеть так:
```
postgresql://postgres:password@containers-us-west-1.railway.app:5432/railway
```

### Шаг 3: Добавить в проект

В вашем Railway проекте добавьте переменную окружения:

1. Откройте ваш проект (веб-приложение)
2. Перейдите в **"Variables"**
3. Добавьте:
   - **Name**: `DATABASE_URL`
   - **Value**: (скопированная строка из Шага 2)

---

## 🔧 Настройка приложения

### 1. Обновите `railway.json`

Убедитесь что есть зависимость PostgreSQL:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python3 server_prod.py",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100
  }
}
```

### 2. Установите psycopg2

Добавьте в `requirements.txt`:

```
psycopg2-binary==2.9.9
```

Или создайте файл если его нет:

```bash
echo "psycopg2-binary==2.9.9" > requirements.txt
```

### 3. Обновите `server_prod.py`

Добавьте функцию для подключения к БД:

```python
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Get PostgreSQL connection from DATABASE_URL"""
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        return None
    
    # Railway иногда предоставляет URL с postgresql://, но psycopg2 хочет postgres://
    if database_url.startswith('postgresql://'):
        database_url = database_url.replace('postgresql://', 'postgres://', 1)
    
    try:
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None
```

### 4. Создайте таблицы

Добавьте функцию для инициализации БД:

```python
def init_database():
    """Initialize database with schema"""
    conn = get_db_connection()
    if not conn:
        print("⚠️ No database connection, skipping DB init")
        return
    
    try:
        cursor = conn.cursor()
        
        # Читаем schema из файла
        with open('database_schema.sql', 'r') as f:
            schema_sql = f.read()
            cursor.execute(schema_sql)
        
        conn.commit()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"⚠️ Database init error: {e}")
        conn.rollback()
    finally:
        conn.close()
```

Вызовите `init_database()` в `main()` функции перед запуском сервера.

---

## 🗄️ Использование БД

### Обновите `save_athlete_data()`:

```python
def save_athlete_data(self, athlete_data, access_token):
    """Save athlete data to PostgreSQL database"""
    conn = get_db_connection()
    
    if not conn:
        # Fallback to JSON if no DB
        self.save_athlete_data_json(athlete_data, access_token)
        return
    
    try:
        cursor = conn.cursor()
        
        # Insert or update athlete
        cursor.execute("""
            INSERT INTO athletes (
                athlete_id, username, firstname, lastname, email,
                city, country, profile_picture, access_token_hash,
                strava_created_at, strava_updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (athlete_id) 
            DO UPDATE SET
                username = EXCLUDED.username,
                firstname = EXCLUDED.firstname,
                lastname = EXCLUDED.lastname,
                email = EXCLUDED.email,
                city = EXCLUDED.city,
                country = EXCLUDED.country,
                profile_picture = EXCLUDED.profile_picture,
                access_token_hash = EXCLUDED.access_token_hash,
                strava_updated_at = EXCLUDED.strava_updated_at,
                last_seen_at = CURRENT_TIMESTAMP
        """, (
            athlete_data.get('id'),
            athlete_data.get('username'),
            athlete_data.get('firstname'),
            athlete_data.get('lastname'),
            athlete_data.get('email', 'not_provided'),
            athlete_data.get('city'),
            athlete_data.get('country'),
            athlete_data.get('profile'),
            self.hash_token(access_token),
            athlete_data.get('created_at'),
            athlete_data.get('updated_at')
        ))
        
        conn.commit()
        print(f"✅ Saved athlete to database: {athlete_data.get('firstname')} {athlete_data.get('lastname')}")
        
    except Exception as e:
        print(f"⚠️ Error saving to database: {e}")
        conn.rollback()
    finally:
        conn.close()
```

---

## 📊 Обновите admin endpoint

```python
def handle_admin_users(self):
    """Handle admin users API endpoint from database"""
    conn = get_db_connection()
    
    if not conn:
        # Fallback to JSON files
        return self.handle_admin_users_json()
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT 
                athlete_id, username, firstname, lastname, email,
                city, country, connected_at, last_seen_at
            FROM athletes 
            WHERE is_active = TRUE 
            ORDER BY connected_at DESC
        """)
        
        users = cursor.fetchall()
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'users': users}).encode())
        
    except Exception as e:
        print(f"❌ Error in admin users endpoint: {e}")
        self.send_error(500, 'Internal server error')
    finally:
        conn.close()
```

---

## 🧪 Тестирование

### 1. Проверьте connection

```bash
# На Railway в терминале проекта
railway run python3 -c "from server_prod import get_db_connection; print(get_db_connection())"
```

Должно вывести объект подключения или None.

### 2. Проверьте таблицы

```bash
railway run psql $DATABASE_URL -c "\dt"
```

Должны увидеть таблицы: athletes, tokens, user_sessions

### 3. Проверьте данные

```bash
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM athletes;"
```

---

## 📝 Railway Variables Checklist

Убедитесь что у вас есть все переменные:

```
✅ STRAVA_CLIENT_ID=your_client_id
✅ STRAVA_CLIENT_SECRET=your_client_secret
✅ DATABASE_URL=postgresql://... (автоматически)
✅ ENVIRONMENT=production
✅ ALLOWED_ORIGINS=https://yourdomain.com
```

---

## 🔐 Безопасность

Railway автоматически:
- ✅ Шифрует DATABASE_URL
- ✅ Ограничивает доступ к БД
- ✅ Делает бэкапы
- ✅ Мониторит производительность

---

## 🆘 Troubleshooting

### Проблема: "No module named psycopg2"

**Решение**: Добавьте в `requirements.txt`:
```
psycopg2-binary==2.9.9
```

### Проблема: "could not connect to server"

**Решение**: Проверьте что:
- PostgreSQL сервис добавлен
- `DATABASE_URL` правильный
- Railway проект запущен

### Проблема: "relation does not exist"

**Решение**: Запустите `init_database()` для создания таблиц

---

## ✅ Готово!

Теперь ваше приложение использует PostgreSQL на Railway! 🎉

**Следующие шаги:**
1. Задеплойте изменения
2. Проверьте что таблицы созданы
3. Протестируйте авторизацию Strava
4. Проверьте admin панель

**Документация Railway**: https://docs.railway.app/databases/postgresql
