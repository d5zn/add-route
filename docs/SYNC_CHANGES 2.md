# Изменения синхронизации клубов - 2024-11-14

## Проблема

Клубы и шаблоны не были синхронизированы между основным приложением и админ-панелью из-за несовпадения идентификаторов:

- **Основное приложение** использовало: `hedonism`, `not-in-paris`
- **Админ-панель** использовала: `club-hc`, `club-nip`
- **Server.py** имел маппинг, но он был неправильным

Это приводило к тому, что:
- Шаблоны, созданные в админке, не отображались в основном приложении
- Невозможно было правильно связать клубы и шаблоны
- API возвращал пустые массивы шаблонов

## Решение

### 1. Унифицированы ID клубов

Теперь везде используются одинаковые ID:
- `hedonism` - для клуба HEDONISM
- `not-in-paris` - для клуба NOT IN PARIS

### 2. Обновлены файлы

#### `/admin/src/data/mockClubs.ts`
```typescript
// Было:
{ id: 'club-hc', name: 'Hedonism Club', slug: 'hedonism-club' }
{ id: 'club-nip', name: 'NIP Runners', slug: 'nip-runners' }

// Стало:
{ id: 'hedonism', name: 'HEDONISM', slug: 'hedonism' }
{ id: 'not-in-paris', name: 'NOT IN PARIS', slug: 'not-in-paris' }
```

#### `/server.py`
```python
# Было:
club_id_mapping = {
    'not-in-paris': 'club-nip',
    'hedonism': 'club-hc',
}
mapped_club_id = club_id_mapping.get(club_id, club_id)

# Стало:
# No mapping needed - IDs are now synchronized
mapped_club_id = club_id
```

### 3. Созданы инструменты инициализации

#### SQL скрипт
`/db/schemas/04_init_clubs.sql` - для прямой инициализации через PostgreSQL

#### Python скрипт
`/init_clubs.py` - для инициализации через Python с проверками

### 4. Создана документация

`/docs/CLUBS_SYNC.md` - полная документация по синхронизации

## Структура API

### Admin Panel API
```
GET  /route/admin/api/clubs              → все клубы
GET  /route/admin/api/templates          → все шаблоны
GET  /route/admin/api/templates?clubId=X → шаблоны клуба X
POST /route/admin/api/templates/:id      → сохранить шаблон
```

### Main App API
```
GET /api/templates?clubId=X              → published шаблоны клуба X
```

## Что нужно сделать после деплоя

1. **Инициализировать клубы в БД:**
   ```bash
   python3 init_clubs.py
   ```
   или
   ```bash
   psql $DATABASE_URL -f db/schemas/04_init_clubs.sql
   ```

2. **Пересобрать админ-панель:**
   ```bash
   cd admin
   npm run build
   ```

3. **Проверить работу:**
   - Открыть основное приложение: `/route/`
   - Подключиться к Strava
   - Выбрать клуб (должны отображаться: HEDONISM, NOT IN PARIS)
   - Проверить, что шаблоны загружаются

4. **Создать тестовый шаблон в админке:**
   - Открыть админ-панель: `/route/admin`
   - Войти (admin / 54321 по умолчанию)
   - Выбрать клуб
   - Создать шаблон
   - Опубликовать (изменить статус на "published")
   - Проверить, что он виден в основном приложении

## Migration для существующих данных

Если в БД уже есть клубы и шаблоны со старыми ID:

```sql
-- 1. Backup
pg_dump $DATABASE_URL > backup.sql

-- 2. Update club IDs
UPDATE clubs SET id = 'hedonism' WHERE id = 'club-hc';
UPDATE clubs SET id = 'not-in-paris' WHERE id = 'club-nip';

-- 3. Update template references
UPDATE templates SET club_id = 'hedonism' WHERE club_id = 'club-hc';
UPDATE templates SET club_id = 'not-in-paris' WHERE club_id = 'club-nip';

-- 4. Verify
SELECT id, name FROM clubs;
SELECT id, club_id, name FROM templates;
```

## Проверочный чеклист

После внедрения изменений проверьте:

- [ ] Клубы отображаются в основном приложении
- [ ] Клубы отображаются в админ-панели
- [ ] Можно создать шаблон в админке
- [ ] Шаблон со статусом "published" виден в основном приложении
- [ ] Шаблон со статусом "draft" НЕ виден в основном приложении
- [ ] При выборе клуба загружаются его шаблоны
- [ ] API не возвращает ошибок 404 или 500
- [ ] Console в браузере не показывает ошибок

## Важные замечания

1. **Статусы шаблонов:**
   - `draft` - только в админке
   - `published` - виден везде
   - `archived` - только в админке
   - `deleted` - не виден нигде

2. **Кеширование:**
   - React Query кеширует на 5 минут
   - При изменениях в админке обновите основное приложение

3. **Версионирование:**
   - Каждое сохранение увеличивает `version`
   - При конфликтах выигрывает последнее сохранение

## Контакты

При проблемах проверьте:
- Логи сервера: `python3 server.py`
- Консоль браузера: DevTools → Console
- Сеть: DevTools → Network → XHR
- База данных: `psql $DATABASE_URL`

