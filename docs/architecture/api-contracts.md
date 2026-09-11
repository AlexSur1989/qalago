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
| `accountType` | `"user"` \| `"business"` | no | **Legacy (ignored since Stage 5N.5).** Новые пользователи всегда получают `USER`. Существующие роли `ADMIN`, `CITY_ADMIN`, `BUSINESS` сохраняются. Значение `business` не повышает роль. |

Response `200`:
```json
{
  "accessToken": "jwt...",
  "user": { "id": "...", "phone": "+77001234567", "name": null, "role": "USER" }
}
```

### POST /auth/google

**Stage 6.2B2.** Requires server flag `GOOGLE_AUTH_ENABLED=true`. When disabled, returns **404 Not Found**.

Request:
```json
{ "idToken": "<Google ID token>" }
```

Only `idToken` is accepted — no `role`, `phone`, `email`, or `providerUserId` from client.

Response `200`: same shape as `/auth/verify-code` (`accessToken`, `user`).

New Google users receive `role: USER`, `phone: null`. Identity key is `GOOGLE` + verified Google `sub`. **No email auto-linking.**

Rate limit: 20 attempts / IP / 15 minutes (configurable via `GOOGLE_AUTH_IP_*`).

Requires at least one configured audience: `GOOGLE_CLIENT_ID_ANDROID`, `GOOGLE_CLIENT_ID_IOS`, or `GOOGLE_CLIENT_ID_WEB`.

### POST /auth/apple

**Stage 6.2B3.** Requires server flag `APPLE_AUTH_ENABLED=true`. When disabled, returns **404 Not Found**.

Request:
```json
{ "identityToken": "<Apple identity token>" }
```

Only `identityToken` is accepted. Do not send unverified `fullName` or other client profile fields.

Response `200`: same shape as `/auth/verify-code` (`accessToken`, `user`).

New Apple users receive `role: USER`, `phone: null`, `name: null`. Identity key is `APPLE` + verified Apple `sub`. Private relay emails are stored as provider metadata only. **No email auto-linking.**

Rate limit: shared with Google — 20 attempts / IP / 15 minutes (`SOCIAL_AUTH_IP_*`).

Requires at least one configured audience: `APPLE_CLIENT_ID_IOS` and/or `APPLE_CLIENT_ID_WEB`.

### POST /auth/dev-login

**Development only.** Requires server flag `DEV_LOGIN_ENABLED=true`. When disabled, returns **404 Not Found** (endpoint not advertised).

Request:
```json
{ "phone": "+77001234567" }
```

Accepts KZ formats: `87001234567`, `77001234567`, `+77001234567` → canonical `+77001234567`.

No `role` / `accountType` from client. New users receive default `USER` role. Existing users keep their stored role.

Response `200`: same shape as `/auth/verify-code` (`accessToken`, `user`).

> **NEVER enable `DEV_LOGIN_ENABLED` in production.**

### GET /auth/me

Headers: `Authorization: Bearer <token>`

Response `200`: JWT payload + user fields.

---

## Users

### GET /users/me

Includes `preferredCity`, and for `CITY_ADMIN` also `managedCity` (city scope for moderation).

`phone` and `email` may be null (social-only users after Stage 6.2B1). AuthIdentity details are not exposed in this DTO.

### PATCH /users/me

Body: `{ "name": "string", "preferredCityId": "string?" }`

### DELETE /users/me

Authenticated self-service account deletion.

- Success: `{ "success": true, "message": "..." }`
- `409 Conflict` when user is sole owner of a business (must transfer ownership first)
- `409 Conflict` for admin roles (must contact support)
- Idempotent if account already deleted
- Revokes memberships, deletes favorites/reviews/notifications, cancels pending applications/claims
- Anonymizes phone (`deleted:{userId}:{timestamp}`), sets `isActive=false`
- Existing JWT stops working immediately (guard checks `isActive`)

### Admin (platform)

- `GET /admin/users` — **ADMIN only** — includes safe `authMethods: ('GOOGLE'|'APPLE'|'PHONE')[]` (no providerUserId)
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
| latitude, longitude | number — user position; required for `sort=nearest` |
| radiusKm | number (default 15) — max distance in km when geo params set |
| sort | `recommended` \| `nearest` \| `rating` \| `popular` — organic catalog sort (Stage 6.7D) |

