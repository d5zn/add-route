# 🔐 Настройка OAuth для Strava API

## 📋 Что нужно сделать

Для полноценной работы OAuth авторизации необходимо настроить серверный обмен токенов.

---

## 🚀 Быстрый старт

### Шаг 1: Получить Strava API Credentials

1. Перейдите на [Strava API Settings](https://www.strava.com/settings/api)
2. Создайте новое приложение или используйте существующее
3. Запишите:
   - **Client ID** (публичный идентификатор)
   - **Client Secret** (секретный ключ, никогда не делитесь!)

### Шаг 2: Настроить server_config.py

Создайте или отредактируйте файл `server_config.py`:

```python
STRAVA_CLIENT_ID = 'ваш_client_id_здесь'
STRAVA_CLIENT_SECRET = 'ваш_client_secret_здесь'
```

⚠️ **ВАЖНО**: Не коммитьте этот файл в git! Добавьте в `.gitignore`.

### Шаг 3: Обновить .gitignore

Убедитесь, что в `.gitignore` есть:
```
server_config.py
*.env
```

### Шаг 4: Запустить сервер

```bash
python3 server.py
```

Теперь OAuth будет работать! 🎉

---

## 🔧 Альтернативный способ: через переменные окружения

Вместо файла `server_config.py` можно использовать переменные окружения:

### macOS/Linux:
```bash
export STRAVA_CLIENT_ID='ваш_client_id'
export STRAVA_CLIENT_SECRET='ваш_client_secret'
python3 server.py
```

### Windows (PowerShell):
```powershell
$env:STRAVA_CLIENT_ID='ваш_client_id'
$env:STRAVA_CLIENT_SECRET='ваш_client_secret'
python3 server.py
```

### Windows (CMD):
```cmd
set STRAVA_CLIENT_ID=ваш_client_id
set STRAVA_CLIENT_SECRET=ваш_client_secret
python3 server.py
```

---

## 📱 Для продакшена

### Настройка Strava API для production

1. В [Strava API Settings](https://www.strava.com/settings/api):
   - **Website**: `https://yourdomain.com`
   - **Authorization Callback Domain**: `yourdomain.com`

2. В `server_config.py`:
```python
STRAVA_CLIENT_ID = 'production_client_id'
STRAVA_CLIENT_SECRET = 'production_client_secret'
DEBUG = False
ALLOWED_ORIGINS = [
    'https://yourdomain.com'
]
```

3. Обновите `.gitignore` чтобы исключить `server_config.py`

---

## 🔍 Как это работает

```
1. Пользователь нажимает "Connect with Strava"
   ↓
2. Перенаправление на Strava OAuth
   https://www.strava.com/oauth/authorize?...
   ↓
3. Strava возвращает код на /oauth/
   ↓
4. Frontend отправляет код на /api/strava/token
   ↓
5. Backend (server.py) обменивает код на токен
   ↓
6. Токен сохраняется в localStorage
   ↓
7. Пользователь авторизован! ✅
```

---

## ⚠️ Безопасность

### ✅ Что делать:
- ✅ Храните Client Secret на сервере
- ✅ Используйте HTTPS в production
- ✅ Ограничьте CORS только нужными доменами
- ✅ Используйте переменные окружения
- ✅ Не коммитьте credentials в git

### ❌ Что НЕ делать:
- ❌ Не храните Client Secret в коде
- ❌ Не отправляйте Client Secret на frontend
- ❌ Не используйте HTTP в production
- ❌ Не коммитьте credentials

---

## 🐛 Отладка

### Проблема: "Token exchange failed"

**Решение**: 
1. Проверьте Client ID и Secret в `server_config.py`
2. Убедитесь что они правильные в [Strava API Settings](https://www.strava.com/settings/api)
3. Проверьте callback URL в настройках Strava

### Проблема: "Missing authorization code"

**Решение**:
1. Проверьте что пользователь прошел через Strava авторизацию
2. Убедитесь что redirect URI правильный
3. Проверьте console в браузере на ошибки

### Проблема: "Server Error 500"

**Решение**:
1. Проверьте что Python версии 3.6+
2. Установите все зависимости: `pip install -r requirements.txt`
3. Проверьте логи сервера в консоли

---

## 📚 Дополнительные ресурсы

- [Strava API Documentation](https://developers.strava.com/)
- [OAuth 2.0 Flow](https://www.oauth.com/oauth2-servers/server-side-apps/authorization-code/)
- [Python urllib Documentation](https://docs.python.org/3/library/urllib.request.html)

---

## ✅ Чеклист

- [ ] Создано приложение на Strava API
- [ ] Получены Client ID и Client Secret
- [ ] Создан файл `server_config.py`
- [ ] Настроены credentials в `server_config.py`
- [ ] Добавлен `server_config.py` в `.gitignore`
- [ ] Запущен сервер: `python3 server.py`
- [ ] Протестирован OAuth flow
- [ ] Настроен production домен (если применимо)

---

**Готово!** 🎉 Теперь OAuth авторизация полностью работает!
