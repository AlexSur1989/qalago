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
{
  "identityToken": "<Apple identity token>",
  "firstLoginDisplayName": "<optional, first authorization only>"
}
```

Only `identityToken` is required. Optional `firstLoginDisplayName` may be sent alongside a verified token when Apple supplies the user's name on first authorization; it is used only to initialize `User.name` on **new** accounts and is ignored for identity and for existing users. Do not send `role`, `userId`, `providerUserId`, or other trusted fields.

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

### Web panel auth BFF (Admin / Business — BIZ.9 HOTFIX 7B)

Browser refresh tokens are **HttpOnly cookies** on each Next.js origin. **Not** stored in `localStorage`. Upstream remains **`POST /api/v1/auth/refresh`** with `{ refreshToken }` in JSON (BFF reads scoped cookie server-side).

| App | Cookie name | Cookie Path | BFF routes |
|-----|-------------|-------------|------------|
| Admin Web | `qalago_admin_refresh` | `/api/auth/admin` | `POST /api/auth/admin/login`, `refresh`, `logout`, `mfa-verify`, `establish` |
| Business Web | `qalago_business_refresh` | `/api/auth/business` | `POST /api/auth/business/login`, `refresh`, `logout`, `establish` |

Legacy shared cookie `qalago_refresh` (`Path=/api/auth`) is **cleared on login/refresh/logout** and **never read**. Admin and Business sessions are independent (separate cookies, separate logout). **One re-login per app** may be required after deploy.

Catalog API **`AuthSession`** rotation/replay/`logout-all` semantics unchanged.

### GET /auth/me

Headers: `Authorization: Bearer <token>`

Response `200`: JWT payload + user fields.

---

## Users

### GET /users/me

Includes `preferredCity`, and for `CITY_ADMIN` also `managedCity` (city scope for moderation).

`phone` and `email` may be null (social-only users after Stage 6.2B1). AuthIdentity details are not exposed in this DTO.

### PATCH /users/me

Body: `{ "name": "string", "preferredCityId": "string?" }` — does **not** accept `avatarUrl` (server-owned).

Response includes optional `avatarUrl` (path under `/uploads/…`). Stage 6.8C.1.

### POST /users/me/avatar

Multipart `file` (JPEG/PNG/WebP). Session user only. Returns `{ "avatarUrl": "/uploads/…" }`.

### DELETE /users/me/avatar

Removes avatar; `{ "success": true }`.

### DELETE /users/me

Authenticated self-service account deletion.

- Success: `{ "success": true, "message": "..." }`
- `409 Conflict` when user is sole owner of a business — code `BUSINESS_OWNERSHIP_REQUIRES_RESOLUTION`
- `409 Conflict` for admin roles (must contact support)
- Idempotent if account already deleted
- Revokes memberships, deletes favorites/reviews/notifications, cancels pending applications/claims
- Anonymizes phone (`deleted:{userId}:{timestamp}`), sets `isActive=false`
- Revokes all AuthSessions; clears `avatarUrl` (Stage 6.9)
- Existing JWT stops working immediately (guard checks `isActive`)

## Legal & safety (Stage 6.9)

### GET /legal/documents/:type

Public. Query `locale=RU|KK`. Returns published document only (404 for draft/missing).

### GET /legal/me/status

Authenticated — acceptance history + pending reacceptance list.

### POST /legal/me/accept

Body: `{ documentId, acceptanceSource, locale }`.

### POST /reports

Authenticated. Body: `{ targetType, targetId, reason, details? }`. Rate limited. Dedupes open reports per reporter+target.

### POST /data-rights/requests

Body: `{ type }` — `ACCESS|EXPORT|CORRECTION|DELETE_ACCOUNT|DELETE_DATA|OTHER`.

### GET /data-rights/requests/me

Authenticated list (no admin notes).

### POST /moderation/cases/:caseId/appeals

Body: `{ reason }` — eligible owner/affected user only.

### Admin

- `GET /admin/moderation/cases` — ADMIN, CITY_ADMIN (city scoped), SUPER_ADMIN
- `GET /admin/moderation/cases/:id` — case detail with linked `reports`, `actions`, and `reviewTarget` (when `targetType=REVIEW`: current review state, business/city, reviewer staff fields, `publiclyVisible`, lifecycle `state`; missing target does not error) and `mediaTarget` (when `targetType=MEDIA`: current `BusinessImage` row with `locationId`, `imageUrl`, `moderationHidden`, owning business, optional `branchLocation` address/city/`isPrimary`; missing image does not error; branch FK miss → `branchUnavailable`)
- `POST /admin/moderation/cases/:id/actions` — apply moderation action (`REVIEW_HIDE` / `REVIEW_RESTORE` require `internalNote` min 3 chars; restore never clears `deletedAt`)
- `POST /admin/legal/documents/:id/publish` — SUPER_ADMIN
- `PATCH /admin/data-rights/requests/:id/status` — ADMIN, SUPER_ADMIN
- `GET/PATCH /admin/legal/government-requests` — SUPER_ADMIN only
- `GET/POST/PATCH /admin/legal/security-incidents` — SUPER_ADMIN only

### Admin (platform)

- `GET /admin/users` — **ADMIN only** — includes safe `authMethods: ('GOOGLE'|'APPLE'|'PHONE')[]` (no providerUserId)
- `PATCH /admin/users/:id/role` — **ADMIN only**

### Platform business features (BIZ.9 HOTFIX 5B)

Global **Business Web** product toggles persisted in `FeatureFlagDefinition.globalEnabled` (no city override, not in mobile app-config resolver). **Default:** `businessTeamEnabled: false`. **Only `businessTeamEnabled` is live-gated in 5B**; future keys may appear in types/admin UI without changing other modules until later stages.

#### GET /platform-features

**Auth:** none (public).

Response `200`:

```json
{
  "platformFeatures": { "businessTeamEnabled": false },
  "configRevision": 12
}
```

Missing DB row → `businessTeamEnabled: false`. Reads persisted state at request time (no redeploy).

#### GET /admin/platform-features

**Auth:** staff JWT.

| Role | Access |
|------|--------|
| SUPER_ADMIN | read |
| ADMIN | read-only |
| CITY_ADMIN, TECH_ADMIN, others | **403** |

Response: same shape as public GET.

#### PATCH /admin/platform-features

**Auth:** staff JWT. **Write: SUPER_ADMIN only** (defense in depth in service; `ADMIN` / `CITY_ADMIN` / `TECH_ADMIN` / business roles → **403** even if other release-config permissions exist).

Body:

```json
{ "businessTeamEnabled": true }
```

Persists `FeatureFlagDefinition` for key `businessTeamEnabled`, increments `configRevision`, audit `RELEASE_CONFIG_UPDATE` on `APP_RELEASE_CONFIG` / resourceId `businessTeamEnabled` with metadata `{ field: "platformFeature", key, previousGlobal, newGlobal }`.

**City overrides:** `PATCH` city feature flag with key `businessTeamEnabled` → **400** (rejected, not ignored).

#### Business Team when `businessTeamEnabled: false`

Owner/manager **memberships and permissions unchanged**; invitations remain stored. Team management is blocked:

- `GET /businesses/:businessId/team`
- `GET /businesses/:businessId/team/audit`
- `POST /businesses/:businessId/team/invite`
- `PATCH /businesses/:businessId/team/:membershipId`
- `DELETE /businesses/:businessId/team/invitations/:invitationId`
- `POST /businesses/invitations/accept` (token accept path)

→ **403** with code **`BUSINESS_TEAM_DISABLED`** (fail closed; no membership mutation on accept).

When **true**, existing Team API behavior applies (owner RBAC, plan limits, invite TTL unchanged).

**Orthogonal:** Admin Web compile-time `NEXT_PUBLIC_QALAGO_ADMIN_BUSINESS_TEAM` gates catalog team tooling only; not this runtime flag.

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

## Home sections (CW.3)

Logical home feed section order/visibility — **not** ad campaign config or category data.

### GET /home/sections (public)

Query: `citySlug` (required), `platform` — `APP` | `WEB` | `ALL` filter target.

Response: ordered array:

```json
[
  { "type": "HOME_VIP_BANNER", "enabled": true, "position": 10 },
  { "type": "CATEGORIES", "enabled": true, "position": 20 }
]
```

**Resolution:** load global rows (`cityId` null) + city rows; **city overrides global per `sectionType`**; drop disabled; keep rows where `platform` is `ALL` or matches query; sort by `position`.

### Admin

- `GET /admin/home-sections` — `HOME_CONFIG_VIEW`; optional `citySlug` (effective merged view). Omit `citySlug` for global rows only (ADMIN/SUPER_ADMIN).
- `PATCH /admin/home-sections` — `HOME_CONFIG_EDIT`; body `{ sectionType, citySlug?, enabled, position, platform }`. Omit `citySlug` for global row (ADMIN/SUPER_ADMIN only). CITY_ADMIN may set `citySlug` only within managed city scope.

Section types: `HOME_VIP_BANNER`, `CATEGORIES`, `HOME_FEATURED`, `HOME_PROMOTIONS`, `NEARBY`.

---

## Categories

### GET /categories

Query: `citySlug` (optional, default `uralsk`). Returns active categories visible in the city, sorted by city-specific order when set. Each item includes **`nameRu`**, **`nameKk`**, legacy **`title`** (alias of `nameRu`), `icon`, consumer alias **`iconUrl`** (same value, nullable). Stage 6.10A / **6.10B**.

### GET /categories/:categoryId/subcategories

Public list of **active** subcategories for a category (`id`, `categoryId`, `slug`, `nameRu`, `nameKk`, `icon`, **`iconUrl`**, `sortOrder`). Stage 6.8C.1 / 6.10A.

### Admin subcategories (Stage 6.8C.1)

- `GET /admin/categories/:categoryId/subcategories` — all subs (incl. inactive)
- `POST /admin/categories/:categoryId/subcategories` — body `{ slug, nameRu, nameKk, sortOrder?, icon? }`
- `PATCH /admin/subcategories/:id` — update / deactivate
- `PATCH /admin/subcategories/:id/deactivate`
- `DELETE /admin/subcategories/:id` — SUPER_ADMIN; blocked when businesses assigned

### Admin


- `POST /categories` — body may include `nameRu`, `nameKk`, and/or legacy `title` (normalized server-side; `title` ↔ `nameRu` sync).
- `PATCH /categories/:id` — update names/icon/sort; `nameRu`/`nameKk`/`title` kept consistent.
- `DELETE /categories/:id`
- `GET /admin/categories?citySlug=` — all categories including hidden; each row includes `citySortOrder` and `effectiveSortOrder`
- `PATCH /admin/categories/:id/city-order` — body `{ "citySlug", "sortOrder" }` (ADMIN, CITY_ADMIN scoped to managed city)
- `PATCH /admin/categories/:id/city-visibility` — body `{ "citySlug", "isHidden" }` — hide category in one city only

---

## Geocoding (Stage 6.11C.4)

Authenticated geocoding for business onboarding and location picker (server-side provider; API key never exposed to clients).

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/geocoding/autocomplete` | JWT | Query: `q` (2–200 chars), **required** `citySlug` or `cityId`, optional `language` `ru` \| `kk` (default `ru`). Country `kz`; provider bbox + server filter to city geocoding bounds. Rate limit per user + IP. |
| GET | `/geocoding/reverse` | JWT | Query: `lat`, `lng` (valid pair; rejects `0,0`), **required** `citySlug` or `cityId`, optional `language` `ru` \| `kk`. Rejects coordinates outside city geocoding bounds before provider call. |

