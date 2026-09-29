# BusinessLocation architecture (Stage 6.12A)

**Ownership / claim:** staff-created and application-created businesses must satisfy primary-BL invariants here; owner grant flows — [business-web-ownership.md](./business-web-ownership.md).

## Model split (accepted A.0)

| Entity | Role |
|--------|------|
| **Business** | Brand / organization identity: title, slug, taxonomy, plan, membership, reviews, favorites, promotions, catalog, ads, analytics; brand-level contact defaults. **Target schema (A.9.4.5D1+):** no **`cityId`** on **Business**; live dev DB may remain **PRE-5D2** until migration apply |
| **BusinessLocation** | **Authoritative** physical branch / venue: city, address, coordinates, `locationSource`, PostGIS **`location`**, hours, branch contacts |

Relationship: **Business 1 → N BusinessLocation**.

## Stage 6.12A.9.4.4C4 (legacy Business geo storage retired — dev DB)

Migration **`20260926120000_stage_6_12a9_4_4c4_business_geo_column_retirement`** (applied on dev **`qalago_dev`**):

- **Removed from `Business`:** `address`, `latitude`, `longitude`, `locationSource`, `location` (geography), **`business_sync_location_trigger`**, **`Business_location_gist_idx`**, **`business_derive_location_from_coordinates()`**.
- **Retained on `Business`:** **`cityId`** (compatibility mirror of primary BL city until **A.9.4.5**), **`workHours`**, **`phone`**, **`whatsapp`**, **`website`**, **`instagram`** (synced from primary BL on normal write paths — **A.9.4.4C1**).
- **PostGIS authority:** **`BusinessLocation.location`** + **`business_location_sync_location_trigger`** / GiST index unchanged.
- **Public API physical fields** (`address`, `latitude`, `longitude`, `locationSource`, `effectivePhysical`, map/list **`contextLocationId`**) are **projected from BusinessLocation** only — no Prisma read/write of retired Business geo columns.

## Stage 6.12A.1 (database foundation)

- **`BusinessLocation` table** added with physical fields mirroring `Business` (address, lat/lng, `location` geography, `locationSource`, `workHours`, contacts).
- **`isPrimary`** with partial unique index: **at most one** primary row per `businessId` (DB-enforced). Supported production onboarding/branch APIs maintain **exactly one** primary for branch-bearing businesses; direct SQL/Prisma bypass can yield zero-primary multi-location state — detect via read-only `scripts/dev/audit-primary-integrity.mjs` (A.9.1).
- **PostGIS:** isolated trigger `business_location_derive_location_from_coordinates` + GiST index on `BusinessLocation.location`.
- **Legacy `Business` physical columns unchanged** on schema; public read authority moved to **BusinessLocation** projection in **A.9.3.1+**; writes keep primary mirror in **A.3**.
- **No data backfill** in A.1; **no public API** for locations yet.

## Stage 6.12A.2 (1:1 backfill)

- Migration **`20260921190000_stage_6_12a2_business_location_backfill`**: idempotent `INSERT … SELECT` from `Business` where no `BusinessLocation` exists yet.
- Copies: `cityId`, `address`, lat/lng, `locationSource`, `workHours`, phone/social/website; **`isPrimary = true`**; deterministic `id` prefix `bl` + md5 fragment.
- **Does not UPDATE `Business`** — seeds primary **BusinessLocation** rows; legacy **Business** physical columns remain **compatibility mirror** (synced on writes per **A.3** / **A.9.4.3A**).
- **Geography:** derived on insert via BusinessLocation trigger (not copied from `Business.location`).
- **Temporary gap (until A.3):** closed in A.3 — see below.

## Stage 6.12A.3 (primary compatibility & write sync)

