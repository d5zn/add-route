# Архитектура синхронизации шаблонов

## Поток данных

```
API Server (PostgreSQL)
    ↓ (загрузка)
useClubStore (Zustand) ← React Query (кеш 5 мин)
    ↓ (клонирование)
useEditorStore (Zustand) ← редактирование
    ↓ (автосохранение 30с / ручное)
useClubStore (обновление) → API Server
```

## Компоненты синхронизации

### 1. **Загрузка данных** (`useClubs`, `useTemplates`)
- React Query загружает данные из API
- Кеширует на 5 минут
- Обновляет `useClubStore` через `setClubs()` / `setTemplates()`

### 2. **Редактирование** (`TemplateEditorPage`)
- При открытии шаблона:
  1. Загружается свежая версия из API (`api.getTemplate()`)
  2. Клонируется в `useEditorStore.setTemplate()`
  3. Все изменения происходят в `useEditorStore`

### 3. **Сохранение**

#### Автосохранение (`useAutoSave`)
- Каждые 30 секунд проверяет изменения
- Если шаблон изменился:
  1. Обновляет `useClubStore.upsertTemplate()`
  2. Отправляет на сервер `api.saveTemplate()`

#### Ручное сохранение (кнопка "Сохранить")
- Сразу обновляет `useClubStore.upsertTemplate()`
- Отправляет на сервер `api.saveTemplate()`
- Показывает статус "Сохранение..."

## Предотвращение бесконечных циклов

### ✅ Решено
1. **Нет автоматического обновления `useEditorStore` из `useClubStore`**
   - Шаблон клонируется только при открытии
   - Изменения в editor не триггерят перезагрузку из store

2. **`summaries` вычисляется через `useMemo`**
   - Не хранится в store
   - Пересчитывается только при изменении `clubs` или `templates`

3. **React Query управляет кешем**
   - Данные загружаются 1 раз
   - Повторные запросы используют кеш

4. **`useRef` для отслеживания загрузок**
   - `lastTemplateIdRef` — предотвращает повторную установку
   - `isSettingRef` — блокирует параллельные установки
   - `hasLoadedFromApiRef` — предотвращает повторные API-вызовы

## Проверка синхронизации

### Тест 1: Открыть шаблон
```typescript
// useClubStore.templates → клонируется → useEditorStore.template
// Изменения в editor НЕ влияют на store до сохранения
```

### Тест 2: Сохранить изменения
```typescript
// useEditorStore.template → upsertTemplate() → useClubStore.templates
// useClubStore.templates → api.saveTemplate() → Server
```

### Тест 3: Автосохранение
```typescript
// Каждые 30с: useEditorStore.template → (если изменен) → save()
```

### Тест 4: Переключение между шаблонами
```typescript
// template A открыт → переход на template B
// lastTemplateIdRef блокирует повторную установку A
// template B загружается свежим из API
```

## API Endpoints

- `GET /route/admin/api/clubs` — список клубов
- `GET /route/admin/api/templates?clubId=...` — шаблоны клуба
- `GET /route/admin/api/templates/:id` — конкретный шаблон
- `POST /route/admin/api/templates/:id` — сохранить шаблон

## Структура Store

### useClubStore (глобальное состояние)
```typescript
{
  clubs: Club[]           // Все клубы
  templates: Template[]   // Все шаблоны
  selectedClubId: string  // Текущий клуб
}
```

### useEditorStore (редактор)
```typescript
{
  state: {
    template: Template    // Редактируемый шаблон (клон)
    pageId: string
    selectedElementIds: string[]
    ui: { zoom, pan, etc }
  }
}
```

## Известные ограничения

1. **Конфликты при одновременном редактировании**
   - Автосохранение перезапишет изменения другого пользователя
   - TODO: добавить версионирование или блокировки

2. **Потеря несохраненных изменений**
   - При закрытии вкладки без сохранения
   - TODO: добавить предупреждение "У вас есть несохраненные изменения"

3. **Размер клона в памяти**
   - Каждый шаблон клонируется целиком
   - Для больших шаблонов (>1000 элементов) может быть медленно