Response item (`GeocodingSuggestion`): `{ id, label, address, latitude, longitude, placeType? }`.

Env: `QALAGO_GEOCODING_PROVIDER` = `mock` (default) \| `maptiler`; `MAPTILER_API_KEY` when using MapTiler; `GEOCODING_USER_*`, `GEOCODING_IP_*` rate limits.

---

## Businesses

> **Map (6.12A.7.1):** `forMap=true` + viewport bbox returns **one row per qualifying `BusinessLocation`** (`locationId` + branch physical fields). **`id` remains the parent Business id.** Ordinary list/search/nearest (without map viewport grain) stays **Business-scoped**. See [business-location.md](./business-location.md).
>
> **Discovery context (6.12A.7.9.1+):** Business = discovery/card identity; **BusinessLocation** = physical context when known. Additive **`contextLocationId`** on list items = the branch that gives the card its physical context (clients may open detail with `?locationId=<contextLocationId>`). **Map keeps `locationId`** (unchanged contract). Detail keeps **`activeLocationId`**. Do not infer `contextLocationId` from legacy **`Business.location`** / primary coordinates alone.
>
> **Flutter consumption (A.7.9.5, IMPLEMENTED):** Mobile parses **`contextLocationId`** on catalog list/search/nearby/promotion payloads and opens **`GET /businesses/:id?locationId=<contextLocationId>`** via existing detail routing. Map marker taps continue **`locationId`** only (not list **`contextLocationId`**). Favorites/reviews/analytics remain **Business.id**.
>
> **Consumer Web consumption (F.4 Phase 2, IMPLEMENTED):** Discovery links **`/{citySlug}/business/{businessSlug}?locationId=`** when **`contextLocationId`** present. Canonical page fetches **`GET /businesses/by-slug/:businessSlug?citySlug=&locationId=`**; wrong-city **`409`** → permanent redirect to actual city. Legacy **`/businesses/{id}`** redirects to canonical (still noindex). Indexable canonical excludes **`?locationId=`**. No Web map/auth/favorites yet.
>
> **F.5 (CLOSED / PASS — Consumer Web):** Indexable public URLs use locale prefix **`/ru/`** / **`/kk/`** per [public-consumer-web.md](./public-consumer-web.md) § F.5. **No Catalog API or schema changes** for locale routing; same public endpoints and DTOs. Wrong-city normalization preserves locale segment on Consumer Web redirects.
>
> **F.6 Phase 0 (CONTRACT LOCKED — not implemented):** Mobile deep links resolve F.5 HTTPS URLs to in-app navigation; business slug resolution continues to use **`GET /businesses/by-slug/:businessSlug?citySlug=`** only — [deep-links.md](./deep-links.md). **No API changes** in Phase 0.

### GET /businesses

Query:

| Param | Type |
|-------|------|
| page, limit | number |
| categoryId | string |
| subcategoryId | string (optional) — filter businesses assigned to subcategory; if `categoryId` also set, sub must belong to category (400 otherwise) |
| search | string (optional, max **100** chars after trim; whitespace collapsed). Case-insensitive `contains` match against approved stored fields only — see **Search semantics (Stage 6.11B.1)** below. |
| featured | boolean |
| status | Optional. **Public catalog (MAP-SEC.C1):** omitted → **ACTIVE** only; **`status=ACTIVE`** accepted; **`status=PENDING`** or **`status=BLOCKED`** → **400**. Non-ACTIVE administrative filtering uses protected **`GET /admin/businesses`**, not this endpoint. |
| citySlug / cityId | string |
| latitude, longitude | number — user position; required for `sort=nearest` |
| radiusKm | number (default 15) — max distance in km when geo params set |
| sort | `recommended` \| `nearest` \| `rating` \| `popular` — organic catalog sort (Stage 6.7D) |
| forMap | boolean (optional) — with viewport bbox: **location-grain** map mode (Stage 6.12A.7.1): each item is a qualifying **branch** with `locationId`; parent **`id` = Business id**. **Without bbox:** **business-grain** list excluding brands with no **map-ready branch** in the requested city (valid **BusinessLocation** coordinates in **C**, not parent Business mirror). Does not change ordinary discovery when omitted. |
| minLat, maxLat, minLng, maxLng | number (optional) — map viewport bbox; **all four required together** or 400. PostGIS intersects **`BusinessLocation.location`** and **`BusinessLocation.cityId = C`** whenever bbox is complete — **including** if user geo/radius params are also present (A.9.3.2b). With `forMap=true`, response is **location-grain**; without `forMap`, **business-grain** (max one row per Business). Max span: **1.2° latitude**, **1.8° longitude** (Stage 6.11C.5A). |

