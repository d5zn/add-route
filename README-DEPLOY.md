# 🚀 Railway Deployment - Quick Start

## Шаг 1: Push в GitHub

```bash
git add .
git commit -m "Next.js migration complete - ready for Railway deployment"
git push origin main
```

## Шаг 2: Создать Railway проект

1. Откройте https://railway.app
2. Нажмите **"New Project"**
3. Выберите **"Deploy from GitHub repo"**
4. Авторизуйте Railway для доступа к GitHub
5. Выберите репозиторий: `d5zn/add-route` (или ваш fork)

## Шаг 3: Добавить PostgreSQL

1. В Railway проекте нажмите **"+ New"**
2. Выберите **"Database"** → **"Add PostgreSQL"**
3. Railway создаст базу данных автоматически

## Шаг 4: Настроить переменные окружения

Перейдите в ваш сервис → **Variables** и добавьте:

### Обязательные переменные:

```bash
# Database (скопируйте из PostgreSQL сервиса)
DATABASE_URL=postgresql://...

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<надежный пароль>
ADMIN_SESSION_SECRET=<сгенерируйте: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# Strava
STRAVA_CLIENT_ID=<ваш Client ID>
STRAVA_CLIENT_SECRET=<ваш Client Secret>
STRAVA_REDIRECT_URI=https://your-app.railway.app/api/strava/callback

# Next.js
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
NODE_ENV=production
```

## Шаг 5: Первый деплой

Railway автоматически:
- ✅ Определит Next.js проект
- ✅ Установит зависимости (`npm ci`)
- ✅ Сгенерирует Prisma Client (`postinstall`)
- ✅ Соберет приложение (`npm run build`)
- ✅ Запустит сервер (`npm start`)

## Шаг 6: Миграции базы данных

После первого деплоя выполните миграции:

### Вариант 1: Railway CLI (рекомендуется)

```bash
# Установить Railway CLI
npm i -g @railway/cli

# Войти
railway login

# Подключиться к проекту
railway link

# Запустить миграции
railway run npx prisma migrate deploy
```

### Вариант 2: Через Railway Dashboard

1. Перейдите в PostgreSQL сервис → **Data** tab
2. Выполните SQL из `db/schemas/` в порядке:
   - `01_main.sql`
   - `02_admin.sql`
   - `03_analytics.sql`

## Шаг 7: Проверка

После деплоя проверьте:

- ✅ Главная: `https://your-app.railway.app/`
- ✅ Admin: `https://your-app.railway.app/admin/login`
- ✅ App: `https://your-app.railway.app/app`

## Шаг 8: Обновить Strava OAuth

1. Откройте https://www.strava.com/settings/api
2. Обновите **Authorization Callback Domain** на ваш Railway домен
3. Убедитесь что `STRAVA_REDIRECT_URI` совпадает

## ✅ Готово!

Приложение развернуто на Railway! 🎉

---

**Дополнительная документация:**
- Детальная инструкция: `docs/RAILWAY_DEPLOY.md`
- Чеклист: `docs/DEPLOYMENT_CHECKLIST.md`
- Troubleshooting: см. Railway dashboard logs

