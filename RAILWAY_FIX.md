# Railway Deployment Fix

## Проблема
Деплой на Railway завершался ошибкой на этапе "Deploy > Create container":
```
The executable `npm` could not be found.
```

## Причина
Конфликт конфигураций:
- `railway.json` указывал использовать **NIXPACKS** для сборки
- В корне проекта находился `Dockerfile`, настроенный для старого Python сервера
- Railway находил Dockerfile и пытался его использовать вместо Nixpacks
- Python образ не содержал Node.js/npm

## Решение

### 1. Переименован старый Dockerfile
```bash
mv Dockerfile Dockerfile.legacy-python
```

### 2. Обновлен railway.json
Использует Nixpacks с правильной командой запуска:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start"
  }
}
```

### 3. Обновлен nixpacks.toml
Изменена команда запуска с `npm run start:next` на стандартную `npm run start`:
```toml
[start]
cmd = "npm run start"
```

## Проверка перед деплоем

Убедитесь, что в Railway настроены переменные окружения:
- `DATABASE_URL` - строка подключения к PostgreSQL (обязательно!)
- `STRAVA_CLIENT_ID` - ID приложения Strava
- `STRAVA_CLIENT_SECRET` - секрет приложения Strava
- `ADMIN_USERNAME` - имя пользователя админки (по умолчанию: admin)
- `ADMIN_PASSWORD` - пароль админки
- `ADMIN_SESSION_SECRET` - секрет для сессий админки
- `NEXT_PUBLIC_APP_URL` - URL вашего приложения

**Важно**: `DATABASE_URL` должен быть установлен ДО запуска билда, иначе билд может упасть.

### Как подключить базу данных в Railway:
1. В Railway dashboard нажмите "+ New" → "Database" → "Add PostgreSQL"
2. Railway автоматически создаст переменную `DATABASE_URL`
3. Убедитесь, что ваш сервис видит эту переменную (Variables → Reference → DATABASE_URL)

## Что делает Nixpacks

1. **Setup**: Устанавливает Node.js 20 и PostgreSQL client
2. **Install**: Выполняет `npm ci` и `npx prisma generate`
3. **Build**: Собирает Next.js (`npm run build`) и мигрирует БД
4. **Start**: Запускает production сервер Next.js (`npm run start`)

## Следующие шаги

1. Закоммитьте изменения:
```bash
git add railway.json nixpacks.toml Dockerfile.legacy-python RAILWAY_FIX.md
git commit -m "fix: Railway deployment configuration for Next.js"
git push
```

2. Railway автоматически запустит новый деплой
3. Убедитесь, что все переменные окружения настроены
4. Проверьте логи деплоя в Railway dashboard

## Исправление ошибки билда

Если билд все равно падает на этапе "Build Next.js", проверьте:

1. **DATABASE_URL установлен?** - Railway должен видеть эту переменную
2. **PostgreSQL сервис создан?** - В Railway должен быть активный PostgreSQL сервис
3. **Переменные связаны?** - В настройках сервиса Variables → убедитесь, что DATABASE_URL ссылается на Postgres

### Дополнительная защита

В файл `lib/db.ts` добавлена защита от отсутствия DATABASE_URL на этапе билда:
- Если DATABASE_URL не установлен, используется placeholder
- Это позволяет билду завершиться, даже если БД еще не подключена
- Реальное подключение происходит только при запуске приложения

## Архитектура проекта

Проект находится в процессе миграции:
- **Legacy**: Python HTTP сервер (`server.py`) - больше не используется на production
- **Current**: Next.js App Router с API routes и Prisma ORM
- **Admin**: React панель теперь часть Next.js под `/admin`