- **Transition policy:** legacy `Business` physical columns remain on public API responses as **compatibility mirror**; public reads project from **BusinessLocation** (**A.9.3.x**). **Owner PATCH** primary physical authority inverted in **A.9.4.3A** (see below); contact/hours and transitional create paths still use **Business → primary BL** sync where noted.
- **Synchronized fields:** `cityId`, `address`, `latitude`, `longitude`, `locationSource`, `workHours`, `phone`, `whatsapp`, `instagram`, `website` (brand/plan/taxonomy fields are **not** mirrored).
- **Central services:** `BusinessPrimaryLocationService` — resolve primary (`isPrimary=true` only; no “first by createdAt” fallback); `createInitialPrimary`; `syncPrimaryFromBusinessRecord`.
- **Production create paths (A.9.4.3B):** admin `POST /businesses` and business-application **approval** use **`createBusinessWithInitialPrimary`** — authoritative **`primaryPhysical`** snapshot → primary **BusinessLocation** → **`syncBusinessFromPrimaryLocationRecord`** on **Business** (NOT NULL bootstrap on Business INSERT only).
- **Owner PATCH (pre–A.9.4.3A):** `PATCH /businesses/:id` wrote **Business** first, then **`syncPrimaryFromBusinessRecord`**. **A.9.4.3A** inverts **address / latitude / longitude / locationSource** only: authoritative write on **primary BusinessLocation**, then **`syncBusinessFromPrimaryLocationRecord`** onto **Business** mirror; **phone / whatsapp / website / instagram / workHours** remain **Business-level** writes with **Business → primary BL** contact sync. Aggregate **Business** row lock + primary re-resolution inside the transaction (**A.9.4.2B** discipline). Coordinate validation uses **primary `BusinessLocation.cityId`**, not parent **`Business.cityId`**. Brand-only patches skip location writes; partial PATCH semantics unchanged.
- **Primary resolution errors:** missing or multiple primary rows → controlled internal error on sync paths (no silent repair during ordinary PATCH).
- **Read layer (A.3):** writes keep primary in sync; **A.9.3.1** public list/detail/favorites **project** top-level physical fields from effective **BusinessLocation** context (primary or `contextLocationId`); **A.9.3.2** discovery SQL (search address predicates, bbox membership, search relevance address tier) uses **BusinessLocation** only; **A.9.3.2b** removed **`Business.latitude/longitude`** from **`GET /businesses`** Prisma geo filters — complete bbox and map readiness use **BL PostGIS / branch coordinate guards**; legacy **Business** columns remain in schema as compatibility storage, not blind read authority for discovery geo/search.
- **Map / discovery geo (A.7.1+ / A.9.3.2b):** public list/map viewport membership uses **`BusinessLocation.location`** (PostGIS) and branch coordinate guards — **not** legacy **`Business.location`** / **`Business.latitude/longitude`** as filter authority. Write-path triggers still keep primary **`Business`** mirror and primary **`BusinessLocation`** geography aligned on coordinate updates.

## Stage 6.12A.4 (multi-location management API)

- **Endpoints:** `GET/POST/PATCH` under `/businesses/:businessId/locations`, plus `POST …/set-primary` (see [api-contracts.md](./api-contracts.md)).
- **Business 1 → N locations:** secondary branches may live in **different cities**; **`Business.cityId`** is **home/parent/compatibility city** (mirrors primary when synced) — **not** public discovery city membership (**A.7.9.3A+** uses **`BusinessLocation.cityId`**).
- **Create:** first branch on a zero-location business → **primary** + mirror sync (**A.9.4.2B**); additional branches → **`isPrimary=false`**. Does not copy primary contacts/hours unless provided in body.
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

## Stage BIZ.4 (Business Web profile / location canonicalization)

- **Status:** **BIZ.4 PASS** — Business Web no longer sends retired physical geo on **`PATCH /businesses/:id`** from the profile editor.
- **Write paths:** Profile save → brand fields on **Business**; primary branch **address / coordinates / locationSource** on **`PATCH …/locations/:primaryId`**. **`workHours`** remain **Business-level** PATCH (synced to primary BL per **A.3**). Secondary branches: **locations page** only (**A.4/A.5**).
- **Read paths:** Profile primary block loads from **primary BusinessLocation** list (`isPrimary`); **GET /businesses/:id** projection remains compatibility aggregate for display elsewhere.
- **Backend:** Legacy **`PATCH /businesses/:id`** physical keys may still be accepted for non–Business Web clients — **not removed in BIZ.4**.

