# 🚀 Quick Deploy Guide - Railway

## Быстрый старт

### 1. Подготовка GitHub

```bash
# Убедитесь что все изменения закоммичены
git add .
git commit -m "Next.js migration complete - ready for Railway"
git push origin main
```

### 2. Railway Setup

1. **Создайте проект:**
   - Откройте [railway.app](https://railway.app)
   - Нажмите **"New Project"**
   - Выберите **"Deploy from GitHub repo"**
   - Выберите ваш репозиторий

2. **Добавьте PostgreSQL:**
   - В проекте нажмите **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway создаст базу данных автоматически

3. **Настройте переменные окружения:**
   - Перейдите в ваш сервис → **Variables**
   - Добавьте все переменные из `railway.env.example`
   - **Важно:** Используйте `DATABASE_URL` из PostgreSQL сервиса

### 3. Переменные окружения

**Обязательные:**

```bash
DATABASE_URL=<из PostgreSQL сервиса>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<надежный пароль>
ADMIN_SESSION_SECRET=<случайная строка 32+ символов>
STRAVA_CLIENT_ID=<ваш Strava Client ID>
STRAVA_CLIENT_SECRET=<ваш Strava Client Secret>
STRAVA_REDIRECT_URI=https://your-app.railway.app/api/strava/callback
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
NODE_ENV=production
```

**Как получить секреты:**

```bash
# Генерация ADMIN_SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Первый деплой

Railway автоматически:
1. Определит Next.js проект
2. Установит зависимости
3. Запустит `npm run build`
4. Запустит `prisma generate` (через postinstall)
5. Запустит приложение

### 5. Миграции базы данных

После первого деплоя:

**Вариант 1: Через Railway CLI**
```bash
npm i -g @railway/cli
railway login
railway link
railway run npx prisma migrate deploy
```

**Вариант 2: Через Railway Dashboard**
- Перейдите в PostgreSQL сервис → **Data** tab
- Выполните SQL из `db/schemas/` в порядке:
  1. `01_main.sql`
  2. `02_admin.sql`
  3. `03_analytics.sql`
  4. `04_init_clubs.sql` (если есть)

### 6. Проверка

После деплоя проверьте:
- ✅ Главная страница: `https://your-app.railway.app/`
- ✅ Admin login: `https://your-app.railway.app/admin/login`
- ✅ App: `https://your-app.railway.app/app`

### 7. Обновление Strava OAuth

1. Откройте [Strava API Settings](https://www.strava.com/settings/api)
2. Обновите **Authorization Callback Domain** на ваш Railway домен
3. Убедитесь что `STRAVA_REDIRECT_URI` совпадает

## Troubleshooting

### Build fails
- Проверьте логи в Railway dashboard
- Убедитесь что все зависимости в `package.json`
- Проверьте что Node.js версия 20+

### Database connection fails
- Проверьте `DATABASE_URL` правильный
- Убедитесь что PostgreSQL сервис запущен
- Проверьте что база в том же Railway проекте

### Prisma errors
- Проверьте что `prisma generate` выполнился
- Запустите вручную: `railway run npx prisma generate`
- Проверьте что `DATABASE_URL` доступен

### Environment variables not working
- Переменные чувствительны к регистру
- Перезапустите сервис после добавления переменных
- Проверьте логи на ошибки

## Полезные команды

```bash
# Просмотр логов
railway logs

# Запуск команды в Railway
railway run <command>

# Открыть Prisma Studio
railway run npx prisma studio

# Проверить переменные
railway variables
```

## Дополнительная информация

- Полная документация: `docs/RAILWAY_DEPLOY.md`
- Чеклист деплоя: `docs/DEPLOYMENT_CHECKLIST.md`
- Архитектура: `docs/ARCHITECTURE-NEXT.md`

---

**Готово к деплою!** 🚀