When `latitude` and `longitude` are provided, each item may include `distanceMeters` (integer, straight-line/geodesic meters — not road distance). Businesses without coordinates are listed after geo-sorted items when `sort=nearest`.

**Map list item fields (forMap + bbox, 6.12A.7.1):** additive `locationId`; branch `cityId`, `address`, `latitude`, `longitude`, `phone`, `whatsapp`, `instagram`, `website`, `workHours` from **BusinessLocation**; brand fields (`title`, `slug`, `category`, cover, plan display fields, `status`, etc.) from **Business**. **A.7.9.1+:** additive **`contextLocationId`** on map rows — same branch as `locationId` (discovery navigation hint; map field name unchanged). No raw PostGIS geography or internal timestamps.

**City membership (A.7.9.3A, IMPLEMENTED):** public **`GET /businesses`** discovery in city **C** (plain list, category, subcategory, search base scope, rating, popular, recommended, **`recommended/me`**, geo radius/nearest) includes a Business iff **`status`** satisfies the public filter **and** **`EXISTS BusinessLocation` with `cityId = C`**. **`Business.cityId` alone does not grant presence** (legacy parent/home/compatibility field only — see **A.9.4.0**). **One Business card** per brand; membership uses **`locations.some(cityId)`** / SQL **`EXISTS`** — not branch joins that multiply rows.

**Public list `cityId` projection (A.9.4.1B IMPLEMENTED):** top-level compatibility **`cityId`** is projected with address/coordinates from the same effective branch context (**`projectPublicPhysicalReadFields`** / **A.9.3.1**): **`contextLocationId`** → that branch’s **`cityId`**; explicit detail **`locationId`** → selected branch; no branch context → **primary** **`BusinessLocation.cityId`**; no BL during transition → parent **`Business.cityId`** fallback. Detail **`effectivePhysical.cityId`** aligns with the same rule.

**Non-geo city context (A.7.9.3A):** list items include additive **`contextLocationId`** = deterministic branch in **C** (`primary` in **C** if any, else `isPrimary DESC`, `createdAt ASC`, `id ASC`). Coordinates **not** required for city membership. **Nearby (A.7.9.2)** keeps geo **`contextLocationId`** (nearest branch in **C** with geography); geo context is **not** overwritten by city context.

**Nearby / radius (A.7.9.2 + A.7.9.3A):** spatial membership on **`BusinessLocation.location`**; qualifying branch must have **`bl.cityId = C`**. **`contextLocationId`** + **`distanceMeters`** refer to the same branch; dedup before pagination. No legacy **`Business.location`** fallback. Businesses with **no** branch in **C** are excluded.

**Invariant:** when both **`contextLocationId`** and **`distanceMeters`** are present, distance refers to that **BusinessLocation** only.

**Geo validation (Stage 6.11C.5A + A.9.3.2b):** user `latitude`/`longitude` must be supplied as a **pair** (finite, in range; **0,0 allowed** for user position). `radiusKm` without a coordinate pair → **400**. Map readiness uses **branch** coordinate validity in city **C** (null/0,0/out-of-range excluded) — not legacy **Business** mirror fields. **`forMap=true` + bbox** remains **location-grain**; ordinary nearby/radius stays **business-grain** with branch **`contextLocationId`**.

See [catalog-geo-query.md](./catalog-geo-query.md) for modes A/B/C and C.5 performance notes.

**Default sort (backward compatible):** without `sort`, if geo is provided → nearest (distance asc, title tie-break); otherwise → `recommended` (title `ru` asc, id tie-break). Explicit `sort=recommended` always uses title order even with geo.

**Sort semantics:** `rating` — avg rating desc (businesses with no reviews last), review count desc, title asc; may include `averageRating`, `reviewCount`. `popular` — sum of organic `AnalyticsDailyMetric.views` last 30 days desc, title asc. Plan tier, ads, and subscriptions never affect organic order (Stage 4C.1 / 6.7D). Paid visibility via AdCampaign serve only.

List items may include `planTier`, `planExpiresAt`, `featuredSlot`, `isFeatured` for display; these fields are deprecated for catalog ranking. Query param `featured` is ignored on public catalog.

**Search semantics (Stage 6.11B.1 + A.7.9.3B, IMPLEMENTED):** `search` is **city-scoped** (requires resolved `citySlug` / `cityId` like other list queries) and combined with **`BusinessLocation` city membership (A.7.9.3A)**, `status` (default `ACTIVE`), optional `categoryId`, and optional `subcategoryId` using **AND**. Text matching uses a single **OR** group across:

- Business `title`, `shortDesc` (parent brand text — **not** physical authority)
- **`BusinessLocation.address`** in requested city **C** only (A.7.9.3B) — branch address match; stale parent **`Business.address`** alone does **not** qualify discovery search or address relevance tier
- Associated Category `title`, `nameRu`, `nameKk`
- Associated Subcategory `nameRu`, `nameKk` (via business assignment)
- **Public** ServiceItem `title`, `titleKk`, `description`, `descriptionKk` — only items that are **consumer-visible** on the business catalog (active item, active/ungrouped section, plan-tier publish cap as **6.11B.2**), then **branch availability (A.7.9.3B):** **0** `ServiceItemBranchAvailability` rows = **ALL** branches (item may match in **C** iff business has a branch in **C**); **≥1** rows = **SELECTED** only (item may match in **C** iff an assignment points to a **`BusinessLocation` in C**)

**Search result grain:** one **Business** card per brand; branch matches use **`EXISTS` / `id IN (...)`** — not location-grain pagination.

**Search `contextLocationId` precedence (non-geo, A.7.9.3B):** geo/nearby nearest branch (A.7.9.2) **>** **SELECTED** ServiceItem assigned branch in **C** **>** branch **address** match in **C** **>** generic city context (A.7.9.3A). **ALL**-mode ServiceItem matches use generic city context.

**Not** matched: Promotion titles/descriptions, paid plan/ad fields, runtime translation, transliteration, or fuzzy/typo tolerance. RU and KK stored fields are searched together; **UI locale is not required** for cross-language query matching. Organic sort/ranking remains plan-neutral (Stage 4C.1 / 6.7D). Pagination may still load matching rows in memory for certain sort modes (see service implementation).

### PATCH /businesses/:id

Owner/manager patch may include optional `subcategoryIds: string[]` (requires `BUSINESS_PROFILE_EDIT`). Empty array clears assignments. Subcategories must belong to business `categoryId`.

Optional `latitude`/`longitude` (pair validated together; ranges enforced; rejects `0,0`) and optional `locationSource` (`GEOCODED` \| `MANUALLY_ADJUSTED` \| `LEGACY_UNKNOWN`) — Stage 6.11C.4.

### PATCH /admin/businesses/:id/taxonomy

Platform admin: optional `categoryId`, `subcategoryIds`. Reconciles invalid subs on category change.

### GET /businesses/by-slug/:businessSlug

**F.4 Phase 1 — IMPLEMENTED.** Public business detail for future canonical Consumer Web route **`/{citySlug}/business/{businessSlug}`** (page not implemented). Resolves **`Business.slug`** + required **`citySlug`** + optional **`locationId`**; response shape matches **`GET /businesses/:id`** (same **`composePublicBusinessDetail`** — identity, slug, previews, **`effectivePhysical`**, **`effectiveMedia`**, **`effectiveCatalog`**, **`effectivePromotions`**, reviews/rating previews). **No** `:id`/slug overload.

| Query | Required | Semantics |
|-------|----------|-----------|
| **`citySlug`** | yes | Resolved via existing public city authority; unknown/inactive city → **404**. |
| **`locationId`** | no | Optional **`BusinessLocation.id`** for branch context (see rules below). |

**Business resolution:** exact **`Business.slug`**; only **`ACTIVE`** (same public visibility as **`GET /businesses/:id`**). Unknown slug or non-public business → **404** (no status leak).

