# API Endpoints Reference

## Overview

Сервер предоставляет два набора API эндпоинтов:
1. **Admin API** - для админ-панели (React приложение)
2. **Public API** - для основного приложения (vanilla JS)

## Authentication

### Admin Endpoints
- Требуют аутентификацию через сессионные cookies
- Login: `POST /route/admin/api/login`
- Logout: `POST /route/admin/api/logout`

### Public Endpoints
- Не требуют аутентификации
- Открыты для всех пользователей основного приложения

## Admin API Endpoints

Base path: `/route/admin/api`

### Clubs

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/route/admin/api/clubs` | Получить все клубы | Yes |

**Response:**
```json
{
  "clubs": [
    {
      "id": "hedonism",
      "name": "HEDONISM",
      "slug": "hedonism",
      "description": "...",
      "theme": {
        "primaryColor": "#FF5A5F",
        "secondaryColor": "#00A699",
        "accentColor": "#FC642D",
        "backgroundColor": "#FFFFFF",
        "fontFamily": "Inter, ..."
      },
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Templates

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/route/admin/api/templates` | Получить все шаблоны | Yes |
| `GET` | `/route/admin/api/templates?clubId=X` | Получить шаблоны клуба | Yes |
| `GET` | `/route/admin/api/templates/:id` | Получить конкретный шаблон | Yes |
| `POST` | `/route/admin/api/templates/:id` | Сохранить/обновить шаблон | Yes |

**Response (GET all/by club):**
```json
{
  "templates": [
    {
      "id": "template-id-123",
      "clubId": "hedonism",
      "name": "Анонс забега",
      "description": "...",
      "tags": ["running", "event"],
      "version": 1,
      "status": "draft",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "pages": [...]
    }
  ]
}
```

**Response (GET single):**
```json
{
  "template": {
    "id": "template-id-123",
    "clubId": "hedonism",
    "name": "Анонс забега",
    "description": "...",
    "tags": ["running", "event"],
    "version": 1,
    "status": "draft",
    "pages": [
      {
        "id": "page-1",
        "name": "Main",
        "size": { "width": 1080, "height": 1920 },
        "background": { "color": "#ffffff" },
        "layers": [
          {
            "id": "layer-1",
            "name": "Content",
            "visible": true,
            "locked": false,
            "elements": []
          }
        ]
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Request (POST save):**
```json
{
  "id": "template-id-123",
  "clubId": "hedonism",
  "name": "Анонс забега Updated",
  "description": "...",
  "tags": ["running", "event", "new"],
  "version": 2,
  "status": "published",
  "pages": [...]
}
```

**Response (POST):**
```json
{
  "success": true,
  "message": "Template saved successfully"
}
```

### Import Templates

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/route/admin/api/import-templates` | Импорт шаблонов из JSON | Yes |

**Request:**
```json
{
  "templates": [
    {
      "clubId": "hedonism",
      "name": "Template 1",
      "pages": [...]
    }
  ]
}
```

### Assets Upload

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/route/admin/api/upload-asset` | Загрузить изображение/логотип | Yes |

**Request:** multipart/form-data with file

**Response:**
```json
{
  "assetId": "asset-id-123",
  "url": "/uploads/asset-id-123.png"
}
```

## Public API Endpoints

Base path: `/api` or `/route/api`

### Templates

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/templates?clubId=X` | Получить published шаблоны клуба | No |

**Response:**
```json
{
  "templates": [
    {
      "id": "template-id-123",
      "name": "Анонс забега",
      "description": "...",
      "config": {
        "backgroundMode": "image",
        "fontColor": "white",
        "isMono": false
      }
    }
  ]
}
```

**Important:** Этот эндпоинт возвращает только шаблоны со статусом `published`. Черновики и архивные шаблоны не отображаются.

### Strava OAuth

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/strava/token` | Обмен authorization code на access token | No |

**Request:**
```json
{
  "code": "authorization_code_from_strava"
}
```

**Response:**
```json
{
  "access_token": "token",
  "refresh_token": "refresh",
  "expires_at": 1234567890,
  "athlete": {
    "id": 123456,
    "username": "athlete",
    "firstname": "John",
    "lastname": "Doe"
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid JSON or missing parameters |
| `401` | Unauthorized - Authentication required |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `500` | Internal Server Error - Server-side error |

## Implementation Details

### Club ID Synchronization

Оба приложения используют одинаковые ID клубов:
- `hedonism` - HEDONISM club
- `not-in-paris` - NOT IN PARIS club

**Нет маппинга ID между приложениями!**

### Template Status Flow

```
draft → published → archived → deleted
  ↓         ↓          ↓         ↓
Admin   Admin +    Admin      Hidden
only    Public     only       everywhere
```

### Database Tables

#### clubs
- `id` (VARCHAR) - Primary key, used in both apps
- `name`, `slug`, `description`
- `theme` (JSONB) - Club theme configuration
- `status` - 'active' | 'archived'

#### templates
- `id` (VARCHAR) - Primary key
- `club_id` (VARCHAR) - Foreign key to clubs
- `name`, `description`
- `tags` (JSONB) - Array of tags
- `pages` (JSONB) - Template pages with elements
- `version` (INTEGER) - Template version
- `status` - 'draft' | 'published' | 'archived' | 'deleted'

## Examples

### Get clubs in admin
```bash
curl -X GET 'http://localhost:8000/route/admin/api/clubs' \
  -H 'Cookie: admin_session=xxx' \
  -H 'Content-Type: application/json'
```

### Get published templates for main app
```bash
curl -X GET 'http://localhost:8000/api/templates?clubId=hedonism'
```

### Save template in admin
```bash
curl -X POST 'http://localhost:8000/route/admin/api/templates/template-id-123' \
  -H 'Cookie: admin_session=xxx' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "template-id-123",
    "clubId": "hedonism",
    "name": "Updated Template",
    "status": "published",
    "pages": [...]
  }'
```

## Testing

### Using curl
```bash
# Test public endpoint
curl 'http://localhost:8000/api/templates?clubId=hedonism'

# Test admin endpoint (requires login first)
curl 'http://localhost:8000/route/admin/api/clubs' \
  -H 'Cookie: admin_session=xxx'
```

### Using browser DevTools
1. Open browser console
2. Run:
```javascript
// Test public API
fetch('/api/templates?clubId=hedonism')
  .then(r => r.json())
  .then(console.log)

// Test admin API (after login)
fetch('/route/admin/api/clubs', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

## Rate Limiting

Server implements rate limiting:
- **100 requests per 60 seconds per IP**
- Exceeding limit returns `429 Too Many Requests`

## CORS & Security

### CORS Headers
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### CSP Headers
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```

### Admin Session
- Sessions stored in cookies
- HMAC-SHA256 signature verification
- Expires after inactivity
- Secure flag in production

## See Also

- [CLUBS_SYNC.md](./CLUBS_SYNC.md) - Clubs synchronization details
- [SYNC_CHANGES.md](./SYNC_CHANGES.md) - Recent synchronization changes
- [db/schemas/](../db/schemas/) - Database schemas