When `latitude` and `longitude` are provided, each item may include `distanceMeters` (integer). Businesses without coordinates are listed after geo-sorted items when `sort=nearest`.

**Default sort (backward compatible):** without `sort`, if geo is provided → nearest (distance asc, title tie-break); otherwise → `recommended` (title `ru` asc, id tie-break). Explicit `sort=recommended` always uses title order even with geo.

**Sort semantics:** `rating` — avg rating desc (businesses with no reviews last), review count desc, title asc; may include `averageRating`, `reviewCount`. `popular` — sum of organic `AnalyticsDailyMetric.views` last 30 days desc, title asc. Plan tier, ads, and subscriptions never affect organic order (Stage 4C.1 / 6.7D). Paid visibility via AdCampaign serve only.

List items may include `planTier`, `planExpiresAt`, `featuredSlot`, `isFeatured` for display; these fields are deprecated for catalog ranking. Query param `featured` is ignored on public catalog.

### GET /businesses/:id

Public business detail summary (Stage 5G). Returns core business fields plus **bounded previews** — not full collections:

```json
{
  "id": "...",
  "title": "...",
  "coverImageUrl": "...",
  "galleryPreview": { "items": [...], "totalCount": 100 },
  "catalogPreview": { "items": [...], "totalCount": 300 },
  "promotionsPreview": { "items": [...], "totalCount": 25 },
  "reviewsPreview": { "items": [...], "totalCount": 42 }
}
```

Public preview limits (fixed, independent of subscription tier): gallery 6, catalog 6, promotions 3, reviews 3. Subscription limits apply to owner storage/publication only.

### GET /businesses/:id/catalog

Paginated public catalog for one business.

Query: `page` (default 1), `limit` (default 20, max 50), `sectionId` (optional — business menu group id, or omit for all), `search` (optional — item title/description).

Response:

```json
{
  "items": [{ "id", "title", "description", "price", "imageUrl", "sectionId", "section": { "id", "title" } }],
  "sections": [{ "id", "title", "sortOrder", "isActive" }],
  "pagination": { "page", "limit", "total", "totalPages" }
}
```

Only active items from active sections (or uncategorized). Sort: section `sortOrder`, item `sortOrder`, title, `createdAt`.

### GET /businesses/:id/photos

Paginated public gallery.

Query: `page` (default 1), `limit` (default 24, max 50).

Response: `{ "items": [...], "totalCount", "pagination": { ... } }`

### GET /businesses/my

Auth: accessible businesses — `ACTIVE` membership with `role=OWNER|MANAGER`, or legacy `ownerId` **only when no membership row exists** (Stage 5N.1). Revoked/suspended memberships are not overridden by `ownerId`. Deduplicated.

Response:
```json
{
  "items": [
    {
      "business": { "id", "title", "...": "..." },
      "access": {
        "role": "OWNER" | "MANAGER",
        "permissions": ["CATALOG_EDIT", "..."]
      }
    }
  ]
}
```

OWNER `permissions` in response are the full enum (implicit all). MANAGER receives stored permissions only.

### Team (Stage 5M.2)

| Method | Path | Auth |
|--------|------|------|
| GET | `/businesses/:businessId/team` | OWNER; ADMIN; CITY_ADMIN (scoped read) |
| POST | `/businesses/:businessId/team/invite` | OWNER — body `{ email?, phone?, permissions[] }` (email **or** phone; not both). Email invite returns one-time `{ inviteUrl, rawToken }`. |
| PATCH | `/businesses/:businessId/team/:membershipId` | OWNER — body `{ permissions?, status? }` |
| DELETE | `/businesses/:businessId/team/invitations/:invitationId` | OWNER |
| POST | `/invitations/resolve` | Public — body `{ token }` — minimal preview (business name, masked email, status, expiresAt). Rate limited. |
| POST | `/invitations/accept` | Auth — body `{ token }` — explicit accept; creates MANAGER membership. Rate limited. |
| GET | `/businesses/:businessId/team/audit` | **OWNER only** — team-related audit rows; paginated (`page`, `limit` max 100) |

### PATCH /businesses/:id

Owner, manager (field-level permissions), or admin. Body (all optional): `title`, `shortDesc`, `description`, `address`, `latitude`, `longitude`, `phone`, `whatsapp`, `instagram`, `website`, `coverImageUrl`, `workHours`.

