# BusinessLocation architecture (Stage 6.12A)

## Model split (accepted A.0)

| Entity | Role |
|--------|------|
| **Business** | Brand / organization identity: title, slug, taxonomy, plan, membership, reviews, favorites, promotions, catalog, ads, analytics |
| **BusinessLocation** | Physical branch / venue: city, address, coordinates, hours, branch contacts |

Relationship: **Business 1 → N BusinessLocation**.

## Stage 6.12A.1 (database foundation)

- **`BusinessLocation` table** added with physical fields mirroring `Business` (address, lat/lng, `location` geography, `locationSource`, `workHours`, contacts).
- **`isPrimary`** with partial unique index: **at most one** primary row per `businessId` (DB-enforced). Supported production onboarding/branch APIs maintain **exactly one** primary for branch-bearing businesses; direct SQL/Prisma bypass can yield zero-primary multi-location state — detect via read-only `scripts/dev/audit-primary-integrity.mjs` (A.9.1).
- **PostGIS:** isolated trigger `business_location_derive_location_from_coordinates` + GiST index on `BusinessLocation.location`.
- **Legacy `Business` physical columns unchanged** and remain authoritative for all APIs and map queries until later substages.
- **No data backfill** in A.1; **no public API** for locations yet.

## Stage 6.12A.2 (1:1 backfill)

- Migration **`20260921190000_stage_6_12a2_business_location_backfill`**: idempotent `INSERT … SELECT` from `Business` where no `BusinessLocation` exists yet.
- Copies: `cityId`, `address`, lat/lng, `locationSource`, `workHours`, phone/social/website; **`isPrimary = true`**; deterministic `id` prefix `bl` + md5 fragment.
- **Does not UPDATE `Business`** — legacy physical columns remain authoritative for APIs and map until A.3+.
- **Geography:** derived on insert via BusinessLocation trigger (not copied from `Business.location`).
- **Temporary gap (until A.3):** closed in A.3 — see below.

## Stage 6.12A.3 (primary compatibility & write sync)

- **Transition policy:** legacy `Business` physical columns remain on public API responses; **writes** to those fields and **production creates** keep the **primary** `BusinessLocation` in sync in the **same DB transaction**.
- **Synchronized fields:** `cityId`, `address`, `latitude`, `longitude`, `locationSource`, `workHours`, `phone`, `whatsapp`, `instagram`, `website` (brand/plan/taxonomy fields are **not** mirrored).
- **Central services:** `BusinessPrimaryLocationService` — resolve primary (`isPrimary=true` only; no “first by createdAt” fallback); `createInitialPrimary`; `syncPrimaryFromBusinessRecord`.
- **Production create paths:** admin `POST /businesses` (import) and business-application **approval** create `Business` + one primary location atomically.
- **Owner PATCH:** `PATCH /businesses/:id` — when the DTO touches any synchronized physical field, update Business + primary location in one transaction; brand-only patches skip location writes; partial PATCH semantics unchanged (omitted fields not cleared).
- **Primary resolution errors:** missing or multiple primary rows → controlled internal error on sync paths (no silent repair during ordinary PATCH).
- **Read layer (A.3):** writes keep primary in sync; **A.9.3.1** public list/detail/favorites **project** top-level physical fields from effective **BusinessLocation** context (primary or `contextLocationId`); **A.9.3.2** discovery SQL (search address predicates, bbox membership, search relevance address tier) uses **BusinessLocation** only; **A.9.3.2b** removed **`Business.latitude/longitude`** from **`GET /businesses`** Prisma geo filters — complete bbox and map readiness use **BL PostGIS / branch coordinate guards**; legacy **Business** columns remain in schema as compatibility storage, not blind read authority for discovery geo/search.
- **Map / discovery geo (A.7.1+ / A.9.3.2b):** public list/map viewport membership uses **`BusinessLocation.location`** (PostGIS) and branch coordinate guards — **not** legacy **`Business.location`** / **`Business.latitude/longitude`** as filter authority. Write-path triggers still keep primary **`Business`** mirror and primary **`BusinessLocation`** geography aligned on coordinate updates.

## Stage 6.12A.4 (multi-location management API)

- **Endpoints:** `GET/POST/PATCH` under `/businesses/:businessId/locations`, plus `POST …/set-primary` (see [api-contracts.md](./api-contracts.md)).
- **Business 1 → N locations:** secondary branches may live in **different cities**; `Business.cityId` remains the **primary** city for legacy/discovery compatibility.
- **Create:** always `isPrimary=false`; does not copy primary contacts/hours unless provided in body.
- **PATCH secondary:** branch-only — legacy `Business` and primary row unchanged.
- **PATCH primary / set-primary / legacy PATCH Business:** bidirectional sync of synchronized physical fields (A.3 service layer); single transaction; no HTTP recursion.
- **Primary switch:** explicit `set-primary` only (generic PATCH cannot toggle `isPrimary`); partial unique index preserved via unset-old-then-set-new in one transaction.
- **Authorization:** existing **Business-scoped** membership (`OWNER` / `MANAGER` + `BusinessPermission`); **no** branch-level membership.
- **Deferred:** DELETE/archive lifecycle; public branch discovery; map markers for secondaries.

## Stage 6.12A.5 (owner & admin management UX)

