# Веб-интерфейс для синхронизации шаблонов

## Обзор

Создан веб-интерфейс для управления синхронизацией шаблонов между основным приложением (`app-addicted-logic.js`) и админкой. Теперь можно синхронизировать фолбэк-шаблоны прямо из браузера без необходимости локального доступа к базе данных.

## Доступ к интерфейсу

### URL
```
https://your-domain.railway.app/route/admin/sync
```

Или локально:
```
http://localhost:8000/route/admin/sync
```

## Возможности

### 1. Проверка текущего состояния шаблонов

- Показывает все клубы и их шаблоны
- Отображает статус каждого шаблона (published, draft, archived)
- Показывает статистику по количеству шаблонов

**Кнопка:** "Проверить шаблоны"

### 2. Синхронизация фолбэк-шаблонов

- Импортирует фолбэк-шаблоны из кода в базу данных
- Создает отсутствующие шаблоны
- Обновляет статус существующих шаблонов на "published"
- Показывает детальную статистику результатов

**Кнопка:** "Запустить синхронизацию"

## API Endpoints

### GET `/route/admin/api/check-templates`

Проверяет текущее состояние шаблонов в базе данных.

**Response:**
```json
{
  "clubs": [
    {
      "id": "not-in-paris",
      "name": "NOT IN PARIS",
      "slug": "not-in-paris",
      "status": "active"
    }
  ],
  "templates": [
    {
      "id": "nip-classic",
      "club_id": "not-in-paris",
      "name": "Classic Route",
      "status": "published",
      "version": 1,
      "created_at": "2024-11-14T...",
      "updated_at": "2024-11-14T..."
    }
  ],
  "stats": [
    {
      "club_id": "not-in-paris",
      "status": "published",
      "count": 3
    }
  ]
}
```

### POST `/route/admin/api/sync-templates`

Синхронизирует фолбэк-шаблоны с базой данных.

**Response:**
```json
{
  "success": true,
  "created": 2,
  "updated": 1,
  "skipped": 0,
  "results": [
    {
      "action": "created",
      "id": "nip-classic",
      "name": "Classic Route",
      "status": "published"
    }
  ]
}
```

## Фолбэк-шаблоны

### NOT IN PARIS

1. **nip-classic** - Classic Route
   - Standard overlay with club logo and clean typography
   - Background: Image
   - Badge: Default

2. **nip-mono** - Mono Cut
   - High-contrast monochrome look for bold storytelling
   - Background: Image (Monochrome)
   - Badge: Alt

3. **nip-gradient** - Sunset Fade
   - Gradient background with bright typography accents
   - Background: Gradient
   - Badge: Special

### HEDONISM

1. **hedonism-classic** - Hedonism Core
   - Signature hedonism palette with vivid logo lockup
   - Background: Image
   - Badge: Default

2. **hedonism-night** - Night Drive
   - Dark mode composition with neon typography highlights
   - Background: Solid
   - Badge: Alt

3. **hedonism-mono** - Mono Pulse
   - Monochrome variant for poster-ready storytelling
   - Background: Image (Monochrome)
   - Badge: Mono

## Как использовать

### Первичная синхронизация

1. Откройте `/route/admin/sync` в браузере
2. Страница автоматически проверит текущее состояние
3. Если шаблонов нет или они в статусе draft, нажмите "Запустить синхронизацию"
4. Дождитесь завершения (будет показана статистика)
5. Обновите основное приложение (Ctrl+Shift+R) и админку
6. Шаблоны должны быть видны в обоих приложениях

### Регулярное использование

**Когда использовать:**
- После деплоя новой версии
- Когда основное приложение показывает фолбэк-шаблоны вместо данных из БД
- Когда админка показывает шаблоны в статусе draft вместо published
- После восстановления базы данных

**Порядок действий:**
1. Зайти на страницу синхронизации
2. Проверить текущее состояние
3. Если нужно - запустить синхронизацию
4. Проверить результаты
5. Обновить приложения

## Устранение неполадок