**City membership:** at least one eligible public **`BusinessLocation`** for this business in the resolved city; else **404**. No fallback to primary in another city.

**`locationId` absent:** active branch chosen only among eligible locations in **`citySlug`**: (1) global **primary** if in that city; else (2) deterministic city context — **`isPrimary DESC`**, **`createdAt ASC`**, **`id ASC`** (A.7.9.3A / Phase 0.1 Rule 4).

**`locationId` present — same city, owned, eligible:** that branch is **`activeLocationId`**; **`effective*`** use it.

**`locationId` present — owned, eligible, wrong city:** **409 Conflict** with stable machine-readable body (Consumer Web performs **308/301** later — API does not redirect):

```json
{
  "statusCode": 409,
  "code": "BUSINESS_LOCATION_CITY_MISMATCH",
  "message": "Business location belongs to another city",
  "businessSlug": "…",
  "locationId": "…",
  "citySlug": "<actual public city slug>"
}
```

**Foreign `locationId`** (another business), invalid/malformed, inactive/non-public, or nonexistent: **no leak** — resolve as if **`locationId`** omitted (city-default Rule 4).

**Security:** same public DTO boundaries as **`GET /businesses/:id`**; hidden media/promotions/reviews excluded per existing rules.

### GET /businesses/:id

Public business detail summary (Stage 5G). Returns core business fields plus **bounded previews** — not full collections:

Query (Stage 6.12A.7.6, additive): optional **`locationId`** = `BusinessLocation.id` for the requested business. When omitted, **primary** branch is the active physical context. When `locationId` is unknown or belongs to another business, response falls back to **this business’s primary** location (no cross-business physical data).

> **F.4 city-routed pages:** stricter **citySlug + slug** resolution lives on **`GET /businesses/by-slug/:businessSlug`** (Phase 0.1 addendum). **This** `:id` route keeps **global-primary** fallback when **`locationId`** is omitted — unchanged for legacy/mobile/temp Web clients.

Response includes optional `subcategories[]` (active public shape) when assigned. Stage 6.8C.1.

Add **`activeLocationId`** (nullable), **`effectivePhysical`**, and **`effectiveMedia`** (Stage 6.12A.7.7.3) — server-resolved branch context for detail UI:

- **`effectivePhysical`:** address/coords/city from active location only; contacts/hours use location → business fallback.
- **`effectiveMedia`:** branch-aware public gallery + hero for the **active** location only (see below). **Legacy** top-level **`coverImageUrl`** and **`galleryPreview`** remain **Business-wide** for old clients.

```json
"effectiveMedia": {
  "activeLocationId": "bl…",
  "coverImageUrl": "https://…",
  "galleryPreview": {
    "items": [
      {
        "id": "img…",
        "imageUrl": "https://…",
        "sortOrder": 0,
        "locationId": "bl…",
        "scope": "branch"
      },
      {
        "id": "img…",
        "imageUrl": "https://…",
        "sortOrder": 1,
        "locationId": null,
        "scope": "brand"
      }
    ],
    "totalCount": 4
  }
}
```

**`effectiveMedia` resolution (same active location as A.7.6):** omitted/invalid/foreign `locationId` → **primary** branch. Eligible images: **`locationId = activeLocationId` OR `locationId IS NULL`** (sibling branches excluded). Order: **branch images first**, then **shared/brand**; within each scope: `sortOrder`, `createdAt`, `id`. **`moderationHidden`** rows never appear. Plan photo cap is **Business-wide**, applied **after** scope + moderation + ordering. Preview slice uses the same fixed gallery preview limit as legacy detail.

**`effectiveMedia.coverImageUrl` (read-only, does not write `Business.coverImageUrl`):** (1) first visible branch image for active location; (2) else canonical **`Business.coverImageUrl`** if it matches a visible shared image; (3) else first visible shared image; (4) else `null`.

**`effectiveCatalog` / `effectivePromotions` (Stage 6.12A.7.8.3):** same **`activeLocationId`** as **`effectivePhysical`** / **`effectiveMedia`**. Branch eligibility: **zero** assignment rows → all branches; **≥1** rows → only listed **`BusinessLocation`** ids (sibling-only items excluded). Pipeline: base public eligibility (`isActive`, active section) → **branch filter** → plan/tier publication cap → preview slice (catalog/promotions preview limits). **`ServiceMenuGroup`** remains business-wide; **`effectiveCatalog.sections`** lists only sections with ≥1 visible item at the active branch. Promotions: **`moderationHidden`** excluded from **`effectivePromotions`** (legacy **`promotionsPreview`** unchanged).

```json
"effectiveCatalog": {
  "activeLocationId": "bl…",
  "sections": [{ "id", "title", "sortOrder" }],
  "items": [{ "id", "title", "description", "price", "imageUrl", "sortOrder", "sectionId", "section" }],
  "totalCount": 12
},
"effectivePromotions": {
  "activeLocationId": "bl…",
  "items": [{ "id", "title", "description", "imageUrl", "discountText", "startDate", "endDate", "status" }],
  "totalCount": 4
}
```

**Legacy vs branch-aware (detail):**

| Field | Scope |
|-------|--------|
| `catalogPreview`, `promotionsPreview` | **Business-wide** (legacy compatibility) |
| `effectiveCatalog`, `effectivePromotions` | **Branch-aware** at resolved `activeLocationId` |

Legacy block (unchanged fields still present):

```json
{
  "id": "...",
  "title": "...",
  "coverImageUrl": "...",
  "activeLocationId": "bl…",
  "effectivePhysical": {
    "locationId": "bl…",
    "isPrimary": true,
    "cityId": "...",
    "address": "...",
    "latitude": 51.2,
    "longitude": 51.3,
    "phone": "...",
    "whatsapp": "...",
    "instagram": "...",
    "website": "...",
    "workHours": {}
  },
  "galleryPreview": { "items": [...], "totalCount": 100 },
  "catalogPreview": { "items": [...], "totalCount": 300 },
  "promotionsPreview": { "items": [...], "totalCount": 25 },
  "reviewsPreview": { "items": [...], "totalCount": 42 },
  "averageRating": 4.2,
  "reviewCount": 42
}
```

Legacy top-level business physical/contact fields remain for backward compatibility (typically mirror primary). Reviews, favorites, catalog, photos, promotions stay **Business-grain**.

Public preview limits (fixed, independent of subscription tier): gallery 6, catalog 6, promotions 3, reviews 3. Subscription limits apply to owner storage/publication only.

### GET /businesses/:id/catalog

Paginated public catalog for one business.

Query: `page` (default 1), `limit` (default 20, max 50), `sectionId` (optional — business menu group id, or omit for all), `search` (optional, max 100 — public item `title`, `titleKk`, `description`, `descriptionKk`; case-insensitive; UI locale independent), **`locationId`** (optional — Stage 6.12A.7.8.3).

| `locationId` | Behavior |
|--------------|----------|
| **Omitted** | **Legacy business-wide** catalog (unchanged). |
| **Present** | Branch-effective catalog at resolved active location (same resolver as detail/`/photos`). Response adds **`activeLocationId`**. Sections list only groups with visible items at that branch. |

Response:

```json
{
  "activeLocationId": "bl…",
  "items": [{ "id", "title", "description", "price", "imageUrl", "sectionId", "section": { "id", "title" } }],
  "sections": [{ "id", "title", "sortOrder" }],
  "pagination": { "page", "limit", "total", "totalPages", "publishedTotal" }
}
```

`activeLocationId` appears only when `locationId` query is provided. Only active items from active sections (or uncategorized). Sort: section `sortOrder`, item `sortOrder`, title, `createdAt`. Branch filter runs **before** plan publication cap.

### GET /businesses/:id/promotions

Paginated public promotions for one business (consumer full list — not the city feed).

Query: `page` (default 1), `limit` (default 20, max 50), **`locationId`** (optional — Stage 6.12A.7.9.6).

