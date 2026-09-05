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
{ "phone": "+77001234567", "code": "1234", "name": "Optional", "accountType": "user" }
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountType` | `"user"` \| `"business"` | no | При **первой** регистрации задаёт роль `USER` или `BUSINESS`. Для существующего `USER` значение `business` повышает роль до `BUSINESS`. Роли `ADMIN`, `CITY_ADMIN`, `BUSINESS` не понижаются. |

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

### Admin (platform ADMIN only)

- `GET /admin/cities` — all cities including inactive
- `POST /admin/cities` — create city; auto-bootstraps category order from default city (`uralsk`)

Body:
```json
{
  "slug": "astana",
  "nameRu": "Астана",
  "nameKk": "Астана",
  "centerLat": 51.1694,
  "centerLng": 71.4491,
  "timezone": "Asia/Almaty",
  "isActive": true,
  "launchStatus": "COMING_SOON"
}
```

`launchStatus`: `COMING_SOON` | `LIVE` (default `LIVE` for active cities).

- `PATCH /admin/cities/:id` — update `{ nameRu?, nameKk?, centerLat?, centerLng?, timezone?, isActive?, launchStatus? }`

Slug: lowercase latin, digits, hyphens; unique. Inactive cities hidden from public `GET /cities`.

### GET /admin/geo/search

Query: `q` (min 2 chars), `country` (optional, default `kz`). **ADMIN only.**

Geocoding via OpenStreetMap Nominatim. Returns city suggestions with coordinates and timezone guess:

```json
[
  {
    "nameRu": "Астана",
    "nameKk": null,
    "lat": 51.1694,
    "lng": 71.4491,
    "displayName": "Астана, Казахстан",
    "slugSuggestion": "astana",
    "timezone": "Asia/Almaty"
  }
]
```

---

## Categories

### GET /categories

Query: `citySlug` (optional, default `uralsk`). Returns active categories visible in the city, sorted by city-specific order when set.

### Admin

- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`
- `GET /admin/categories?citySlug=` — all categories including hidden; each row includes `citySortOrder` and `effectiveSortOrder`
- `PATCH /admin/categories/:id/city-order` — body `{ "citySlug", "sortOrder" }` (ADMIN, CITY_ADMIN scoped to managed city)
- `PATCH /admin/categories/:id/city-visibility` — body `{ "citySlug", "isHidden" }` — hide category in one city only

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

**Catalog sort order (all list modes):** effective paid tier first — `TOP_CITY` → `PRO` → `BASIC` (expired paid treated as BASIC), then `featuredSlot` ascending within TOP, then `isFeatured`, then title. With geo params, tier rank applies before distance within the same tier.

List items include `planTier`, `planExpiresAt`, `featuredSlot`, `isFeatured` when selected for catalog responses.

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
- `PATCH /admin/businesses/:id/plan` — body: `{ tier: "BASIC"|"PRO"|"TOP_CITY" }` — назначить тариф без оплаты (30 дней для paid)
- `GET /admin/categories?citySlug=` — all categories including hidden; includes `citySortOrder`, `effectiveSortOrder`
- `PATCH /admin/categories/:id/city-order` — body `{ "citySlug", "sortOrder" }`
- `GET /admin/users` — ADMIN only
- `PATCH /admin/users/:id/role` — ADMIN only; body: `{ role, managedCityId? }` (required when role is CITY_ADMIN)
- `GET /admin/reviews?citySlug=&limit=` — reviews scoped by admin city; includes user + business
- `DELETE /admin/reviews/:id` — remove review (city-scoped for CITY_ADMIN)

---

## Business plans (tariffs)

Tiers: `BASIC` (free), `PRO`, `TOP_CITY`. Limits enforced server-side (photos, promotions, analytics depth, city feed).

### GET /plans

Public catalog of tiers with prices, features, and limit matrix.

### GET /businesses/:businessId/plan