Field groups require matching `BusinessPermission`: profile fields → `BUSINESS_PROFILE_EDIT`; `workHours` → `BUSINESS_HOURS_EDIT`. Mixed PATCH requires all relevant permissions.

### GET /businesses/recommended/me

Auth user recommendations (rule-based MVP; AI later). Cold start (no favorites): active businesses in city, organic title order — **not** filtered by `isFeatured`. With favorites: same-category businesses, organic title order.

### Admin

- `GET /admin/businesses?status=&citySlug=&page=&limit=` — pagination via `meta`; `CITY_ADMIN` scoped to `managedCityId`.
- `PATCH /admin/businesses/:id/status`
- `PATCH /admin/businesses/:id/featured` — body: `{ isFeatured, featuredSlot? }`
- `PATCH /admin/businesses/:id/plan` — body: `{ tier: "BASIC"|"PRO"|"TOP_CITY" }` — назначить тариф без оплаты (30 дней для paid)
- `GET /admin/categories?citySlug=` — all categories including hidden; includes `citySortOrder`, `effectiveSortOrder`
- `PATCH /admin/categories/:id/city-order` — body `{ "citySlug", "sortOrder" }`
- `GET /admin/users` — ADMIN only
- `PATCH /admin/users/:id/role` — ADMIN only; body: `{ role, managedCityId? }` (required when role is CITY_ADMIN)
- `GET /admin/audit-logs` — **ADMIN** global; **CITY_ADMIN** scoped to `managedCityId`. Query: `page`, `limit` (default 50, max 100), `action`, `resourceType`, `businessId`, `cityId`, `actorUserId`, `dateFrom`, `dateTo`. Append-only; no PATCH/DELETE. Reading audit logs does not create audit rows.
- `GET /admin/reviews?citySlug=&limit=` — reviews scoped by admin city; includes user + business
- `DELETE /admin/reviews/:id` — remove review (city-scoped for CITY_ADMIN)

### POST /businesses (privileged import only)

**Stage 5N.5.** Normal users (`USER`, `BUSINESS`, owners, managers) receive **403 Forbidden**. Only platform `ADMIN` / `SUPER_ADMIN` may create via this route (catalog import). Self-service: `POST /business-applications` → moderation → Business + ACTIVE OWNER membership. Does **not** mutate `User.role`.

---

## Business applications (Stage 5N.1)

Safe new-business registration. No ownership until moderation approval.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/business-applications` | JWT | Creates `DRAFT` |
| GET | `/business-applications/my` | JWT | Applicant's applications |
| GET | `/business-applications/:id` | JWT | Own application only |
| PATCH | `/business-applications/:id` | JWT | `DRAFT` or `REJECTED` → `DRAFT` |
| POST | `/business-applications/:id/submit` | JWT | `DRAFT` → `PENDING` |
| POST | `/business-applications/:id/cancel` | JWT | `DRAFT`/`PENDING` → `CANCELLED` |

Applicant-editable body (create/patch): `title`, `categoryId`, `citySlug`/`cityId`, `address`, `shortDesc?`, `phone?`. Server sets `dedupeKey`, `status`, reviewer fields.

Admin moderation:

**Admin Web UI (5N.3):** `/business-requests/applications`, `/business-requests/applications/[id]`, `/business-requests/claims`, `/business-requests/claims/[id]` — SUPER_ADMIN, ADMIN, CITY_ADMIN (city-scoped).

| Method | Path | Auth |
|--------|------|------|
| GET | `/admin/business-applications` | ADMIN, CITY_ADMIN (scoped), SUPER_ADMIN |
| GET | `/admin/business-applications/:id` | same |
| POST | `/admin/business-applications/:id/approve` | same |
| POST | `/admin/business-applications/:id/reject` | same — body `{ rejectionReason }` |

**Approval:** atomic transaction — create `Business`, ACTIVE OWNER membership, set `ownerId`, mark application `APPROVED`. Applicant `User.role` unchanged. LIVE city → `Business.status=ACTIVE`; COMING_SOON → `Business.status=PENDING` (not public).

---

## Business ownership claims (Stage 5N.2)

Safe ownership claims for **existing** businesses. No access until moderation approval.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/businesses/:businessId/ownership-claims` | JWT | Creates `PENDING`; ACTIVE businesses only |
| GET | `/ownership-claims/my` | JWT | Paginated own claims |
| GET | `/ownership-claims/:id` | JWT | Own claim only |
| POST | `/ownership-claims/:id/cancel` | JWT | `PENDING` → `CANCELLED` |

