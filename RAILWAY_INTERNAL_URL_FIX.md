# Исправление проблемы с Railway Internal URL

## Проблема

Railway использует внутренний URL для DATABASE_URL во время выполнения:
```
postgresql://postgres:password@postgres-ozrq.railway.internal:5432/railway
```

Этот URL **недоступен во время билда**, так как билд происходит в отдельном контейнере, который не имеет доступа к внутренней сети Railway.

## Решение

### 1. Обновлен `lib/db.ts`

Теперь код:
- Определяет фазу билда
- Использует placeholder URL для Railway internal URLs во время билда
- Отключает попытки подключения к БД во время билда
- Переопределяет `$connect()` чтобы предотвратить подключение во время билда

### 2. Обновлен `next.config.ts`

Добавлено:
- `output: 'standalone'` для правильной работы в Railway
- Отключена статическая генерация API routes

## Как это работает

1. **Во время билда:**
   - Код определяет, что используется Railway internal URL
   - Использует placeholder URL для генерации Prisma Client
   - Отключает попытки подключения к БД
   - Билд проходит успешно

2. **Во время выполнения:**
   - Используется реальный DATABASE_URL
   - Prisma подключается к БД нормально
   - Все работает как ожидается

## Проверка

После применения исправлений:
1. Запустите новый деплой на Railway
2. Билд должен пройти успешно
3. После деплоя приложение должно подключиться к БД

## Альтернативное решение (если проблема сохраняется)

Если проблема все еще есть, можно использовать внешний URL для DATABASE_URL:

1. В Railway Dashboard → PostgreSQL → Settings
2. Найдите "Public Networking" или "Connection Pooling"
3. Используйте внешний URL вместо internal URL

Или создайте отдельную переменную для билда:
```bash
# Для билда (если нужен внешний URL)
DATABASE_URL_BUILD=postgresql://postgres:password@external-host:5432/railway

# Для выполнения (internal URL)
DATABASE_URL=postgresql://postgres:password@postgres-ozrq.railway.internal:5432/railway
```

Но текущее решение должно работать без дополнительных настроек.

