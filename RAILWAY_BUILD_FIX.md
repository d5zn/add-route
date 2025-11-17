# Исправление ошибки билда на Railway

## Проблема

Билд падает с ошибкой `"npm run build" did not complete successfully: exit code: 1`

## Возможные причины

1. **Отсутствие DATABASE_URL во время билда** - Prisma может требовать DATABASE_URL даже для генерации клиента
2. **Проблемы с переменными окружения** - не все переменные установлены
3. **Проблемы с зависимостями** - не все пакеты установлены корректно

## Решения

### 1. Убедитесь, что DATABASE_URL установлен

В Railway Dashboard → Variables добавьте:
```
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
```

**Важно:** DATABASE_URL должен быть установлен ДО билда, так как Prisma генерирует клиент во время `npm ci` (postinstall hook).

### 2. Проверьте все необходимые переменные

Убедитесь, что установлены все переменные из `railway.env.example`:

```bash
DATABASE_URL=...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=...
ADMIN_SESSION_SECRET=...
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
STRAVA_REDIRECT_URI=...
NEXT_PUBLIC_APP_URL=...
NODE_ENV=production
```

### 3. Обновите nixpacks.toml (опционально)

Если проблема сохраняется, можно явно указать генерацию Prisma:

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "openssl"]

[phases.install]
cmds = [
  "npm ci"
]

[phases.build]
cmds = [
  "npx prisma generate",
  "npm run build"
]

[start]
cmd = "npm run start"

[variables]
NEXT_TELEMETRY_DISABLED = "1"
```

### 4. Проверьте логи билда

В Railway Dashboard → Deployments → View Logs проверьте полные логи билда для выявления конкретной ошибки.

## Изменения в коде

Обновлен `lib/db.ts` для лучшей обработки отсутствия DATABASE_URL во время билда:
- Добавлена проверка `NEXT_PHASE === 'phase-production-build'`
- Улучшена ленивая инициализация Prisma клиента
- Добавлены предупреждения вместо ошибок

## Проверка

После применения исправлений:
1. Убедитесь, что все переменные окружения установлены в Railway
2. Запустите новый деплой
3. Проверьте логи билда

Если проблема сохраняется, проверьте полные логи билда в Railway Dashboard.

