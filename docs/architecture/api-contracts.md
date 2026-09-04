# API Contracts — QalaGo

**Version:** v1  
**Base URL:** `/api/v1`  
**Status:** Implemented in `services/catalog-api` (MVP scope).

Roles and permissions: [rbac.md](./rbac.md).

All list endpoints accept:

| Param | Type | Required | Default |
|-------|------|----------|---------|
| `citySlug` | string | no | `uralsk` |
| `cityId` | string | no | resolves from slug |

---

## Auth

### POST /auth/send-code

Request:
```json
{ "phone": "+77001234567" }
```

Response `200`:
```json
{ "success": true, "expiresInSec": 300 }
```

> Dev only with `OTP_DEBUG=true`: may include `"debugCode"`. **Never in production.**

### POST /auth/verify-code

Request:
```json
{ "phone": "+77001234567", "code": "1234", "name": "Optional" }
```

Response `200`:
```json
{
  "accessToken": "jwt...",
  "user": { "id": "...", "phone": "+77001234567", "name": null, "role": "USER" }
}
```

### GET /auth/me

Headers: `Authorization: Bearer <token>`

Response `200`: JWT payload + user fields.

---

## Users

### GET /users/me

Includes `preferredCity`, and for `CITY_ADMIN` also `managedCity` (city scope for moderation).

### PATCH /users/me

Body: `{ "name": "string", "preferredCityId": "string?" }`

### Admin (platform)

- `GET /admin/users` — **ADMIN only**
- `PATCH /admin/users/:id/role` — **ADMIN only**

---

## Cities

### GET /cities

Response: active cities list.

### GET /cities/:slug

Single city metadata (center, timezone, name ru/kk).

---

## Categories

### GET /categories

Query: `citySlug` (optional display order per city later).

### Admin

- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

---

## Businesses

### GET /businesses

Query:

| Param | Type |
|-------|------|
| page, limit | number |
| categoryId | string |
| search | string |
| featured | boolean |
| status | ACTIVE (public default) |
| citySlug / cityId | string |
| latitude, longitude | number — user position; sorts by distance ascending |
| radiusKm | number (default 15) — max distance in km when geo params set |

When `latitude` and `longitude` are provided, each item may include `distanceMeters` (integer). Businesses without coordinates are listed after geo-sorted items.

### GET /businesses/:id

### GET /businesses/my

Owner: own businesses.

### GET /businesses/recommended/me

Auth user recommendations (rule-based MVP; AI later).

### PATCH /businesses/:id

Owner or admin. Body (all optional): `title`, `shortDesc`, `description`, `address`, `latitude`, `longitude`, `phone`, `whatsapp`, `instagram`, `website`, `coverImageUrl`, `workHours` (object: `{ "mon": "09:00-22:00", ... }`).

### Admin

- `GET /admin/businesses?status=&citySlug=&page=&limit=` — pagination via `meta`; `CITY_ADMIN` scoped to `managedCityId`.
- `PATCH /admin/businesses/:id/status`
- `PATCH /admin/businesses/:id/featured` — body: `{ isFeatured, featuredSlot? }`
- `GET /admin/categories` — all categories including hidden (ADMIN, CITY_ADMIN)
- `GET /admin/users` — ADMIN only
- `PATCH /admin/users/:id/role` — ADMIN only; body: `{ role, managedCityId? }` (required when role is CITY_ADMIN)
- `GET /admin/reviews?citySlug=&limit=` — reviews scoped by admin city; includes user + business
- `DELETE /admin/reviews/:id` — remove review (city-scoped for CITY_ADMIN)

---

## Service menu (groups + items)

Menu is **two levels**: **group** (e.g. «Горячие блюда», «Стрижка») → **items** (e.g. «Борщ», «Борода»).

### GET /service-menu?businessId=

Public. Response:

```json
{
  "groups": [
    {
      "id": "...",
      "title": "Стрижка",
      "sortOrder": 1,
      "items": [{ "id": "...", "title": "Борода", "price": "2000", ... }]
    }
  ],
  "ungrouped": []
}
```

Only active groups and items.

### GET /service-menu/manage/:businessId

Auth: owner / admin. Same shape, includes hidden groups/items.

### Service menu groups

- `POST /service-menu-groups` — `{ "businessId", "title", "description?", "sortOrder?" }`
- `PATCH /service-menu-groups/:id` — `{ "title?", "description?", "isActive?", "sortOrder?" }`
- `DELETE /service-menu-groups/:id` — items become ungrouped (`groupId` set null)

### GET /businesses/:id

Includes `menu` (same shape as `/service-menu`).

## Service items (positions inside a group)

### GET /service-items?businessId=

Public flat list (legacy). Prefer `/service-menu`.

### GET /service-items/manage/:businessId

Auth: BUSINESS owner, ADMIN, CITY_ADMIN. All items including hidden.

### POST /service-items

Body: `{ "businessId", "groupId?", "title", "description?", "price?", "imageUrl?", "sortOrder?" }`

### PATCH /service-items/:id

Body may include `groupId` to move item into another group.

### DELETE /service-items/:id

---

## Promotions

### GET /promotions

