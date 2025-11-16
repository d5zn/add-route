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
- `DATABASE_URL` - строка подключения к PostgreSQL
- `STRAVA_CLIENT_ID` - ID приложения Strava
- `STRAVA_CLIENT_SECRET` - секрет приложения Strava
- `NEXTAUTH_SECRET` - секрет для аутентификации
- `NEXTAUTH_URL` - URL вашего приложения

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

## Архитектура проекта

Проект находится в процессе миграции:
- **Legacy**: Python HTTP сервер (`server.py`) - больше не используется на production
- **Current**: Next.js App Router с API routes и Prisma ORM
- **Admin**: React панель теперь часть Next.js под `/admin`