| `locationId` | Behavior |
|--------------|----------|
| **Omitted** | **Legacy business-wide** published promotions (same eligibility stack as owner public list, without branch filter). |
| **Present** | Branch-effective promotions at resolved active location (same PBA / zero-rows=ALL semantics as **`effectivePromotions`**). Response adds **`activeLocationId`**. **`moderationHidden`** excluded. |

Response:

```json
{
  "activeLocationId": "bl…",
  "items": [{ "id", "title", "titleKk", "description", "descriptionKk", "discountText", "imageUrl", "startDate", "endDate", "status" }],
  "pagination": { "page", "limit", "total", "totalPages", "publishedTotal" }
}
```

Invalid or foreign **`locationId`** for the business → **404** (same resolver as catalog/photos). Business must be public **ACTIVE**.

**`GET /promotions` city feed (A.7.9.4):** Promotion-grain with branch city eligibility + **`contextLocationId`**. Detail **`effectivePromotions`** remains branch-scoped for a chosen **`locationId`**.

### GET /businesses/:id/photos

Paginated public gallery. Stage 6.12A.7.7.2+: **`moderationHidden`** rows are **never** returned on public consumer surfaces.

Query:

| Param | Semantics |
|-------|-----------|
| `page`, `limit` | Pagination (defaults 1 / 24, max limit 50) |
| `locationId` (optional, 6.12A.7.7.3) | Same active-location resolution as **`GET /businesses/:id`**. When set: returns **active branch + shared brand** images only (branch first), never sibling branches. Each item includes **`locationId`** and **`scope`** (`brand` \| `branch`). |
| *(no `locationId`)* | **Backward compatible:** all visible Business images (Business-wide ordering), same as pre-7.7.3 clients. Items still include additive **`locationId`** / **`scope`** when present. |

Order of limits: **resolve active location (if requested) → scope eligibility → moderation filter → deterministic order → plan photo cap → pagination**. Plan cap remains **Business-wide** (not per branch).

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

