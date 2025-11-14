# 🔒 Настройка безопасности для Production

## ✅ Что уже реализовано

### 1. Production Server (`server_prod.py`)
- ✅ Строгий CSP (Content Security Policy)
- ✅ Ограниченный CORS только для разрешенных доменов
- ✅ Rate limiting (100 запросов в минуту с IP)
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, и т.д.)
- ✅ HTTPS-only в production (HSTS)
- ✅ Timestamped logging

### 2. База данных схема (`database_schema.sql`)
- ✅ Таблицы для пользователей и токенов
- ✅ Индексы для производительности
- ✅ Triggers для автоматического обновления
- ✅ GDPR compliance (is_active, last_seen_at)
- ✅ Защита от SQL injection

---

## 🚀 Как использовать

### Development (локальная разработка)

```bash
# Используйте обычный server.py
python3 server.py
```

**Особенности:**
- Более мягкая CSP для разработки
- CORS разрешен для localhost
- Нет rate limiting (для удобства разработки)

### Production (боевой сервер)

```bash
# Установите переменную окружения
export ENVIRONMENT=production

# Запустите production сервер
python3 server_prod.py
```

**Особенности:**
- Строгий CSP
- Только разрешенные домены в CORS
- Rate limiting включен
- HTTPS only (HSTS header)
- Полное логирование

---

## 🔧 Настройка для production

### 1. Обновите `server_config.py`

```python
# server_config.py

STRAVA_CLIENT_ID = 'your_production_client_id'
STRAVA_CLIENT_SECRET = 'your_production_client_secret'

DEBUG = False  # ВАЖНО: False для production

ALLOWED_ORIGINS = [
    'https://yourdomain.com',  # Ваш production домен
    'https://www.yourdomain.com',  # С www
]
```

### 2. Настройте базу данных

#### PostgreSQL (рекомендуется):

```bash
# Создайте базу данных
createdb trinky_db

# Примените схему
psql trinky_db < database_schema.sql
```

#### MySQL:

```bash
# Создайте базу данных
mysql -u root -p
CREATE DATABASE trinky_db;
USE trinky_db;
SOURCE database_schema.sql;
```

#### SQLite (для простых случаев):

```bash
sqlite3 trinky.db < database_schema.sql
```

### 3. Настройте SSL/HTTPS

#### С Let's Encrypt (бесплатно):

```bash
# Установите certbot
sudo apt install certbot python3-certbot-nginx

# Получите сертификат
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### С Nginx:

```nginx
# /etc/nginx/sites-available/trinky
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔐 Security Headers

Production сервер автоматически добавляет:

```
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 🛡️ Rate Limiting

### Текущие настройки:
- **Окно**: 60 секунд
- **Максимум**: 100 запросов на IP
- **Ответ при превышении**: HTTP 429 (Too Many Requests)

### Изменить настройки:

В `server_prod.py`:

```python
class ProductionHTTPRequestHandler:
    RATE_LIMIT_WINDOW = 60  # секунд
    RATE_LIMIT_MAX_REQUESTS = 100  # max requests
```

---

## 📊 Мониторинг

### Логи

Все запросы логируются с timestamp:
```
📡 [2024-12-20 14:30:45] "GET / HTTP/1.1" 200 -
```

### Rate Limit Alerts

При превышении лимита:
```
⚠️ Rate limit exceeded for 192.168.1.100
```

---

## 🧪 Тестирование безопасности

### Проверить headers:

```bash
curl -I https://yourdomain.com
```

Должны быть все security headers.

### Проверить CSP:

Откройте в браузере и проверьте Console. Не должно быть CSP violations.

### Проверить rate limiting:

```bash
# Отправьте 101 запрос быстро
for i in {1..101}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000; done
```

Последний запрос должен вернуть 429.

---

## 📝 Checklist для production

- [ ] `server_config.py` обновлен с production credentials
- [ ] `DEBUG = False` в `server_config.py`
- [ ] `ALLOWED_ORIGINS` содержит только нужные домены
- [ ] SSL сертификат установлен
- [ ] `ENVIRONMENT=production` установлен
- [ ] База данных настроена
- [ ] Backups настроены
- [ ] Мониторинг настроен
- [ ] Firewall настроен
- [ ] Rate limiting протестирован
- [ ] Security headers проверены

---

## ⚠️ Важные предупреждения

1. **НЕ коммитьте** `server_config.py` в git
2. **Используйте HTTPS** в production
3. **Регулярно обновляйте** зависимости
4. **Мониторьте** логи на подозрительную активность
5. **Делайте резервные копии** базы данных
6. **Храните секреты** в переменных окружения

---

## 🆘 Проблемы?

### Rate limit срабатывает слишком часто
Увеличьте `RATE_LIMIT_MAX_REQUESTS` в `server_prod.py`

### CSP блокирует ресурсы
Проверьте логи браузера и добавьте нужные источники в CSP

### CORS ошибки
Добавьте домен в `ALLOWED_ORIGINS` в `server_config.py`

---

**Готово!** 🎉 Ваше приложение теперь безопасно для production!
