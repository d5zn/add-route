# Исправление проблемы разрешения модулей на Railway

## Проблема

На Railway билд падает с ошибкой:
```
Module not found: Can't resolve '@/lib/polyline'
Module not found: Can't resolve '@/lib/strava'
Module not found: Can't resolve '@/lib/validation'
```

## Причина

Next.js 16 с Turbopack может иметь проблемы с разрешением алиасов `@/*` в некоторых окружениях билда, особенно в Docker/Railway.

## Решения

### 1. Убедитесь, что конфигурация правильная

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "moduleResolution": "bundler"
  }
}
```

**jsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 2. Убрать `output: 'standalone'` (временно)

`output: 'standalone'` может вызывать проблемы с разрешением модулей. Временно закомментировано в `next.config.ts`.

### 3. Альтернативное решение: использовать относительные пути

Если проблема сохраняется, можно временно заменить алиасы на относительные пути:

**Вместо:**
```typescript
import { decodePolyline } from '@/lib/polyline'
```

**Использовать:**
```typescript
import { decodePolyline } from '../../lib/polyline'
```

Но это не рекомендуется, так как ухудшает читаемость кода.

### 4. Проверка на Railway

Убедитесь, что:
1. Все файлы закоммичены и запушены
2. Railway использует правильную версию Node.js (20+)
3. `package.json` содержит правильные зависимости

## Текущее состояние

- ✅ Локальный билд проходит успешно
- ✅ `tsconfig.json` и `jsconfig.json` настроены правильно
- ✅ `baseUrl` и `paths` установлены
- ⚠️ `output: 'standalone'` временно отключен

## Следующие шаги

1. Закоммитьте изменения
2. Запустите новый деплой на Railway
3. Если проблема сохраняется, проверьте логи билда на Railway
4. Возможно, потребуется использовать внешний Dockerfile вместо nixpacks