- **Business Web:** route `/business/[id]/locations` (“Филиалы” / `Филиалдар`); main nav when `BUSINESS_PROFILE_EDIT` or `BUSINESS_HOURS_EDIT`. List with **`isPrimary`** badge (not array order); create/edit via A.4 DTO; city from **`listCities()`** (cross-city secondaries allowed); reuses profile **`BusinessLocationField`** + hours/contact patterns. **No `isPrimary` on create**; **no DELETE** UI.
- **Set primary:** `window.confirm` with city/address; `POST …/set-primary`; refreshes location list and **`listMyBusinesses`** so shell/profile primary fields stay current after cross-city switch.
- **Permissions UX:** hide mutating actions without `BUSINESS_PROFILE_EDIT`; hours fields require `BUSINESS_HOURS_EDIT`; backend 403 unchanged. **No branch-level RBAC.**
- **Admin Web (minimal):** read-only **`BusinessLocationsReadonly`** on approved business-application detail (staff token → same list endpoint). **No admin edit form** in A.5 — full management remains Business Web.
- **Unchanged:** consumer-web public discovery, map/PostGIS cutover, ads, reviews/favorites/plans scope.

## Stage 6.12A.6 (Flutter & Consumer Web client consumption)

- **Public read contract:** `GET /businesses/:id/locations/public` (guest-safe, ACTIVE business only). Management `GET/POST/PATCH/set-primary` unchanged and **not** used by guest clients.
- **Flutter:** `BusinessBranchLocation` model + public fetch; consumer detail shows **Филиалы** when **>1** branch; primary badge via **`isPrimary`**; top-level Business fields unchanged; map still primary point (A.7).
- **Consumer Web:** typed client + branch block on temporary **`/businesses/[id]`** (F.3 **noindex** preserved); no F.4 slug/SEO/LocalBusiness.
- **Frozen:** discovery/search/category filters; map PostGIS/GeoJSON; branch reviews/favorites/plans.

## Stage 6.12A.7.1 (map viewport backend cutover)

- **Scope:** `GET /businesses` with **`forMap=true`** and viewport bbox only. PostGIS grain switches from **`Business.location`** to **`BusinessLocation.location`** joined to parent **`Business`**.
- **Identity:** each matching branch is one list item — **`locationId`** = `BusinessLocation.id`; **`id`** remains **Business id** (additive contract; do not repurpose `id`).
- **Physical fields** on map rows (`cityId`, address, coordinates, branch contacts, `workHours`) come from **BusinessLocation**; category/status/plan/cover/title from **Business**.
- **City filter:** map uses **`BusinessLocation.cityId`** (branch city), not primary `Business.cityId`.
- **Status:** parent **`Business.status`** only (no `BusinessLocation.status`).
- **Unchanged in A.7.1:** nearest/radius/search/category discovery without map viewport grain (still **one row per Business**, primary geography); Flutter map marker identity (**A.7.2**); MapLibre/style; geocoding; ads/plans/reviews/favorites scope.
- **Search + forMap + bbox:** business text match remains parent Business semantics; branch **`bl.address`** is also matched; map+bbox+search may return multiple rows per business when several branches match viewport.
## Stage 6.12A.7.2 (Flutter map physical identity)

- **Scope:** Flutter map client only (`apps/mobile` map feature + shared `BusinessModel` parsing). Backend A.7.1 contract unchanged.
- **Identity:** **`BusinessModel.id`** = **Business.id** (detail, reviews, favorites, analytics). **`locationId`** (optional on non-map payloads) = **BusinessLocation.id** for map rows.
- **Physical key:** `mapPhysicalKey(row)` = `locationId ?? id` (legacy fallback when `locationId` absent).
- **Map state:** `MapBusinessesState.byLocationId` keyed by physical key — multiple branches of one business are distinct entries; pagination merge uses physical key, not business id.
- **Viewport fetch (MAP-PERF.C2):** camera idle sends **visible** bounds; API request uses **visible.padded(0.12)**. **`lastFetchBounds`** stores that padded coverage after a **complete** successful fetch. Further idles **suppress** fetch while **visible ⊆ lastFetchBounds** (containment, not padded-vs-visible edge deltas). City/category scope reset clears **`lastFetchBounds`**.
- **GeoJSON:** `Feature.id` = physical key; `properties.locationId` = physical key; `properties.businessId` = Business.id; dedup by physical key.
- **Selection / tap:** map selection is **location** identity; preview and directions use the **selected location row** (address, lat/lng); opening full detail uses **Business.id** plus optional **`locationId`** query for branch-aware detail physical fields.
- **Unchanged:** reviews/favorites/analytics Business-scoped; MapLibre style/basemap; geocoding; cluster styling/thresholds; nearest/radius discovery grain.

## Stage 6.12A.7.4 (physical QA hotfix)

- **Category map:** native GeoJSON uses **`mapLayerItems`** (filtered by padded **`lastFetchBounds`**) so sibling branches fetched for the viewport are not dropped by tighter **`visibleBounds`** alone.
- **Detail handoff:** optional `locationId` on business detail route; **`resolveActiveBusinessPhysicalContext`** applies selected public branch to address/route/coordinates; reviews/favorites remain **Business.id**.

## Compatibility strategy (forward)

- Later substages may project legacy DTO fields from primary location before deprecating columns.
- **Post A.7.2:** optional discovery migration to location grain is a separate product decision; physical multi-branch QA gate follows automated client cutover.

## Scope deferred

- Branch operational status enums, location slugs (F.4 URLs), branch-scoped reviews/favorites/promotions, membership location scope, 6.12B import provenance.

## Naming debt

Prisma enum **`BusinessLocationSource`** describes coordinate provenance only; it is reused on `BusinessLocation.locationSource` and is not the entity name.