Query: `activeNow`, `page`, `limit`, `citySlug`

Response item includes `{ id, businessId, title, description?, imageUrl?, discountText?, startDate?, endDate?, status, business }`.

### Owner CRUD

- `POST /promotions`
- `PATCH /promotions/:id`
- `DELETE /promotions/:id`

---

## Reviews

- `GET /reviews?businessId=`
- `GET /reviews/me` — отзывы текущего пользователя (auth)
- `POST /reviews`
- `PATCH /reviews/:id/reply` (owner)

---

## Favorites

- `GET /favorites`
- `GET /favorites/check/:businessId`
- `POST /favorites` body: `{ "businessId": "..." }`
- `DELETE /favorites/:businessId`

---

## Notifications

- `GET /notifications`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

---

## Analytics

Analytics ingest is public so anonymous users still contribute city demand data.
Business dashboards are protected: business owner, `CITY_ADMIN`, or `ADMIN`.

### POST /analytics/events

Request:
```json
{ "businessId": "...", "type": "VIEW_BUSINESS" }
```

Supported event types:
`VIEW_BUSINESS`, `CALL_CLICK`, `WHATSAPP_CLICK`, `ROUTE_CLICK`,
`FAVORITE_ADD`, `FAVORITE_REMOVE`, `PROMOTION_VIEW`.

Response `201`:
```json
{ "success": true }
```

### GET /analytics/business/:businessId/summary

Query: `days` (optional, 1-90, default `30`)

Response `200`:
```json
{
  "businessId": "...",
  "days": 30,
  "total": 42,
  "byType": {
    "VIEW_BUSINESS": 30,
    "CALL_CLICK": 4,
    "WHATSAPP_CLICK": 3,
    "ROUTE_CLICK": 5
  }
}
```

### GET /analytics/business/:businessId/trends

Query: `days` (optional, 1-90, default `30`)

Response `200`:
```json
{
  "businessId": "...",
  "days": 30,
  "items": [
    { "date": "2026-08-29", "type": "VIEW_BUSINESS", "count": 7 }
  ]
}
```

---

## Uploads

Static files served at `/uploads/*` (not under `/api/v1`).

### POST /uploads

Multipart field `file` (JPEG/PNG/WebP/GIF, max 5 MB).

Response `200`:
```json
{ "url": "/uploads/uuid.jpg" }
```

### POST /uploads/business/:businessId

Attach uploaded image to business (owner/admin).

Body:
```json
{ "imageUrl": "/uploads/uuid.jpg", "asCover": true }
```

### GET /uploads/business/:businessId/images

Auth: owner / admin. List gallery images ordered by `sortOrder`.

### DELETE /uploads/business/:businessId/images/:imageId

Auth: owner / admin. Removes image; if it was cover, next image becomes cover.

### PATCH /uploads/business/:businessId/images/:imageId/cover

Auth: owner / admin. Sets business cover to this image.

---

## Notifications

In-app notifications (push/FCM — phase 3).

### GET /notifications

List last 50 notifications for current user.

### GET /notifications/unread-count

Response: `{ "count": 3 }`

### PATCH /notifications/:id/read

### PATCH /notifications/read-all

Notification types: `GENERAL`, `NEW_REVIEW`, `REVIEW_REPLY`, `BUSINESS_APPROVED`, `BUSINESS_BLOCKED`, `NEW_PROMOTION`

---

## AI Orchestrator (Phase 4 scaffold)

Base URL (separate service): `http://localhost:3004/api/v1`

- `GET /health`
- `GET /agents` — registered agent metadata
- `POST /recommendations` — body `{ "citySlug": "uralsk", "limit": 10 }`, optional `Authorization` for personalized results via catalog-api read tools
- `POST /moderation/analyze` — body `{ "text": "string", "rating": 1-5?, "reviewId": "string?" }` → rule-based moderation assist (no side effects)

Response `200`:
```json
{
  "agent": "moderation-agent",
  "source": "rule-based",
  "score": 85,
  "flags": [{ "code": "TOO_SHORT", "message": "...", "severity": "low" }],
  "suggestedAction": "approve"
}
```

`suggestedAction`: `approve` | `review` | `reject` — hint for human moderator only; does not change review status.

- `POST /content/draft` — body `{ "citySlug": "uralsk", "topic": "food|weekend|...", "limit": 5 }` → editorial markdown draft (rule-based, no publish)

Response `200`:
```json
{
  "agent": "content-agent",
  "citySlug": "uralsk",
  "title": "Где поесть в Уральске",
  "bodyMarkdown": "...",
  "businessIds": ["..."],
  "source": "rule-based"
}
```

---

## Health

- `GET /health` — `{ "status": "ok" }`

---

## Common errors

| Code | Meaning |
|------|---------|
| 400 | Validation error |
| 401 | Missing/invalid token |
| 403 | Forbidden role/resource |
| 404 | Not found |
| 429 | Rate limited |

Error body:
```json
{ "statusCode": 400, "message": ["..."], "error": "Bad Request" }
```

---

## Change policy

1. Edit this file first.
2. Bump version section if breaking change.
3. Implement in `services/catalog-api`.
4. Update `packages/shared-types` and mobile clients.