### Business locations — public read (Stage 6.12A.6)

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/businesses/:id/locations/public` | **Public** (`@Public`) | `{ items: PublicBusinessLocation[] }` for **ACTIVE** business only; 404 otherwise. Order: primary first. Fields: id, businessId, cityId, **city** `{ slug, nameRu, nameKk }`, address, lat/lng, workHours, public contacts, **isPrimary**. No timestamps, no `locationSource`, no geography WKT. **Read-only** — mutations remain management routes below. |

### BusinessLocation integrity tooling (Stage 6.12A.9.4.2A — ops/dev, not HTTP)

**Target invariant (committed DB state):** every **Business** has **≥1** `BusinessLocation` and **exactly one** `isPrimary=true` (DB partial unique enforces **≤1** primary only).

**CLI (`services/catalog-api`):** `npm run integrity:business-locations` — default **DRY_RUN** (read-only plan); `--audit-only` for CI gate; `--apply` mutates only when explicitly passed. Complements **A.9.4.2B** runtime API enforcement.

### Business locations (Stage 6.12A.4 — management API)

**Identity:** `businessId` = brand/business; `locationId` = physical branch (`BusinessLocation.id`). Every route validates `BusinessLocation.businessId === :businessId`.

**Auth:** JWT required. Caller must resolve via `BusinessAccessService` (OWNER, MANAGER with permissions, or platform/city admin). Not public.

| Method | Path | Permission / access | Notes |
|--------|------|---------------------|-------|
| GET | `/businesses/:businessId/locations` | Active business access (OWNER/MANAGER/ADMIN) | `{ items: BusinessLocation[] }`; order: primary first, then `createdAt`, `id`. |
| GET | `/businesses/:businessId/locations/:locationId` | Same | 404 if location not under `:businessId`. |
| POST | `/businesses/:businessId/locations` | `BUSINESS_PROFILE_EDIT` | Body: `cityId`, `address`, optional coordinates/`locationSource`/`workHours`/contacts. **Zero** existing branches → creates **primary** (`isPrimary=true`) and syncs legacy **Business** mirror (**A.9.4.2B**); otherwise **secondary** (`isPrimary=false`, requires exactly one primary already). Cross-city allowed. Aggregate lock on **Business**. |
| PATCH | `/businesses/:businessId/locations/:locationId` | Field-level: profile fields → `BUSINESS_PROFILE_EDIT`; `workHours` → `BUSINESS_HOURS_EDIT` | Partial PATCH. **`isPrimary` not accepted.** Primary row: updates location + legacy `Business` physical fields atomically. Secondary: updates location only. |
| POST | `/businesses/:businessId/locations/:locationId/set-primary` | `BUSINESS_PROFILE_EDIT` | Transaction: unset old primary, set new primary, mirror physical fields onto `Business`. Idempotent if already primary. **409** `BUSINESS_LOCATION_PRIMARY_INVARIANT_BROKEN` when invariant corrupt (use **2A** repair). Aggregate lock on **Business**. |
| DELETE | `/businesses/:businessId/locations/:locationId` | `BUSINESS_PROFILE_EDIT` | **Secondary only** when another branch remains. **409** `BUSINESS_LOCATION_LAST_DELETE_BLOCKED` (sole surviving branch — takes precedence over primary-delete when the branch is both primary and last). **409** `BUSINESS_LOCATION_PRIMARY_DELETE_BLOCKED` (primary while other branches exist). **409** `BUSINESS_LOCATION_DELETE_BLOCKED` when branch-scoped references exist. Same transaction + aggregate lock. |

**Response DTO (`BusinessLocation`):** `id`, `businessId`, `cityId`, `address`, `latitude`, `longitude`, `locationSource`, `workHours`, `phone`, `whatsapp`, `instagram`, `website`, `isPrimary`, `createdAt`, `updatedAt` (no raw PostGIS geography).

**Current-state (A.7.9.3A + A.9.3.x):** Public catalog/search/nearby city membership and geo use **`BusinessLocation`** (presence, **`bl.cityId = C`**, PostGIS on **`BusinessLocation.location`**) — **not** **`Business.cityId` / `Business.location`** as authority. Map viewport (**`forMap` + bbox**) returns **location-grain** rows for qualifying branches (including secondaries in **C**). List/detail top-level physical fields are **compatibility projections** from effective branch context (**A.9.3.1**). Legacy **`Business`** physical columns remain in DB as primary mirror / fallback only. Retirement policy: **`docs/architecture/business-location.md`** § **6.12A.9.4.0**.

### PATCH /businesses/:id

Owner, manager (field-level permissions), or admin. Body (all optional): `title`, `shortDesc`, `description`, `address`, `latitude`, `longitude`, `locationSource`, `phone`, `whatsapp`, `instagram`, `website`, `coverImageUrl`, `workHours`.

Field groups require matching `BusinessPermission`: profile fields (including **`address`**, **`latitude`**, **`longitude`**, **`locationSource`**) → `BUSINESS_PROFILE_EDIT`; `workHours` → `BUSINESS_HOURS_EDIT`. Mixed PATCH requires all relevant permissions.

**Write authority (A.9.4.3A):** request/response JSON unchanged. **`address` / `latitude` / `longitude` / `locationSource`** are applied to the **current primary** `BusinessLocation` inside a **Business** aggregate lock; legacy **`Business`** columns updated via mirror sync. Contact/hours fields still write **`Business`** first, then mirror to primary BL (**A.3**). Coordinate city-bounds validation uses **primary branch `cityId`**, not parent **`Business.cityId`** alone.

### GET /businesses/recommended/me

Auth user recommendations (rule-based MVP; AI later). Cold start (no favorites): active businesses in city, organic title order — **not** filtered by `isFeatured`. With favorites: same-category businesses, organic title order.

### Admin

- `GET /admin/businesses?status=&citySlug=&page=&limit=` — pagination via `meta`; **`CITY_ADMIN`** filtered by **`EXISTS BusinessLocation` in managed city** (not parent **`Business.cityId` alone** — **A.9.4.1A**). Global staff unchanged.
- `GET /admin/businesses/:businessId/content` — **Stage 6.12A.7.8.6** staff **read-only** catalog/promotion inspection with server-resolved `branchScope` (`ALL` = zero assignment rows; `SELECTED` = explicit branches with address/city/primary/unavailable). Auth: **`StaffPermission.BUSINESS_VIEW`** + **`assertBusinessInAdminScope(businessId)`** (BL presence); not owner `CATALOG_EDIT` / `PROMOTIONS_EDIT`.
- `PATCH /admin/businesses/:id/status`
- `PATCH /admin/businesses/:id/featured` — body: `{ isFeatured, featuredSlot? }`
- `PATCH /admin/businesses/:id/plan` — body: `{ tier: "BASIC"|"PRO"|"TOP_CITY" }` — назначить тариф без оплаты (30 дней для paid)
- `GET /admin/categories?citySlug=` — all categories including hidden; includes `citySortOrder`, `effectiveSortOrder`
- `PATCH /admin/categories/:id/city-order` — body `{ "citySlug", "sortOrder" }`
- `GET /admin/users` — ADMIN only
- `PATCH /admin/users/:id/role` — ADMIN only; body: `{ role, managedCityId? }` (required when role is CITY_ADMIN)
- `GET /admin/audit-logs` — **ADMIN** global; **CITY_ADMIN** scoped to `managedCityId`. Query: `page`, `limit` (default 50, max 100), `action`, `resourceType`, `businessId`, `cityId`, `actorUserId`, `dateFrom`, `dateTo`. Append-only; no PATCH/DELETE. Reading audit logs does not create audit rows.
- `GET /admin/reviews?citySlug=&limit=` — reviews for businesses with a **branch in** admin city (**A.9.4.1A**); includes user + business
- `DELETE /admin/reviews/:id` — remove review; **`assertBusinessInAdminScope(review.businessId)`** for CITY_ADMIN

### POST /businesses (privileged import only)

Platform admin import (**Stage 5N.5**). Creates **Business** + exactly one **primary BusinessLocation** in one transaction (**A.9.4.3B**): request **city/address** (and optional **phone**) define authoritative **primaryPhysical**; legacy **Business** physical columns are compatibility mirror after BL create. Response shape unchanged.


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

Applicant-editable body (create/patch): `title`, `categoryId`, `citySlug`/`cityId`, `address`, `shortDesc?`, `phone?`, optional `latitude`/`longitude` (pair required together; rejects null island `0,0`), optional `locationSource` (`GEOCODED` \| `MANUALLY_ADJUSTED`; default `MANUALLY_ADJUSTED` when coords saved without source). Server sets `dedupeKey`, `status`, reviewer fields.

**Submit (Stage 6.11C.4):** `POST .../submit` requires a valid stored coordinate pair on the application. Legacy drafts without coordinates remain approvable by moderators but cannot be submitted until coordinates are set.

**Approval physical (A.9.4.3B):** Application `cityId` / `address` / optional coordinates / `locationSource` define authoritative **initial primary BusinessLocation**; legacy **Business** physical columns are compatibility mirror (same JSON as before). Legacy applications without coordinates still approve with null branch coordinates.

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

Body: `{ "businessId", "groupId?", "title", "description?", "price?", "imageUrl?", "sortOrder?", "branchAvailability?" }`

**Owner management — branch availability (Stage 6.12A.7.8.2, not public filtering yet):**

```json
"branchAvailability": {
  "mode": "ALL" | "SELECTED",
  "locationIds": ["<BusinessLocation.id>", "..."]
}
```

| Rule | Semantics |
|------|-----------|
| Omitted on **create** | **ALL** branches — zero assignment rows in DB |
| `mode: "ALL"` | `locationIds` must be `[]` — zero assignment rows |
| `mode: "SELECTED"` | `locationIds` must contain ≥1 unique `BusinessLocation.id` for the same `businessId` |
| Omitted on **PATCH** | Assignments **unchanged** (title/price/etc. only) |

Management responses (`POST`/`PATCH`/`GET /service-items/manage/:businessId`) include `branchAvailability`. Public `GET /service-items?businessId=` is unchanged (no branch filtering; field not required on public reads).

### PATCH /service-items/:id

Body may include `groupId` to move item into another group, and optional `branchAvailability` to replace assignment set atomically.

### DELETE /service-items/:id

---

## Promotions

### GET /promotions

Query: `activeNow`, `page`, `limit`, `citySlug`, `cityId`, `businessId`. **`citySlug` / `cityId` omitted** → default city slug from app config (same as catalog). **`businessId`** scopes to one business (no city branch filter; no `contextLocationId` on owner/management responses).

When `activeNow=true` and no `businessId`, only promotions from businesses on **PRO** or **TOP_CITY** with valid `planExpiresAt` appear in the city feed.

**City feed physical eligibility (A.7.9.4, IMPLEMENTED):** Promotion-grain — **one card per Promotion**. **`Business.cityId` is not** physical presence. In city **C** (no `businessId`):

- **ALL** (zero `PromotionBranchAvailability` rows): eligible iff parent **Business** is public-eligible **and** **`EXISTS BusinessLocation` with `cityId = C`**.
- **SELECTED** (≥1 PBA rows): eligible iff **`EXISTS PBA` → `BusinessLocation` in `cityId = C`**.

**`contextLocationId` (additive, public city feed only):** ALL → deterministic branch in **C** (same rule as discovery A.7.9.3A); SELECTED → assigned branch in **C** (primary if assigned, else `createdAt ASC`, `id ASC`). Embedded **`business.address`** remains legacy; navigation uses **`contextLocationId`**, not **`Business.location`**.

Response item includes `{ id, businessId, title, description?, imageUrl?, discountText?, startDate?, endDate?, status, business, contextLocationId? }`.

### Owner CRUD

- `POST /promotions`
- `PATCH /promotions/:id`
- `DELETE /promotions/:id`

**Owner management — branch availability (Stage 6.12A.7.8.2):** same `branchAvailability` object and semantics as service items (ALL = zero rows; SELECTED = explicit branches; omitted on create = ALL; omitted on PATCH = unchanged). Owner-scoped `GET /promotions?businessId=` includes `branchAvailability` on each item. Public city feed branch filtering: **A.7.9.4** above.

---

## Reviews

Public visibility: `moderationHidden = false` **and** `deletedAt = null` (central `publicReviewWhere()`).

- `GET /reviews?businessId=&page=&limit=` — paginated public list (`items` + `pagination`; default limit 20, max 50; newest first, tie-break `id` desc). Hidden/deleted reviews excluded.
- `GET /reviews/manage/:businessId` — owner/manager plane list (`REVIEWS_REPLY`; non-deleted only; includes `moderationHidden`; not paginated in MVP)
- `GET /reviews/me` — active user reviews only (`deletedAt = null`; includes moderation-hidden)
- `POST /reviews` — one row per `(userId, businessId)`; active duplicate → **409** `REVIEW_ALREADY_EXISTS`; soft-deleted row → **restore** same id (does not clear `moderationHidden`; no owner notification if still hidden)
- `PATCH /reviews/:id` — author edits `rating`/`text` only; hidden stays hidden
- `DELETE /reviews/:id` — author soft-delete (`deletedAt`); idempotent if already deleted
- `GET /businesses/:businessId/plan` — plan context (`PAYMENTS_VIEW`)
- `GET /businesses/:businessId/plan/payments` — last 50 `PlanPayment` rows for business (`PAYMENTS_VIEW`)
- `POST /businesses/:businessId/plan/mock-checkout` — OWNER only; dev/test mock activation when enabled
- `PATCH /reviews/:id/reply` (authenticated; `BusinessMembership` + `REVIEWS_REPLY` + plan; not on soft-deleted reviews; not global `UserRole.BUSINESS`-only)

Errors: `REVIEW_SELF_REVIEW_FORBIDDEN` (403), `REVIEW_NOT_ACTIVE` (400 on edit deleted), mutation rate limit **429**.

**Rating integrity:** DB `CHECK (rating BETWEEN 1 AND 5)`; `@@unique([userId, businessId])`.

**Business detail:** top-level `averageRating` (null when no public reviews) and `reviewCount` (0 when none) match catalog/search aggregation semantics.

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

**Stage 6.12A.8.5 — `businessLocationId` (optional):** branch **interaction context** for the event (application-selected/effective branch), **not** user GPS. Allowed only on organic types where branch context is valid (`VIEW_BUSINESS`, impressions, contact clicks, `PROMOTION_VIEW`, catalog item impression/view). **Rejected (`400`)** for `SEARCH_PERFORMED`, favorites, reviews, and other disallowed types. When set with `businessId`, server validates `BusinessLocation.id` belongs to that business; cross-business pairs **never persist** (`400` `businessLocationId does not belong to business`). Omitted → stored as null. Business-grain events (favorites, reviews) remain null branch.

Ad events (`AD_*`) remain on `POST /monetization/ads/events` only — **clients cannot submit** `businessLocationId`. Server sets branch on `AnalyticsEvent` when provable: **`AD_SERVED`** uses A.8.3 **runtime resolved destination** at serve time; client-reported ad events use **explicit** `AdCampaign.destinationBusinessLocationId` only (runtime PBA/city-context resolution without serve context is **not** attributed on client events — null is preferred over false attribution).

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

Attach uploaded image to business (owner / CITY_ADMIN scoped / ADMIN). Stage 6.12A.7.7.2.

Body:
```json
{
  "imageUrl": "/uploads/uuid.jpg",
  "asCover": true,
  "locationId": "optional BusinessLocation.id"
}
```

- **`locationId` omitted / null:** shared (brand) **`BusinessImage`**.
- **`locationId` valid for `:businessId`:** branch-scoped image (composite FK enforced).
- **Invalid / foreign `locationId`:** `400` — no silent fallback to shared.
- **`asCover: true`:** allowed **only** when `locationId` is omitted/null (sets **`Business.coverImageUrl`**). Branch images cannot become brand cover (`400`).

Photo plan limits remain **Business-wide** (shared + all branches).

### GET /uploads/business/:businessId/images

Auth: owner / admin. List gallery images ordered by `sortOrder`, `createdAt`. Response rows include **`locationId`** (nullable).

Query (additive, Stage 6.12A.7.7.2):

| Query | Result |
|-------|--------|
| *(none)* or `scope=all` | All images for the business |
| `scope=brand` | Shared images only (`locationId` null) |
| `locationId=<id>` | One branch’s images (`locationId` must belong to `:businessId`) |

Cannot combine `scope=brand` with `locationId`. Management list includes **moderation-hidden** rows (owner/admin visibility).

### DELETE /uploads/business/:businessId/images/:imageId

Auth: owner / admin. Removes image scoped to `:businessId`. If deleted row was brand cover, next cover candidate is the next **shared** image (`locationId` null) only; otherwise **`Business.coverImageUrl`** → `null`.

### PATCH /uploads/business/:businessId/images/:imageId/cover

Auth: owner / admin. Sets **`Business.coverImageUrl`** from image URL. **Only shared images** (`locationId` null) eligible; branch image → `400`.

---

## Notifications

**Canonical rule (Stage 6.11E.5):** persisted in-app `Notification` is the product source of truth. FCM push is an optional delivery channel; push failure must not roll back domain actions.

Auth: JWT required for all routes below. Rows are scoped to the authenticated user (`userId`).

### GET /notifications?page=1&limit=20

Paginated list for the current user.

- Default `limit`: 20
- Max `limit`: 50
- Order: `createdAt DESC`, `id DESC`

Response:

```json
{
  "items": [
    {
      "id": "…",
      "type": "NEW_REVIEW",
      "title": "…",
      "body": "…",
      "isRead": false,
      "createdAt": "2026-09-20T12:00:00.000Z",
      "targetType": "REVIEW",
      "targetId": "…",
      "payload": { "businessId": "…", "reviewId": "…" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 73, "totalPages": 4 }
}
```

Legacy rows may have `targetType`, `targetId`, and `payload` as `null`. `title` / `body` remain for backward compatibility.

### GET /notifications/unread-count

Response: `{ "count": 3 }`

### PATCH /notifications/:id/read

Marks one notification read for the current user. Response: `{ "success": true, "id": "…", "isRead": true }` or `404` if not owned.

### PATCH /notifications/read-all

Response: `{ "success": true, "updated": 4 }`

### POST /notifications/devices

Registers or refreshes the caller's FCM device token (upsert by unique `token`, safe reassignment on account change).

Body:

```json
{ "token": "…", "platform": "ANDROID", "locale": "ru" }
```

- `platform`: `ANDROID` | `IOS`
- `locale` (optional): client hint `ru` | `kk` for push copy
- `userId` is always derived from JWT (never accepted from client)

Response: `{ "id": "…", "platform": "ANDROID", "isActive": true, "lastSeenAt": "…" }`

### DELETE /notifications/devices

Revokes the caller's registration (body-based, token not in URL).

Body: `{ "token": "…" }`

Response: `{ "success": true }` or `404` if not owned/active.

**Server push (optional):** controlled by `PUSH_ENABLED=true` plus Firebase Admin env vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`). Default local: disabled (`PUSH_ENABLED=false`).

**NotificationType (canonical):** `GENERAL`, `NEW_REVIEW`, `REVIEW_REPLY`, `REVIEW_HIDDEN`, `REVIEW_RESTORED`, `BUSINESS_APPROVED`, `BUSINESS_BLOCKED`, `BUSINESS_APPLICATION_APPROVED`, `BUSINESS_APPLICATION_REJECTED`, `OWNERSHIP_CLAIM_APPROVED`, `OWNERSHIP_CLAIM_REJECTED`, `BUSINESS_INVITATION_RECEIVED`, `BUSINESS_INVITATION_ACCEPTED`, `NEW_PROMOTION` (unused), `PLAN_ACTIVATED`, `PLAN_EXPIRED`, `AD_CAMPAIGN_APPROVED`, `AD_CAMPAIGN_REJECTED`

Producer matrix: `docs/architecture/notification-producers.md`

**NotificationTargetType:** `BUSINESS`, `REVIEW`, `PROMOTION`, `BUSINESS_APPLICATION`, `OWNERSHIP_CLAIM`, `PLAN`, `ORDER`, `PAYMENT`, `AD_CAMPAIGN`, `MODERATION_CASE`

Read state: `isRead` boolean (no `readAt` in E.1). Opening a notification in clients may mark read via PATCH; backend does not auto-read on GET.

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

- `GET /monetization/ads/serve?placementCode&sessionId&citySlug|cityId&categoryId?&limit?&platform?`

**Stage 6.12A.8.6 — optional `platform` query:** same enum as organic analytics — `IOS` | `ANDROID` | `WEB` | `UNKNOWN`. Identifies the **client runtime** that requested serve (native app vs browser). Stored on server-created **`AD_SERVED`** only when provided. Omitted → `null` (legacy/unattributed). Invalid enum → **400**. **No** User-Agent derivation; **not** inferred from `placementCode`.

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
      "destinationLocationId": "cloc_...",
      "contextLocationId": "cloc_...",
      "business": { "id": "...", "title": "...", "slug": "...", "...": "..." }
    }
  ]
}
```

**Stage 6.12A.8.3 — serve item branch fields (implemented):**

| Field | Meaning |
|-------|---------|
| `destinationLocationId` | Resolved **BusinessLocation.id** to open after ad tap (**A.8.4:** Flutter passes as `locationId` on business detail; authoritative over client branch selection). |
| `contextLocationId` | Branch used for **business-card physical context** on this serve item. **A.8.3:** always equal to `destinationLocationId` when set; both `null` only when no safe branch in the resolved serving city (legacy card uses Business physical columns). |

Campaign ownership remains **`businessId`**. **`business.id` is never a branch id.**

**Runtime resolution (all placements share one engine):** precedence — (1) `destinationBusinessLocationId`, (2) `targetBusinessLocationId`, (3) promotion **PBA** branch in serving city (deterministic **A.7.9.4** pick for SELECTED; city context for ALL), (4) **A.7.9.3A** city-context branch for brand-level null/null campaigns. Never pick a branch outside the **resolved serving city**. **Target** set → campaign eligible only when that branch is in serving city and matches campaign city. Invalid/stale branch or promotion → campaign **excluded** (fail-closed), not a partial response error.

**Branch-effective card:** for FEATURED/TOP/BOOST/PROMOTED items, `business.address` / coords / phone (and promotion subset fields) reflect the resolved branch via **`buildEffectivePhysicalDto`** — no sibling branch leakage.

**VIP creative:** `EXTERNAL_URL` keeps URL behavior; branch fields follow campaign targeting/eligibility only.

**Owner/admin campaign objects** (`GET /monetization/campaigns`, `GET /monetization/campaigns/:id`, admin list/detail) may include nullable:

| Field | Meaning |
|-------|---------|
| `targetBusinessLocationId` | Optional **serve eligibility** narrowing to one branch (`null` = unchanged city/category behavior) |
| `destinationBusinessLocationId` | Optional **tap destination** branch (`null` = default destination rules in A.8.3+) |

Composite DB FKs on **AdCampaign** enforce `(businessId, locationId)` belongs to the campaign owner; **`ON DELETE RESTRICT`** on branch delete while referenced (clear campaign fields in **A.8.2** lifecycle). **AnalyticsEvent** uses `businessLocationId` → `BusinessLocation.id` with **`ON DELETE SET NULL`**; `businessId` ↔ branch consistency on ingest → **A.8.5**.

**Stage 6.12A.8.2 — campaign branch validation (implemented):**

| Rule | Behavior |
|------|----------|
| Ownership | `targetBusinessLocationId` / `destinationBusinessLocationId` must belong to campaign `businessId` (composite FK + service check). |
| City | When a branch is set, **`BusinessLocation.cityId` must equal `AdCampaign.cityId`** (physical authority; not `Business.cityId`). |
| Target vs destination | Independent concepts; if **both** are set they **must be the same branch** (v1 — no advertise-L1/open-L2). |
| Promotion destination | `destinationBusinessLocationId` must satisfy **PBA** for `promotionId` when set. |
| PROMOTED_PROMOTION + null destination | **ALL branches** (zero PBA rows): destination may stay null until A.8.3. **SELECTED PBA:** exactly **one** eligible branch in campaign city → auto-stored as destination at order/provision; **>1** eligible → **`PROMOTION_DESTINATION_BRANCH_REQUIRED`** until explicit destination. |
| Checkout input | Optional `targetBusinessLocationId` / `destinationBusinessLocationId` on **`POST /monetization/orders`** line items (and package order body); copied to order item metadata and provisioned onto `AdCampaign`. |
| Branch delete | Owner **`DELETE`** location: nullable campaign target/destination pointers cleared in one transaction when resulting campaign config remains valid; otherwise **`409`** `BUSINESS_LOCATION_DELETE_BLOCKED` (same family as catalog/promotion assignment conflicts). |
| Provision city default (**A.9.4.1B**) | **`resolveCampaignMarketCityId`:** target/dest BL city → explicit city with branch presence → **primary** **`BusinessLocation.cityId`** → parent **`Business.cityId`** only when BL resolution unavailable. Order/quote/inventory use the same resolved city. |

**Stage 6.12A.8.4 — Flutter consumption (implemented):** ad taps use `destinationLocationId ?? contextLocationId` only (no client branch lookup); promotion ads may fall back to `promotion.contextLocationId` when serve fields are null; **`EXTERNAL_URL` VIP** unchanged.

**Stage 6.12A.8.5 — analytics branch (implemented):** see **POST /analytics/events** and **POST /monetization/ads/events** notes above; owner KPI totals unchanged (branch is optional dimension only).

**Stage 6.12A.8.6 — analytics platform (implemented):** optional **`platform`** on ad track + serve (same **`AnalyticsPlatform`** enum as organic). Meaning: client runtime on which **that** event occurred. Omitted → `null`; **`UNKNOWN`** only when client explicitly sends it. Invalid values rejected. **Consumer Web** may send `WEB` when Web ads ship; Web ads/UI not implemented in A.8.6. Campaign channel targeting (`ALL`/`APP`/`WEB`) remains a separate future dimension.

- `POST /monetization/ads/events` — track impression/click/action (rate limit 120/min/IP)

**Body:**
```json
{
  "campaignId": "...",
  "placementCode": "HOME_FEATURED",
  "sessionId": "abc123",
  "type": "AD_IMPRESSION",
  "position": 1,
  "platform": "ANDROID"
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

## Staff admin & authorization (Stage 6.9.1 / 6.9.1.1)

Staff routes require active `StaffAccess`, permission checks, and (for sensitive mutations) recent step-up.

### Staff management (SUPER_ADMIN permissions)

- `GET /admin/staff` — `STAFF_VIEW`
- `GET /admin/staff/overview` — `STAFF_VIEW`
- `GET /admin/staff/:userId` — `STAFF_VIEW`
- `POST /admin/staff` — `STAFF_CREATE`, `STAFF_ROLE_ASSIGN`, **step-up**
- `PUT /admin/staff/:userId/role` — `STAFF_ROLE_ASSIGN`, **step-up**
- `PUT /admin/staff/:userId/city-scopes` — `STAFF_CITY_SCOPE_ASSIGN`, **step-up**
- `POST /admin/staff/:userId/disable` — `STAFF_DISABLE`, **step-up**
- `POST /admin/staff/:userId/restore` — `STAFF_UPDATE`, **step-up**
- `POST /admin/staff/:userId/sessions/revoke-all` — `STAFF_SESSION_REVOKE`, **step-up**

Legacy `PATCH /admin/users/:id/role` — **USER/BUSINESS only**; staff roles must use `/admin/staff`.

## Admin reporting (Stage 6.9.2)

Prefix: `/admin/reports` (read-only). Each route requires matching `REPORT_*` permission (see `docs/admin/reporting.md`).

Examples:

- `GET /admin/reports/overview` — `REPORT_OVERVIEW_VIEW`
- `GET /admin/reports/finance` — `REPORT_FINANCE_VIEW`
- `GET /admin/reports/staff` — `REPORT_STAFF_VIEW` (+ SUPER_ADMIN service guard)
- `GET /admin/reports/export?report=plans&format=csv` — `REPORT_EXPORT`

Query filters: `from`, `to`, `cityId`, `citySlug`, `businessId`, pagination on list endpoints where applicable.

Admin Web consumption (Stage 6.9.2.1): typed client `apps/admin-web/lib/reporting/reporting-api.ts`, routes `/reports/*`, role nav and filters documented in `docs/admin/reporting-ui.md`.

### Staff MFA (Stage 6.9.1.2)

See `docs/security/staff-mfa.md`. Login may return `{ mfaRequired, mfaChallengeToken }` or `{ enrollmentRequired, accessToken, refreshToken }` with JWT claim `mfaEnrollOnly`. Step-up body may include `totp` / `recoveryCode` when MFA enabled.

### Step-up

- `POST /auth/staff/step-up` — body `{ "code": "<otp>" }`; returns `{ "accessToken", "stepUpAt" }`
- TTL: **600 seconds** (10 minutes) unless configured via `app.staffStepUpTtlSeconds`

### Staff error codes (403/401 body)

| Code | Meaning |
|------|---------|
| `STAFF_ACCESS_REQUIRED` | Not staff / missing staff portal access |
| `STAFF_ACCESS_DISABLED` | StaffAccess inactive |
| `STAFF_PERMISSION_DENIED` | Missing permission for action |
| `STAFF_CITY_SCOPE_DENIED` | CITY_ADMIN outside assigned cities |
| `STAFF_SELF_ROLE_CHANGE_FORBIDDEN` | Self role/scope change blocked |
| `STEP_UP_REQUIRED` | Recent OTP step-up required |
| `STAFF_SESSION_REVOKED` | JWT session binding invalid/revoked |
| `MFA_REQUIRED` | Reserved (MFA not implemented) |

Access tokens for staff include claim `sid` (AuthSession id) for immediate revocation after disable.

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
