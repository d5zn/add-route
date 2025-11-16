# Railway Deployment - Краткая Сводка Исправлений

## Изменения

### 1. ✅ railway.json
```json
{
  "build": {
    "builder": "NIXPACKS"  // Использует Nixpacks вместо Dockerfile
  },
  "deploy": {
    "startCommand": "npm run start"  // Стандартная команда Next.js
  }
}
```

### 2. ✅ nixpacks.toml
```toml
[phases.install]
cmds = ["npm ci"]  // npm ci автоматически запустит postinstall (prisma generate)

[phases.build]
cmds = ["npm run build"]  // Просто билд Next.js

[start]
cmd = "npm run start"  // Запуск production сервера
```

### 3. ✅ lib/db.ts
Добавлена защита от отсутствия `DATABASE_URL` на этапе билда:
```typescript
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  
  // Placeholder для билда, если DATABASE_URL не установлен
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set, using placeholder for build')
    return 'postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public'
  }
  
  return process.env.DATABASE_URL || 'postgresql://localhost:5432/dev'
}
```

### 4. ✅ Dockerfile → Dockerfile.legacy-python
Переименован старый Dockerfile, чтобы не мешал Nixpacks

## Что делать дальше?

### 1. Проверьте переменные окружения в Railway

Обязательные:
- ✅ `DATABASE_URL` - подключение к PostgreSQL
- ✅ `ADMIN_USERNAME` - логин админки
- ✅ `ADMIN_PASSWORD` - пароль админки
- ✅ `ADMIN_SESSION_SECRET` - секрет для сессий
- ✅ `STRAVA_CLIENT_ID` - ID приложения Strava
- ✅ `STRAVA_CLIENT_SECRET` - секрет Strava
- ✅ `NEXT_PUBLIC_APP_URL` - URL приложения

### 2. Подключите PostgreSQL

Если еще не подключена:
1. Railway Dashboard → "+ New" → "Database" → "Add PostgreSQL"
2. Railway автоматически создаст `DATABASE_URL`
3. В настройках сервиса: Variables → Reference → выберите `DATABASE_URL` из Postgres

### 3. Закоммитьте изменения

```bash
git add railway.json nixpacks.toml lib/db.ts Dockerfile.legacy-python RAILWAY_FIX.md RAILWAY_DEPLOYMENT_SUMMARY.md
git commit -m "fix: Railway deployment configuration for Next.js with Nixpacks"
git push
```

### 4. Railway автоматически запустит деплой

Следите за логами:
- ✅ Setup (Node.js установка)
- ✅ Install dependencies (npm ci + prisma generate)
- ✅ Build Next.js
- ✅ Start server

## Частые проблемы

### "The executable npm could not be found"
**Причина**: Railway использовал старый Dockerfile для Python  
**Решение**: ✅ Уже исправлено - Dockerfile переименован

### "Build Next.js failed"
**Причина**: Отсутствует DATABASE_URL  
**Решение**: 
1. Проверьте, что PostgreSQL подключен
2. Убедитесь, что DATABASE_URL виден в Variables
3. ✅ Добавлена защита в lib/db.ts

### "Error: P1001: Can't reach database server"
**Причина**: Приложение не может подключиться к БД  
**Решение**:
1. Проверьте, что PostgreSQL сервис запущен
2. Проверьте правильность DATABASE_URL
3. Убедитесь, что оба сервиса в одном окружении (project)

## Архитектура деплоя

```
Railway Project
├── Service: Web App (Next.js)
│   ├── Build: Nixpacks
│   ├── Node.js 20
│   └── Prisma ORM
└── Service: PostgreSQL Database
    └── Auto-managed by Railway
```

## Проверка после деплоя

1. Откройте URL приложения - должна загрузиться главная страница
2. Проверьте `/admin/login` - должна открыться форма входа
3. Войдите с `ADMIN_USERNAME` и `ADMIN_PASSWORD`
4. Проверьте `/admin/clubs` - должен загрузиться список клубов

Если все работает - поздравляю! 🎉 Деплой успешен!