## Stage 6.12A.9.3.5 (Business Web owner physical-context closure)

- **Status:** **PASS** — implementation **`9e00ef25…`** + physical browser QA finalized (dev fixture **`QA A935 OWNER PHYSICAL`**); not full Business Web production QA or full role matrix.
- **Profile (`/business/[id]`):** permission-safe **`PATCH /businesses/:id`** — managers submit only fields allowed by **`BUSINESS_PROFILE_EDIT`** / **`BUSINESS_HOURS_EDIT`** (separate profile vs hours save); OWNER unchanged.
- **Primary branch UX:** physical block labeled **primary branch** (RU/KK via `presentation.ts`); link to **`/business/[id]/locations`** for all branches.
- **Semantics unchanged:** profile remains **compatibility edit surface** for **primary** branch (backend **A.3** sync); secondary branches edited only on locations page (**A.4/A.5**); **set-primary** and cross-session consistency verified in browser.
- **Hours-only MANAGER:** profile/address/phone/title read-only; hours edit/save without forbidden profile payload (**audit P1 closed**).
- **Deferred:** branch DELETE UI; zero-primary repair UX; legacy physical column retirement (**A.9.4.1+** implementation — policy frozen in **A.9.4.0**).

## Stage 6.12A.9.4.0 (legacy physical retirement — policy & invariant gate)

- **Status:** **6.12A.9.4.0 PASS — RETIREMENT POLICY GATE FINALIZED** (docs-only; follows read-only **A.9.4** audit **PREREQUISITE HARDENING REQUIRED**).
- **Purpose:** freeze semantic decisions **before** any legacy **`Business`** physical-authority column retirement. **Not** a column-drop stage.

### A.9.4 boundary (what retires vs what stays)

**Retired from `Business` storage (A.9.4.4C4 — dev DB):** `address`, `latitude`, `longitude`, `location` (geography), `locationSource` — **no longer Business authority**; public projection is **BusinessLocation** only.

**A.9.4.5D2 (dev DB applied):** migration **`20260926180000_stage_6_12a9_4_5d_business_city_id_retirement`** applied on dev **`qalago_dev`** — **`Business.cityId`** column, FK, and status index physically removed. Pre-apply backup: `infra/local-backups/qalago_dev_native_pg18_pre_5d2_business_cityid_retirement_20260926T131630Z.dump` (uncommitted). **5D3** = integration regression on POST-5D DB.

**Completed cutovers before column drop:** monetization/analytics (**5B**), reporting/benchmark/moderation (**5C**), **CITY_ADMIN** primary-BL auth (**5A**).

**KEEP as legitimate Business domain / default fields:** `phone`, `whatsapp`, `website`, `instagram`, `workHours` — **BusinessLocation** may override per branch; Business retains brand/default/fallback semantics (**A.3** / **`buildEffectivePhysicalDto`**).

### City semantics (**A.9.4.5A FROZEN**; parent mirror retired in code **5D1**)

- **Physical presence:** business is in city **X** iff **∃ BusinessLocation** with `businessId` and `cityId = X`. **Never** infer presence from parent **`Business.cityId`** (column dropped in **5D2**).
- **Primary city presentation:** admin/aggregate **`city`** objects and audit stamps use **primary (or branch) BusinessLocation.city** — not a parent Business relation.
- **NOT:** immutable home city, brand origin, all-branch city, or public discovery authority.
- **Public API `cityId`:** effective/context **BusinessLocation** city for the response (**A.9.4.1B**).
- **Create/onboarding:** **Business shell** without parent city; **primary BusinessLocation** carries authoritative **`cityId`** atomically (**5D1**).

