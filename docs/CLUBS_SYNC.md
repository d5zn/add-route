# Синхронизация клубов и шаблонов

## Обзор

Проект использует единую систему идентификаторов клубов для основного приложения и админ-панели.

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                  │
│                                                          │
│  clubs table:                                            │
│  - id: 'hedonism' | 'not-in-paris'                      │
│  - name, slug, description, theme                        │
│                                                          │
│  templates table:                                        │
│  - club_id references clubs(id)                          │
│  - pages (JSONB with template data)                      │
└─────────────────────────────────────────────────────────┘
            ↓                           ↓
    ┌───────────────┐           ┌──────────────┐
    │ Main App      │           │ Admin Panel  │
    │ (Vanilla JS)  │           │ (React)      │
    │               │           │              │
    │ Clubs:        │           │ Clubs:       │
    │ - hedonism    │           │ - hedonism   │
    │ - not-in-paris│           │ - not-in-paris│
    └───────────────┘           └──────────────┘
```

## Идентификаторы клубов

### Синхронизированные ID

| ID            | Название       | Slug          | Описание                                    |
|---------------|----------------|---------------|---------------------------------------------|
| `hedonism`    | HEDONISM       | hedonism      | Комьюнити любителей бега и хорошего настроения |
| `not-in-paris`| NOT IN PARIS   | not-in-paris  | Клуб бегунов NOT IN PARIS                    |

**Важно:** ID клубов должны быть одинаковыми в:
- База данных PostgreSQL (`clubs.id`)
- Основное приложение (`app-addicted-logic.js`)
- Админ-панель (`admin/src/data/mockClubs.ts`)
- Server API (`server.py`)

## Инициализация клубов в базе данных

### Способ 1: SQL скрипт

```bash
psql $DATABASE_URL -f db/schemas/04_init_clubs.sql
```

### Способ 2: Python скрипт

```bash
python3 init_clubs.py
```

Скрипт автоматически:
- Создает клубы, если их нет
- Обновляет существующие клубы
- Проверяет результат

### Способ 3: Через админ-панель

1. Войдите в админ-панель: `/route/admin`
2. Клубы автоматически загрузятся из `mockClubs.ts`
3. Они будут сохранены в БД при создании первого шаблона

## API Endpoints

### Для админ-панели

```
GET  /route/admin/api/clubs              # Список всех клубов
GET  /route/admin/api/templates          # Все шаблоны
GET  /route/admin/api/templates?clubId=X # Шаблоны клуба
GET  /route/admin/api/templates/:id      # Конкретный шаблон
POST /route/admin/api/templates/:id      # Сохранить шаблон
```

### Для основного приложения

```
GET /api/templates?clubId=X              # Опубликованные шаблоны клуба
```

**Важно:** Основное приложение видит только шаблоны со статусом `published`.

## Статусы шаблонов

| Статус      | Видимость в основном приложении | Видимость в админке |
|-------------|--------------------------------|---------------------|
| `draft`     | ❌ Не виден                     | ✅ Виден            |
| `published` | ✅ Виден                        | ✅ Виден            |
| `archived`  | ❌ Не виден                     | ✅ Виден            |
| `deleted`   | ❌ Не виден                     | ❌ Не виден         |

## Поток работы

### Создание шаблона

1. Открыть админ-панель: `/route/admin`
2. Выбрать клуб
3. Создать новый шаблон (статус `draft`)
4. Отредактировать элементы
5. Опубликовать (изменить статус на `published`)
6. Шаблон становится доступен в основном приложении

### Использование шаблона

1. Открыть основное приложение: `/route/`
2. Подключиться к Strava
3. Выбрать клуб
4. Выбрать тренировку
5. Выбрать опубликованный шаблон из списка
6. Шаблон применяется к визуализации маршрута

## Структура данных

### Клуб (Club)

```typescript
{
  id: string                    // 'hedonism' | 'not-in-paris'
  name: string                  // 'HEDONISM' | 'NOT IN PARIS'
  slug: string                  // URL-friendly имя
  description?: string          // Описание клуба
  logoAssetId?: string          // ID логотипа в assets
  theme: {
    primaryColor: string        // Основной цвет
    secondaryColor: string      // Вторичный цвет
    accentColor: string         // Акцентный цвет
    backgroundColor: string     // Цвет фона
    fontFamily: string          // Шрифт
    texture?: string            // ID текстуры (опционально)
  }
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}
```

### Шаблон (Template)

```typescript
{
  id: string                    // Уникальный ID (nanoid)
  clubId: string                // ID клуба
  name: string                  // Название шаблона
  description?: string          // Описание
  tags: string[]                // Теги для поиска
  pages: Page[]                 // Страницы с элементами
  version: number               // Версия шаблона
  status: 'draft' | 'published' | 'archived' | 'deleted'
  createdAt: string
  updatedAt: string
}
```

## Troubleshooting

### Клубы не отображаются в основном приложении

Проверьте:
1. ID клубов в `app-addicted-logic.js` совпадают с БД
2. Клубы существуют в БД: `SELECT * FROM clubs WHERE status='active'`
3. DATABASE_URL настроен правильно

### Шаблоны не отображаются в основном приложении

Проверьте:
1. Статус шаблона = `published`
2. `club_id` в таблице `templates` совпадает с ID клуба
3. Запрос: `SELECT * FROM templates WHERE club_id='hedonism' AND status='published'`

### Изменения в админке не видны в основном приложении

1. Убедитесь, что шаблон сохранен (статус в админке показывает "Saved")
2. Проверьте, что статус = `published`
3. Обновите страницу основного приложения
4. Проверьте консоль браузера на ошибки API

## Migration Guide

Если у вас уже есть клубы с другими ID в БД:

### Шаг 1: Создать backup

```bash
pg_dump $DATABASE_URL > backup.sql
```

### Шаг 2: Обновить ID клубов

```sql
-- Обновить ID клубов
UPDATE clubs SET id = 'hedonism' WHERE id = 'club-hc';
UPDATE clubs SET id = 'not-in-paris' WHERE id = 'club-nip';

-- Обновить ссылки в шаблонах
UPDATE templates SET club_id = 'hedonism' WHERE club_id = 'club-hc';
UPDATE templates SET club_id = 'not-in-paris' WHERE club_id = 'club-nip';
```

### Шаг 3: Проверить результат

```sql
SELECT id, name, slug FROM clubs;
SELECT id, club_id, name, status FROM templates;
```

## Проверка синхронизации

Используйте этот контрольный список:

- [ ] ID клубов в `app-addicted-logic.js` = ID в `mockClubs.ts`
- [ ] ID клубов в БД совпадают с кодом
- [ ] Маппинг в `server.py` отключен (ID синхронизированы)
- [ ] Шаблоны имеют правильный `club_id`
- [ ] Опубликованные шаблоны видны в основном приложении
- [ ] Черновики шаблонов не видны в основном приложении
- [ ] Клубы видны в админ-панели
- [ ] При создании шаблона можно выбрать клуб

## Полезные запросы

```sql
-- Все активные клубы
SELECT id, name, slug FROM clubs WHERE status = 'active';

-- Все шаблоны клуба
SELECT id, name, status FROM templates WHERE club_id = 'hedonism';

-- Опубликованные шаблоны для основного приложения
SELECT id, name FROM templates 
WHERE club_id = 'hedonism' AND status = 'published';

-- Статистика по шаблонам
SELECT club_id, status, COUNT(*) 
FROM templates 
GROUP BY club_id, status;
```

