# Быстрый импорт шаблонов на Railway

## Способ 1: Через Railway CLI (самый простой)

```bash
# Установите Railway CLI если еще не установлен
# npm i -g @railway/cli

# Войдите в Railway
railway login

# Подключитесь к проекту
railway link

# Запустите скрипт импорта
railway run python3 import_templates.py
```

## Способ 2: Через Railway Dashboard

1. Откройте ваш проект в Railway Dashboard
2. Перейдите в раздел вашего сервиса (где запущен `server.py`)
3. Откройте вкладку "Deployments" или "Logs"
4. Найдите кнопку "Shell" или "Console" 
5. В открывшейся консоли выполните:
   ```bash
   python3 import_templates.py
   ```

## Способ 3: Добавить в Procfile (автоматический запуск)

Если хотите, чтобы импорт запускался автоматически при деплое (опционально):

Добавьте в `Procfile`:
```
web: python3 server.py
import: python3 import_templates.py
```

Но обычно импорт делается **один раз вручную**, а не при каждом деплое.

## Что произойдет

Скрипт:
1. ✅ Подключится к БД (используя `DATABASE_PRIVATE_URL` если доступен)
2. ✅ Создаст клубы "not-in-paris" и "hedonism" (если их еще нет)
3. ✅ Импортирует все шаблоны из `app-addicted-logic.js`
4. ✅ Преобразует их в формат админки

После успешного импорта шаблоны появятся в админке по адресу `/route/admin`.

