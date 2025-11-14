# 🚀 Railway Deployment Guide

## Шаг 1: Подготовка ✅

### Созданные файлы:
- ✅ `railway.json` - конфигурация Railway
- ✅ `Dockerfile` - оптимизирован для Railway
- ✅ `railway.env.example` - пример переменных окружения

## Шаг 2: Деплой на Railway

### 2.1 Создать аккаунт Railway
1. Перейти на [railway.app](https://railway.app)
2. Войти через GitHub
3. Подтвердить email

### 2.2 Создать новый проект
1. Нажать **"New Project"**
2. Выбрать **"Deploy from GitHub repo"**
3. Выбрать ваш репозиторий `5zn-web`
4. Railway автоматически найдет `Dockerfile`

### 2.3 Настроить переменные окружения
В Railway Dashboard → Variables:

```bash
# Обязательные переменные:
PORT=8000
HOST=0.0.0.0
NODE_ENV=production

# Strava OAuth (получить на strava.com/settings/api):
STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_secret_here
STRAVA_REDIRECT_URI=https://your-app.railway.app/oauth/index.html
```

### 2.4 Получить URL приложения
Railway автоматически создаст URL:
```
https://your-app-name.railway.app
```

## Шаг 3: Настройка Strava OAuth

### 3.1 Создать Strava App
1. Перейти на [strava.com/settings/api](https://strava.com/settings/api)
2. Нажать **"Create App"**
3. Заполнить:
   - **Application Name**: `5zn-web`
   - **Category**: `Web`
   - **Website**: `https://your-app.railway.app`
   - **Authorization Callback Domain**: `your-app.railway.app`

### 3.2 Обновить переменные в Railway
```bash
STRAVA_CLIENT_ID=ваш_client_id
STRAVA_CLIENT_SECRET=ваш_client_secret
STRAVA_REDIRECT_URI=https://your-app.railway.app/oauth/index.html
```

## Шаг 4: Проверка деплоя

### 4.1 Проверить статус
- Railway Dashboard → Deployments
- Должен быть статус **"Deployed"**

### 4.2 Проверить логи
```bash
# В Railway Dashboard → Logs
# Должны быть сообщения:
🚀 Starting 5zn-web production server...
📡 Server running at http://0.0.0.0:8000/
✅ Server started successfully!
```

### 4.3 Проверить приложение
Открыть URL: `https://your-app.railway.app`

## 🎯 Результат

После успешного деплоя:
- ✅ Приложение доступно по HTTPS
- ✅ Strava OAuth работает
- ✅ Автоматические деплои при push в GitHub
- ✅ Health checks настроены
- ✅ Безопасность настроена

## 🔧 Troubleshooting

### Проблема: Build failed
```bash
# Проверить Dockerfile
# Убедиться что все файлы в репозитории
```

### Проблема: App не запускается
```bash
# Проверить переменные окружения
# Проверить логи в Railway Dashboard
```

### Проблема: Strava OAuth не работает
```bash
# Проверить STRAVA_REDIRECT_URI
# Должен совпадать с настройками в Strava
```

## 💰 Стоимость

- **Free план**: 500 часов/месяц (достаточно для тестирования)
- **Pro план**: $5/месяц (неограниченное время)

## 🎉 Готово!

Ваше приложение теперь доступно по адресу:
`https://your-app.railway.app`

Railway автоматически будет деплоить изменения при push в GitHub! 🚀