Body (create): optional `claimantMessage` (max 500). Server sets `verificationMethod=MANUAL`.

Admin moderation:

**Admin Web UI (5N.3):** same routes under `/business-requests/claims/*`.

| Method | Path | Auth |
|--------|------|------|
| GET | `/admin/ownership-claims` | ADMIN, CITY_ADMIN (scoped), SUPER_ADMIN |
| GET | `/admin/ownership-claims/:id` | same |
| POST | `/admin/ownership-claims/:id/approve` | same |
| POST | `/admin/ownership-claims/:id/reject` | same — body `{ rejectionReason }` |

**Approval:** grants ACTIVE OWNER membership (promotes ACTIVE MANAGER if applicable). Sets `ownerId` only when currently null. Does **not** change `Business.status`, plan, ads, or content. Applicant `User.role` unchanged.

**Eligibility:** ACTIVE business only; denies ACTIVE OWNER, legacy `ownerId` without membership, SUSPENDED/REVOKED memberships, INVITED; allows ACTIVE MANAGER co-owner claims.

**Client onboarding (5N.4):** Flutter `/business/*` routes; Business Web `/onboarding/*`. Guest claim CTA → login redirect → claim form.

**Not implemented:** verification hardening (5N.5).

---

## Business plans (tariffs)

Tiers: `FREE`, `BASIC`, `PREMIUM`, `VIP`. Limits enforced server-side (photos, service items, promotions, analytics depth). Subscription activation does **not** set `isFeatured`, `featuredSlot`, or create AdCampaigns.

### GET /plans

Public catalog of tiers with prices, features, and limit matrix.

### GET /businesses/:businessId/plan

Auth: owner, ADMIN, CITY_ADMIN. Current tier, effective tier (expired paid → FREE), usage vs limits, entitlements.

Response includes `usage.photos`, `usage.activePromotions`, `limits`, `expiresAt`, `entitlements`.

### POST /businesses/:businessId/plan/mock-checkout

Auth: owner (or admin). **MVP test payment — no real charge.**

Body:
```json
{ "tier": "PREMIUM" }
```

`tier`: `FREE` | `BASIC` | `PREMIUM` | `VIP`

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

### GET /service-menu/manage/:businessId/items

Auth: owner / admin. Paginated owner catalog management (Stage 5G).

Query: `page`, `limit` (default 20, max 50), `sectionId` (`uncategorized` for ungrouped), `search`.

Response: `{ "items", "sections", "pagination" }` — flat item list with section metadata; sections include `itemCount`.

### Service menu groups

- `POST /service-menu-groups` — `{ "businessId", "title", "description?", "sortOrder?" }`
- `PATCH /service-menu-groups/:id` — `{ "title?", "description?", "isActive?", "sortOrder?" }`
- `DELETE /service-menu-groups/:id` — items become ungrouped (`groupId` set null)

Business catalog **sections** reuse `ServiceMenuGroup` (not global `Category`). Items reference `groupId` (nullable).

### GET /businesses/:id (legacy note)