### Admin & CITY_ADMIN policies (**A.9.4.1A** + **A.9.4.5A IMPLEMENTED** — catalog-api)

**Staff catalog operations plane (AOP):** future Admin create/edit workflows — **`docs/architecture/admin-catalog-operations.md`** (AOP.0 contract lock). Do not weaken rules below.

**Dual model (do not unify):**

| Contour | Rule | Helpers |
|---------|------|---------|
| **Staff Admin** (list/search, moderation, claims filter, admin business visibility, branch visibility) | Visible iff **any** **BusinessLocation** in a managed city | `buildAdminBusinessScopeWhere`, `assertBusinessInAdminScope` |
| **Owner-equivalent Business Web** (`BusinessAccessService` for `CITY_ADMIN`) | Allowed iff **primary** **BusinessLocation.cityId** ∈ managed cities | `assertBusinessPrimaryLocationCityInAdminScope` — **not** `Business.cityId` as auth source |
| **Real OWNER / MANAGER** | **BusinessMembership** unchanged | `BusinessAccessService` membership paths |

- **Anti-escalation:** secondary-branch presence in city B **must not** grant whole-business owner-equivalent access to **CITY_ADMIN_B** while primary remains in city A.
- **Primary promotion:** owner-equivalent **CITY_ADMIN** scope follows **new primary** BL city; contact/default compatibility sync retained; **no** parent **`Business.cityId`** write (**5D1**).
- **`assertBusinessParentCityInAdminScope`:** **deprecated** — mirror string check only; no active owner-equivalent callers.
- **Applications:** approval scope remains **`application.cityId`** via **`assertCityInAdminScope`** (not BL visibility for approve gate).

### Reporting / benchmark / moderation (**A.9.4.5C IMPLEMENTED** — catalog-api)

- **Category benchmark peers:** market city membership = **BusinessLocation presence** in market city (not **`Business.cityId`**).
- **Owner analytics benchmark market:** **primary BL `cityId`** via **`resolveBusinessPrimaryCityId`** (dashboard builder).
- **Admin reporting scope:** **`businessCityWhere`** = ANY-BL presence; business-scoped explicit **`filters.cityId`** wins over parent mirror.
- **Moderation target city:** branch **`BusinessLocation.cityId`** when media is branch-scoped; else **primary BL**.
- **Audit stamps (plans, team, reviews, claims, profile):** **`resolveBusinessAuditCityId`** — explicit action city when provided, else **primary BL**; historical rows not backfilled.

**Action classification (explicit, no full RBAC redesign in 5A):**

- **Branch-scoped (natural BL context):** branch CRUD, set-primary, branch hours/contacts/address, branch media assignments, per-location admin read where keyed by **`businessLocationId`**.
- **Business-wide (aggregate):** business **status**, plan/global subscription, whole-business block/delete, brand/global catalog fields, business-wide ads/featured, **membership/staff** authority — Admin staff may act when **ANY-BL visibility** passes; **Business Web owner-equivalent** for **CITY_ADMIN** still requires **primary BL** city in scope.
- **Ambiguous routes:** prefer reporting over broadening permissions; document in stage audits if gate unclear.

- **A.9.4.1B (IMPLEMENTED — catalog-api):** campaign/order market city via **`resolveCampaignMarketCityId`**; new analytics events via **`resolveAnalyticsEventCityId`**; application dedupe against **`BusinessLocation`** in application city; public list/detail top-level **`cityId`** from effective physical branch context; admin reporting **`businessCityWhere`** = BL presence (not parent **`Business.cityId`** alone). Historical analytics rows not rewritten; admin analytics rollups remain business-grain visibility — not per-event **`AnalyticsEvent.cityId`** filters.
- **Address display:** prefer **BusinessLocation** — city-scoped context → effective branch in that city; explicit location → that row; business-global → **primary**; legacy **`Business.address`** only as temporary compatibility fallback until invariant migration completes.