### Ошибка: "Database connection failed"

**Причина:** Не удается подключиться к базе данных

**Решение:**
1. Проверьте, что PostgreSQL сервис запущен на Railway
2. Проверьте переменную окружения `DATABASE_URL`
3. Перезапустите приложение

### Шаблоны созданы, но не видны в основном приложении

**Причина:** Кеш браузера

**Решение:**
1. Откройте основное приложение
2. Нажмите Ctrl+Shift+R (hard refresh)
3. Если не помогло, откройте DevTools → Application → Clear storage

### Шаблоны созданы, но показывают статус "draft"

**Причина:** Синхронизация не была запущена, или шаблоны были созданы вручную

**Решение:**
1. Запустите синхронизацию через веб-интерфейс
2. Синхронизация обновит статус на "published"

### API возвращает 500 ошибку

**Причина:** Ошибка на сервере

**Решение:**
1. Откройте логи Railway: `railway logs`
2. Найдите ошибку в Python traceback
3. Проверьте структуру таблицы `templates` в БД
4. При необходимости пересоздайте таблицы через SQL схемы

## Архитектура

### Компоненты

```
┌─────────────────────────────────────────────────────────────┐
│ admin_sync.html                                              │
│ - Веб-интерфейс для синхронизации                            │
│ - JavaScript для вызова API                                  │
│ - Отображение результатов                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ server.py                                                    │
│                                                              │
│ GET /route/admin/api/check-templates                         │
│   → handle_admin_check_templates()                           │
│   → Читает из БД текущие шаблоны и статистику               │
│                                                              │
│ POST /route/admin/api/sync-templates                         │
│   → handle_admin_sync_templates()                            │
│   → Создает/обновляет фолбэк-шаблоны в БД                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ PostgreSQL Database                                          │
│                                                              │
│ Tables:                                                      │
│   - clubs (id, name, slug, status)                           │
│   - templates (id, club_id, name, status, pages, ...)       │
└─────────────────────────────────────────────────────────────┘
```

### Логика синхронизации

```python
for club_id, templates in fallback_templates.items():
    for template in templates:
        existing = db.query("SELECT * FROM templates WHERE id = ?", template.id)
        
        if existing:
            if existing.status != 'published':
                db.update("UPDATE templates SET status='published'")
                # Обновлен
            else:
                # Пропущен (уже опубликован)
        else:
            db.insert("INSERT INTO templates (...)")
            # Создан
```

## Интеграция с админкой

Страница синхронизации доступна из админки:

1. Откройте `/route/admin`
2. В меню (если есть) выберите "Синхронизация"
3. Или перейдите напрямую на `/route/admin/sync`

## Безопасность

⚠️ **Внимание:** В текущей версии проверка аутентификации временно отключена для быстрого тестирования.

**В production рекомендуется:**
1. Включить проверку `is_admin_authenticated()` для `/route/admin/sync`
2. Добавить CSRF защиту для POST запросов
3. Ограничить доступ к API endpoints только для аутентифицированных админов

## Следующие шаги

После успешной синхронизации:

1. **Проверьте основное приложение:**
   - Откройте `/route/`
   - Подключитесь к Strava
   - Выберите клуб
   - Проверьте, что шаблоны загружаются из БД (не фолбэк)

2. **Проверьте админку:**
   - Откройте `/route/admin`
   - Выберите клуб
   - Убедитесь, что шаблоны показаны как "published"
   - Попробуйте отредактировать шаблон

3. **Создайте новые шаблоны:**
   - Через админку создайте новый шаблон
   - Установите статус "published"
   - Проверьте, что он виден в основном приложении

## См. также

- `/docs/TEMPLATE_SYNC_FIX.md` - Подробное описание проблемы синхронизации
- `/docs/API_ENDPOINTS.md` - Документация всех API endpoints
- `/docs/ARCHITECTURE_ANALYSIS.md` - Анализ архитектуры приложения
- `/sync_fallback_templates.py` - Python скрипт для локальной синхронизации