Previously included full `menu`, `images`, and `promotions`. Stage 5G: use preview blocks above and dedicated `/catalog` + `/photos` endpoints.

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
{ "businessId": "...", "type": "VIEW_BUSINESS", "trafficSource": "SEARCH" }
```

`trafficSource` (optional, Stage 5H): only valid on `VIEW_BUSINESS`. Enum:
`HOME`, `SEARCH`, `CATEGORY`, `MAP`, `PROMOTIONS`, `FAVORITES`, `AD`, `DIRECT`, `UNKNOWN`.
Legacy clients may omit it; stored as `null` and aggregated as `UNKNOWN` in owner dashboards.

`searchQuery` (optional, Stage 5I): only stored when `trafficSource=SEARCH`. Normalized server-side
(trim, collapse spaces, lowercase, 2–100 chars). Counts only business-detail opens from Search.

`audienceDistanceBucket` (optional, Stage 5J): only valid on `VIEW_BUSINESS`. Coarse enum only —
`LT_1_KM`, `KM_1_3`, `KM_3_5`, `KM_5_10`, `GT_10_KM`, `UNKNOWN`. Computed on device; **no**
`userLatitude`, `userLongitude`, or raw distance accepted or stored.

Supported organic event types (Stage 6.5):
`VIEW_BUSINESS`, `BUSINESS_IMPRESSION`, `SEARCH_PERFORMED`, `SEARCH_RESULT_IMPRESSION`,
`CALL_CLICK`, `WHATSAPP_CLICK`, `ROUTE_CLICK`, `WEBSITE_CLICK`, `INSTAGRAM_CLICK`,
`FAVORITE_ADD`, `FAVORITE_REMOVE`, `PROMOTION_VIEW`, `PROMOTION_IMPRESSION`, `PROMOTION_ACTION`,
`CATALOG_ITEM_IMPRESSION`, `CATALOG_ITEM_VIEW`, `REVIEWS_VIEW`, `REVIEW_CREATED`.

Optional Stage 6.5 context fields:
`clientEventId` (idempotency), `visitorId` (pseudonymized server-side), `sessionId`,
`discoverySurface`, `promotionId`, `catalogItemId`, `platform`, `position`, `cityId` (for `SEARCH_PERFORMED`).

Ad events (`AD_*`) remain on `POST /monetization/ads/events` only.

Response `201`:
```json
{ "success": true }
```

### GET /analytics/business/:businessId/summary

Query: `days` (optional, 1-365, default `30`). Clamped by plan `maxAnalyticsDays`.

Response `200` — plan-filtered counts (FREE: views only; BASIC+: action types included):
```json
{
  "businessId": "...",
  "days": 30,
  "analyticsTier": "BASIC",
  "capabilities": { "maxDays": 30, "views": true, "actions": false, "viewTrend": true },
  "total": 42,
  "byType": { "VIEW_BUSINESS": 30, "CALL_CLICK": 0 }
}
```

### GET /analytics/business/:businessId/trends

Query: `days` (optional, 1-365, default `30`)

Response `200` — FREE: `VIEW_BUSINESS` only; BASIC+: all entitled event types.

### GET /analytics/business/:businessId/dashboard

Query: `days` (optional, 1-365, default `30`)

Unified owner analytics contract for Business Web and Flutter Owner. Backend is source of truth for entitlements; locked sections return `null` data + `lockedSections` metadata (no leaked values).

Response `200`:
```json
{
  "businessId": "...",
  "plan": "BASIC",
  "effectivePlan": "BASIC",
  "headline": "Что делают после просмотра?",
  "capabilities": {
    "maxDays": 30,
    "views": true,
    "viewTrend": true,
    "actions": true,
    "actionTrend": true,
    "trafficSources": false,
    "conversion": false,
    "periodComparison": false,
    "promotionAnalytics": false,
    "popularTimes": false,
    "benchmark": false,
    "recommendations": false,
    "searchQueries": false,
    "audienceGeography": false,
    "reportExport": false
  },
  "lockedSections": [],
  "effectiveRange": { "days": 30, "from": "...", "to": "..." },
  "overview": { "views": 30, "totalCustomerActions": 12 },
  "actions": { "total": 12, "calls": 4, "whatsapp": 3, "routes": 5, "website": 0, "instagram": 0, "favorites": 0, "promotionViews": 0 },
  "trends": { "views": [{ "date": "2026-08-29", "count": 7 }], "actions": [{ "date": "2026-08-29", "count": 2 }] },
  "sources": [
    { "source": "SEARCH", "label": "Поиск", "views": 24, "share": 38.1 },
    { "source": "UNKNOWN", "label": "Неизвестно", "views": 6, "share": 9.5 }
  ],
  "sourcesStatus": null,
  "searchQueries": [
    { "query": "кофе рядом", "count": 214, "percentage": 31.2 }
  ],
  "searchQueriesStatus": "AVAILABLE",
  "searchQueriesOtherCount": 14,
  "conversion": null,
  "comparison": null,
  "promotions": null,
  "popularTimes": null,
  "benchmark": null,
  "recommendations": null,
  "audienceGeography": [
    { "bucket": "LT_1_KM", "label": "До 1 км", "count": 120, "percentage": 21.4 },
    { "bucket": "KM_1_3", "label": "1–3 км", "count": 190, "percentage": 33.9 }
  ],
  "audienceGeographyStatus": "AVAILABLE"
}
```

Plan windows: FREE/BASIC 30d; PREMIUM 90d; VIP 365d. Campaign analytics remain under `/monetization/campaigns/:id/analytics` (not subscription-gated).

### GET /analytics/business/:businessId/export

**VIP only.** Authenticated owner / `CITY_ADMIN` / `ADMIN` with existing analytics access.

Query: `days` (optional, 1–365, default `30`). Clamped to plan `maxAnalyticsDays` (VIP: 365).

Response `200` — CSV file (not JSON):

- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="qalago-analytics-<slug>-YYYY-MM-DD.csv"`
- UTF-8 BOM for Excel on Windows
- Semicolon (`;`) delimiter
- Formula-injection safe cells (leading `=`, `+`, `-`, `@` escaped)