Auth: owner, ADMIN, CITY_ADMIN. Current tier, effective tier (expired paid → BASIC), usage vs limits.

Response includes `usage.photos`, `usage.activePromotions`, `limits`, `expiresAt`.

### POST /businesses/:businessId/plan/mock-checkout

Auth: owner (or admin). **MVP test payment — no real charge.**

Body:
```json
{ "tier": "PRO" }
```

`tier`: `BASIC` | `PRO` | `TOP_CITY`

Response `200`:
```json
{
  "success": true,
  "mock": true,
  "message": "Тариф подключён (тестовая оплата без списания)",
  "business": { "planTier": "PRO", "planExpiresAt": "...", "isFeatured": true, "featuredSlot": null },
  "plan": { "...": "full plan status" }
}
```

On checkout:
- **PRO** → `isFeatured=true`, 30 days validity
- **TOP_CITY** → `isFeatured=true`, auto `featuredSlot` in city, 30 days
- **BASIC** → clears featured flags (downgrade)

| Limit | BASIC | PRO | TOP_CITY |
|-------|-------|-----|----------|
| Photos | 5 | unlimited | unlimited |
| Active promotions | 1 | 5 | 10 |
| Promotions in city feed (simultaneous) | 0 | 2 | 5 |
| Max promotion duration | 14 days | 90 days | 90 days |
| New promotions per day | 1 | 3 | 5 |
| Analytics window | 7 days | 90 days | 90 days |

When `activeNow=true` and no `businessId`, city feed shows only Pro/Top businesses; per business max `maxPromotionsInFeed` newest promotions. Top tier sorted with priority.

On plan expiry/downgrade: excess active promotions move to `DRAFT`.

Full guide: [docs/product/business-tariffs.md](../product/business-tariffs.md)

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

Query: `activeNow`, `page`, `limit`, `citySlug`, `businessId`

When `activeNow=true` and no `businessId`, only promotions from businesses on **PRO** or **TOP_CITY** with valid `planExpiresAt` appear in the city feed.

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

Notification types: `GENERAL`, `NEW_REVIEW`, `REVIEW_REPLY`, `BUSINESS_APPROVED`, `BUSINESS_BLOCKED`, `NEW_PROMOTION`, `PLAN_ACTIVATED`, `PLAN_EXPIRED`

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

## Monetization (Stage 2)

Campaign-based advertising catalog, orders, manual payments, and campaign management.  
Legacy plan APIs (`/plans`, `PlanPayment`, `Business.planTier`) remain unchanged.

See also: [MONETIZATION.md](../MONETIZATION.md).

### Public catalog

- `GET /monetization/products?citySlug&cityId&categoryId&businessId?`
- `GET /monetization/products/:code?citySlug&cityId&categoryId&businessId?`
- `GET /monetization/packages`

Returns products with available durations and `basePrice`. When `businessId` is provided with auth, also returns `discountPercent` and `finalPrice` (server-calculated).

### Business owner (`BUSINESS`, `ADMIN`, `CITY_ADMIN`)

- `POST /monetization/quote` — price quote (does not create order)
- `POST /monetization/orders` — create order (`AWAITING_PAYMENT`) + auto `Payment` `PENDING`/`MANUAL`
- `GET /monetization/orders?businessId`
- `GET /monetization/orders/:id`
- `GET /monetization/campaigns?businessId`
- `GET /monetization/campaigns/:id`
- `POST /monetization/creatives`
- `GET /monetization/creatives?businessId`
- `GET /monetization/creatives/:id`
- `PATCH /monetization/creatives/:id` — only `DRAFT`/`REJECTED`

**Quote body:**
```json
{
  "businessId": "...",
  "productCode": "TOP_CATEGORY",
  "durationDays": 7,
  "desiredStartAt": "2026-09-10T00:00:00Z",
  "packageCode": null
}
```