### Monetization / campaign city (**A.9.4.1B** + **A.9.4.5B IMPLEMENTED** — catalog-api)

- **`AdCampaign.cityId`** remains **first-class** explicit campaign targeting context.
- **Resolution priority (`resolveCampaignMarketCityId`):** (1) **`targetBusinessLocationId` / `destinationBusinessLocationId`** → that BL’s **`cityId`**; (2) explicit quote/order **`cityId`** → validate business has a branch in that city; (3) **primary** **`BusinessLocation.cityId`**; **fail closed** if none — **`Business.cityId` is not a fallback (5B)**.
- **Order stability:** persisted **`metadata.campaignCityId`** (purchase-time resolution) wins on revalidation/provisioning over live primary BL — primary promotion must not retroactively change settled order market city.
- **Product purchase schedule preview:** primary BL city only (not **`Business.cityId`**).

### Analytics city (**A.9.4.1B** + **A.9.4.5B IMPLEMENTED** — catalog-api)

- **`AnalyticsEvent.cityId`** = **event context**, not Business parent identity.
- **New events (`resolveAnalyticsEventCityId`):** (1) explicit request/discovery city, (2) **`businessLocationId`** branch city, (3) campaign city, (4) primary BL city, (5) **null/omit** — **no** **`Business.cityId`** fallback (5B). Historical rows **not** rewritten. **A.8** **`businessLocationId`** / platform attribution unchanged.

### Application / onboarding

- Approval / create → **Business + initial PRIMARY BusinessLocation** atomically; application city/address/coords describe that primary location.
- **Must not** approve/create an **ACTIVE** business without an initial **BusinessLocation** (compatibility dual-write on Business columns may continue during transition). Long-term authority: **BusinessLocation**.

### Dedupe (**A.9.4.1B IMPLEMENTED** — catalog-api)

- Physical duplicate detection compares normalized application title + address against **`BusinessLocation`** rows in **`application.cityId`** (primary or secondary branch in that city). Same brand in another city without a matching branch → **not** duplicate via parent **`Business.cityId`** alone. Approval path unchanged (**Business + initial PRIMARY BL**).

### Location & primary invariants (target state)

| Invariant | Target | Notes |
|-----------|--------|--------|
| **≥1 location** | Every **Business** has **≥1** `BusinessLocation` | Zero-location = **invalid**; legacy read fallback to Business physical columns is **temporary** only |
| **Exactly one primary** | Every **Business** has **exactly one** `isPrimary=true` | DB enforces **at most one** today; **at least one** = service/repair/audit before mirror column drop — not unsafe cross-row CHECK in v1 |
| **Zero-primary reads** | Oldest-location fallback | **Temporary compatibility** until enforcement + repair complete |

Existing invalid rows must be **repaired** before enforcing; production writers must guarantee invariants before removing Business physical fallback.

### Integrity tooling (**A.9.4.2A IMPLEMENTED** — catalog-api)