Report is generated from the **same canonical dashboard builder** as `GET …/dashboard`. Aggregate metrics only — no raw `AnalyticsEvent` rows, no user identity, no GPS coordinates.

Sections (when entitled): summary, traffic sources, search queries (threshold ≥3), audience geography (coarse buckets), popular times, benchmark, recommendations, trends.

`403` when business plan is not VIP (`reportExport` capability).

---

## Uploads

Static files served at `/uploads/*` (not under `/api/v1`).

### POST /uploads

Auth: **BUSINESS | CITY_ADMIN | ADMIN** (Stage 5M.0 — not available to USER).

Multipart field `file` (JPEG/PNG/WebP/GIF, max 5 MB).

Response `200`:
```json
{ "url": "/uploads/uuid.jpg" }
```

Business attach endpoints additionally verify ownership / CITY_ADMIN city scope via `BusinessAccessService`.

### POST /uploads/business/:businessId

Attach uploaded image to business (owner / CITY_ADMIN scoped / ADMIN).

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

## AI (Stage 5M.0 — catalog-api proxy)

Clients call **catalog-api**, not ai-orchestrator directly.

### POST /ai/recommendations

Public. Proxies to ai-orchestrator with internal service token. Optional user `Authorization` forwarded for personalized results.

### POST /ai/moderation/analyze

Auth: any authenticated user. Proxies moderation assist (no side effects).

### POST /admin/ai/moderation/analyze

Auth: ADMIN | CITY_ADMIN.

### POST /admin/ai/content/draft

Auth: ADMIN | CITY_ADMIN. CITY_ADMIN limited to `managedCityId` (citySlug must match managed city).

---

## AI Orchestrator (internal)

Base URL (internal service): `http://localhost:3004/api/v1`

**Auth (Stage 5M.0):** all routes except `GET /health` require header `X-QalaGo-Service-Token: <QALAGO_INTERNAL_SERVICE_TOKEN>`. Production fails closed if token unset. User JWT may be passed separately via `Authorization` for personalized recommendations.

- `GET /health` — public
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

- `GET /monetization/purchase-states?businessId` — backend-driven product UI states (`AVAILABLE`, `ACTIVE`, `SCHEDULED`, `PENDING_PAYMENT`, `PENDING_APPROVAL`, `SOLD_OUT`) with primary actions (Stage 6.7D)
- `POST /monetization/quote` — price quote (does not create order); includes `schedule.projectedStartAt/projectedEndAt` for products and `schedulePreview.items[]` for packages (Stage 6.7D)
- `POST /monetization/orders` — create order (`AWAITING_PAYMENT`) + auto `Payment` `PENDING`/`MANUAL`
- `GET /monetization/orders?businessId`
- `GET /monetization/orders/:id`
- `GET /monetization/campaigns?businessId`
- `GET /monetization/campaigns/:id`
- `POST /monetization/creatives`
- `GET /monetization/creatives?businessId`
- `GET /monetization/creatives/:id`
- `PATCH /monetization/creatives/:id` — only `DRAFT`/`REJECTED`
- `POST /monetization/creatives/:id/submit` — `DRAFT`/`REJECTED` → `PENDING`; syncs linked paid VIP campaigns to `PENDING_MODERATION`

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