**Order body (products):**
```json
{
  "businessId": "...",
  "items": [
    {
      "productCode": "TOP_CATEGORY",
      "durationDays": 7,
      "desiredStartAt": "2026-09-10T00:00:00Z",
      "promotionId": null,
      "creativeId": null
    }
  ]
}
```

**Order body (package):**
```json
{ "businessId": "...", "packageCode": "START" }
```

### Admin (`ADMIN`, `CITY_ADMIN` — city-scoped)

- `GET /admin/monetization/orders?citySlug&status&page&limit`
- `GET /admin/monetization/orders/:id`
- `GET /admin/monetization/payments?citySlug&page&limit`
- `GET /admin/monetization/payments/:id`
- `POST /admin/monetization/payments/:id/confirm` — manual payment confirm (idempotent)
- `GET /admin/monetization/campaigns?citySlug&businessId&page&limit`
- `GET /admin/monetization/campaigns/:id`
- `POST /admin/monetization/campaigns/:id/pause`
- `POST /admin/monetization/campaigns/:id/resume`
- `POST /admin/monetization/campaigns/:id/cancel`
- `POST /admin/monetization/creatives/:id/approve`
- `POST /admin/monetization/creatives/:id/reject`

**Confirm payment response (idempotent):**
```json
{
  "alreadyPaid": false,
  "order": { "orderNumber": "QLG-20260905-ABC123", "status": "PAID", "...": "..." }
}
```

### Monetization error codes

Domain errors include stable `code` in body:

| code | Meaning |
|------|---------|
| `PRODUCT_NOT_FOUND` | Unknown/inactive product |
| `PRICE_NOT_FOUND` | No matching active ProductPrice |
| `PLACEMENT_UNAVAILABLE` | Slot full for dates |
| `INVALID_DURATION` | Missing/invalid duration |
| `BUSINESS_NOT_OWNED` | Ownership/RBAC failure |
| `PAYMENT_AMOUNT_MISMATCH` | Confirm amount ≠ order total |
| `ORDER_NOT_FOUND` | Unknown order |

### Ad serving (Stage 3A — public)

- `GET /monetization/ads/serve?placementCode&sessionId&citySlug|cityId&categoryId?&limit?`

**Response `200`:**
```json
{
  "placementCode": "HOME_FEATURED",
  "cityId": "...",
  "categoryId": null,
  "items": [
    {
      "campaignId": "...",
      "placementCode": "HOME_FEATURED",
      "placementId": "...",
      "position": 1,
      "sponsored": true,
      "displayLabel": "Реклама",
      "productType": "FEATURED_BUSINESS",
      "business": { "id": "...", "title": "...", "slug": "...", "...": "..." }
    }
  ]
}
```

- `POST /monetization/ads/events` — track impression/click/action (rate limit 120/min/IP)

**Body:**
```json
{
  "campaignId": "...",
  "placementCode": "HOME_FEATURED",
  "sessionId": "abc123",
  "type": "AD_IMPRESSION",
  "position": 1
}
```

**Impression dedupe response (duplicate within 30 min):**
```json
{ "recorded": false, "duplicate": true }
```

### Campaign analytics (Stage 3A)

- `GET /monetization/campaigns/:id/analytics?from&to` — owner/admin/city-admin
- `GET /admin/monetization/campaigns/:id/analytics?from&to`

**Response `200`:**
```json
{
  "campaignId": "...",
  "period": { "from": null, "to": null },
  "served": 1200,
  "qualifiedImpressions": 450,
  "clicks": 23,
  "ctr": 5.11,
  "actions": {
    "AD_CARD_OPEN": 40,
    "AD_CALL_CLICK": 8,
    "AD_WHATSAPP_CLICK": 0,
    "AD_ROUTE_CLICK": 3,
    "AD_WEBSITE_CLICK": 1,
    "AD_INSTAGRAM_CLICK": 0,
    "AD_PROMOTION_OPEN": 2
  }
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
