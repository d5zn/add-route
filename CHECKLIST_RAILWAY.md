# ✅ Railway Deployment Checklist

## Перед деплоем

- [ ] PostgreSQL сервис создан в Railway
- [ ] `DATABASE_URL` виден в Variables вашего сервиса
- [ ] Все переменные окружения настроены:
  - [ ] `DATABASE_URL`
  - [ ] `ADMIN_USERNAME`
  - [ ] `ADMIN_PASSWORD`
  - [ ] `ADMIN_SESSION_SECRET`
  - [ ] `STRAVA_CLIENT_ID`
  - [ ] `STRAVA_CLIENT_SECRET`
  - [ ] `NEXT_PUBLIC_APP_URL`

## Изменения закоммичены

```bash
# Проверьте статус
git status

# Если есть незакоммиченные изменения:
git add railway.json nixpacks.toml lib/db.ts Dockerfile.legacy-python *.md
git commit -m "fix: Railway deployment - Nixpacks for Next.js"
git push
```

## После деплоя

- [ ] Build завершился успешно (без ошибок)
- [ ] Deploy завершился успешно
- [ ] Главная страница открывается (`/`)
- [ ] Админка доступна (`/admin/login`)
- [ ] Вход в админку работает
- [ ] API endpoints отвечают (`/api/admin/clubs`)

## Если билд падает

### Ошибка: "npm not found"
✅ Исправлено - Dockerfile переименован в Dockerfile.legacy-python

### Ошибка: "Build Next.js failed"
1. Проверьте логи билда в Railway
2. Убедитесь, что `DATABASE_URL` установлен
3. Проверьте, что PostgreSQL сервис запущен
4. ✅ Защита добавлена в `lib/db.ts`

### Ошибка: "Can't reach database"
1. PostgreSQL должен быть в том же проекте Railway
2. Проверьте правильность `DATABASE_URL`
3. Проверьте, что БД не спит (Railway может их останавливать на free tier)

## Полезные команды Railway CLI

```bash
# Установка CLI (если еще нет)
npm i -g @railway/cli

# Логин
railway login

# Просмотр логов
railway logs

# Открыть проект в браузере
railway open

# Проверка переменных окружения
railway variables
```

## Документация

- [RAILWAY_DEPLOYMENT_SUMMARY.md](./RAILWAY_DEPLOYMENT_SUMMARY.md) - Подробная сводка изменений
- [RAILWAY_FIX.md](./RAILWAY_FIX.md) - Детали исправления проблемы с деплоем
- [railway.env.example](./railway.env.example) - Пример переменных окружения