- **CLI (default DRY_RUN, no writes):** from `services/catalog-api` — `npm run integrity:business-locations` or `node scripts/dev/business-location-integrity.mjs`; **`--audit-only`** concise CI gate (exit **1** when violations); **`--apply`** explicit repair only.
- **Repairs:** zero-primary → promote oldest `BusinessLocation` (`createdAt ASC`, `id ASC`) + **`syncBusinessFromPrimaryLocationRecord`**; zero-location → **`createInitialPrimary`** when `Business.cityId` + non-empty `address` (+ valid coordinate pair or both null); multi-primary → **MANUAL_REMEDIATION** (not auto-fixed in 2A).
- **Legacy auditor:** `node scripts/dev/audit-primary-integrity.mjs` (aggregate counts; **`pass`** now includes zero-location).
- **A.9.4.2B (IMPLEMENTED — catalog-api):** runtime enforcement on owner location API — first **POST** on zero-location Business creates **primary** + mirror sync; **DELETE** blocks last branch and primary (stable **409** codes); **set-primary** / create / delete serialized per Business via **`SELECT … FOR UPDATE`** on **Business**; corrupt zero-primary → **409** `BUSINESS_LOCATION_PRIMARY_INVARIANT_BROKEN` (repair via **2A** `--apply`).
- **A.9.4.2E (VERIFIED — physical QA):** Business Web + owner API — two-branch display, set-primary persistence (F5), **409** primary delete while secondary exists, **200** secondary delete, sole-branch delete → **409** `BUSINESS_LOCATION_LAST_DELETE_BLOCKED` (**LAST** precedence over **PRIMARY** when branch is both primary and last); integrity auditor green before/after.
- **A.9.4.2C:** **NOT REQUIRED** for closure (2A tooling + 2B enforcement + partial unique index + physical QA); DB triggers remain **optional / not approved**.
- **A.9.4.3A (IMPLEMENTED — catalog-api):** owner **`PATCH /businesses/:id`** — primary physical fields authoritative on **primary BusinessLocation**; **Business** mirror via **`syncBusinessFromPrimaryLocationRecord`**.
- **A.9.4.3B (IMPLEMENTED — catalog-api):** **application approval** + **Admin `POST /businesses`** — **`createBusinessWithInitialPrimary`**; physical snapshot → primary BL → mirror. **`createInitialPrimary(Business)`** remains **repair / intentional test fixture** only.
- **A.9.4.3C (IMPLEMENTED — catalog-api):** tracked **`prisma/seed.ts`** + **`scripts/stage-5n-qa-runtime.mjs`** use **`business-primary-location-aggregate.util`** — idempotent **`upsertSeedBusinessWithPrimaryMirrorInTx`** / **`createBusinessWithInitialPrimaryInTx`** (same BL → mirror semantics). Corrupt multi-primary seed fails with integrity-tooling guidance. **Not complete:** **3D** physical QA; read-fallback removal; column retirement.

### Cross-city business rule

- **Business** = brand identity; **city membership** = **`BusinessLocation` presence**, not **`Business.cityId` equality**.
- **Set-primary** across cities may update temporary **`Business.cityId`** home mirror; must **not** remove discovery/admin visibility in cities that still have other branches.

### Public API compatibility (during/after DB retirement)

- **No immediate removal** of top-level JSON fields used by shipped clients (`cityId`, `address`, lat/lng, contacts, hours, etc.).
- Fields may remain **derived** from context **`BusinessLocation`**, primary **`BusinessLocation`**, or Business default/fallback per **A.9.3** semantics — **no major-version breaking removal** in A.9.4 unless separately agreed.

### Public `cityId` projection rule (**A.9.4.1B IMPLEMENTED**)

- When **`contextLocationId`** present → top-level compatibility **`cityId`** = that branch’s **`cityId`** (with address/coords from same BL context).
- When explicit selected **`locationId`** on detail → **`cityId`** = selected branch.
- Business-grain response with no branch context → **`cityId`** = **primary** branch; no BL during transition → parent **`Business.cityId`** fallback only.

### Owner / Business Web transition (long-term)

- **A.9.3.5 CLOSED** — do not undo UX.
- Direction: physical edits eventually write **primary BusinessLocation** directly; stop using Business compatibility columns as write intermediate before DB removal; brand/default fields stay on Business.

### Import (6.12B requirement)

- New imported businesses: **≥1 BusinessLocation**; physical city/address/coordinates belong to **BusinessLocation** authority; dual-write may continue during compatibility; **must not** introduce Business-only physical records.

### Field retirement matrix (canonical)

| Field | Classification |
|-------|----------------|
| `Business.cityId` | KEEP TEMPORARILY — home/compatibility city; **active blockers** before retirement |
| `Business.address` | KEEP TEMPORARILY — primary compatibility mirror |
| `Business.latitude` / `longitude` | KEEP TEMPORARILY — primary compatibility mirror |
| `Business.location` | RETIRE with coordinate bundle after readers/writers move |
| `Business.locationSource` | KEEP TEMPORARILY — primary compatibility mirror |
| `Business.phone` / `whatsapp` | KEEP — domain/default |
| `Business.website` / `instagram` | KEEP — brand/default |
| `Business.workHours` | KEEP — default/fallback (current product semantics) |

### Proposed follow-up stages (**PROPOSED — NOT IMPLEMENTED**)

| ID | Scope |
|----|--------|
| **A.9.4.1** | Non-discovery city authority hardening — admin scope/display, monetization campaign city default, analytics fallback, dedupe direction, public **`cityId`** projection |
| **A.9.4.2** | Location/primary invariant hardening — ≥1 location, exactly one primary, repair/audit, create/delete/promote guarantees |
| **A.9.4.3A** | **IMPLEMENTED** — owner legacy PATCH physical authority inverted (BL → Business mirror) |
| **A.9.4.3B–C** | Onboarding/create/seed writer normalization (transitional **Business → BL** paths) |
| **A.9.4.3D** | Physical QA for full **A.9.4.3** closure |
| **A.9.4.3** (overall) | API/writer migration — derive compatibility DTO physical fields from BL; preserve client JSON |
| **A.9.4.4** | Legacy Business geo storage retirement — triggers/indexes, `location`, lat/lng, `locationSource`, `address` when blockers cleared |
| **A.9.4.5** | **`Business.cityId`** final retirement/derivation — only after admin, monetization, analytics, onboarding, dedupe, imports, API compatibility no longer require stored parent city |

### F.4 gate

- **F.4 does not depend** on physical DB column removal.
- **A.9.3.x** provides stable **`contextLocationId`**, **`locationId`**, **`effectivePhysical`**, branch-aware public reads.
- **Future Extensibility Architecture Gate (AGREED / DOCUMENTED):** public URL + **NavigationTarget** + showcase contracts — [future-extensibility-contracts.md](./future-extensibility-contracts.md). **F.4 — CLOSED / PASS**; **F.5 — CLOSED / PASS** (locale SEO URLs — [public-consumer-web.md](./public-consumer-web.md) § F.5); **F.6 Phase 0 — CONTRACT LOCKED** (deep links — [deep-links.md](./deep-links.md), **not implemented**).

## Stage 6.12A.9.3.4 (Consumer Web physical-context closure)

- **Discovery:** list/search/category cards preserve API **`contextLocationId`**; **`BusinessList`** links **`/businesses/{id}?locationId=`** when present (Business-grain card unchanged).
- **Detail:** reads optional **`locationId`** query; **`fetchBusiness(id, locationId)`**; React **`cache`** keyed by **`(id, locationId)`**; hero physical from **`effectivePhysical`** (fallback top-level); minimal branch links in **`BusinessBranchesSection`**.
- **SEO:** temporary **`/businesses/[id]`** stays **noindex**; branch query not indexable (**F.4** deferred).
- **QA-001:** physical-context mismatch (L2 card → L1 detail) **closed** (impl + **physical browser QA PASS**); full Business Pages still **F.4**.

## Stage 6.12A.9.3.3 (Flutter favorites physical-context closure)

- **Favorites:** **Business-grain** bookmarks only (`Favorite.businessId`); **no** branch id persisted. **`GET /favorites`** nested business physical fields = **primary/effective branch** projection (**A.9.3.1**).
- **Flutter navigation:** **`openBusinessFromFavorite`** opens detail **without** route **`locationId`** even if list JSON contained map/discovery branch fields — detail **`primary_default`** matches favorites card. **Not** “pass `contextLocationId` from favorites” (**QA-002 CLOSED / OBSOLETE**).
- **Discovery / map / promotions:** unchanged — **`contextLocationId`** or map **`locationId`** still passed where applicable (**A.7.9.5+**).

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
