# QalaGo — AI / developer current-state context

**Purpose:** concise handoff for ChatGPT/Cursor sessions. **History:** `docs/changelog.md`. **Rules:** `AGENTS.md`.

**Mandatory read before work:** `AGENTS.md` → this file → relevant `docs/architecture/*` → recent `docs/changelog.md` → `git rev-parse HEAD` + `git status`.

## Current stage (handoff snapshot)

| Field | Value |
|-------|--------|
| **Repo HEAD (current)** | _(see `git rev-parse HEAD`)_ — **A.9.4.3C** implementation |
| **A.9.4.3C implementation SHA** | _(see changelog)_ |
| **A.9.4.3B implementation SHA** | `cde02e6d0faee3b5b6831ba479d6f4dcdff14b17` |
| **A.9.4.3A implementation SHA** | `51e0b5bb502930ff43adf0e7f875b95137a12ae4` |
| **A.9.4.2B implementation SHA** | `07e0a8cdc41c72f53821e57ed892337f5d886f05` |
| **A.9.4.2A implementation SHA** | `7909260e0b9c1a99fdb2fb0455d1e5a532d5c8bd` |
| **Last completed stage** | **6.12A.9.4.3C PASS** — seed/dev writers normalized (**3D** physical QA open) |
| **Last product implementation** | **6.12A.9.4.3C** — seed + **5N QA** aggregate physical writes |
| **Prior** | **6.12A.9.4.2 PASS** (invariants + **2E** physical QA); **6.12A.9.4.1** city context |
| **A.9.4.2C** | **NOT REQUIRED** (2A/2B + physical QA sufficient; no new gap) |
| **Physical QA pending** | **A.9.4.3D** (after **3B/3C**); none for **A.9.4.2** |
| **Next agreed development action** | **6.12A.9.4.3D** physical QA (not auto-started) |

**Distinction:** **Implemented** = merged code/docs checkpoint. **Verified audit** = read-only evidence only until implementation commit.

**Protected local dirt (do not stage/restore/clean):** mobile branding/login/logo, generated Flutter registrants, `services/catalog-api/src/main.ts`, notification seed script, untracked `infra/local-backups/`, local dev audit scripts — use `git status` as authority.

## Product

QalaGo — городской маркетплейс/гид (MVP city: Uralsk; multi-city via `cityId`/`citySlug`, not hardcoded city names in domain logic).

## Stack

- **Backend:** NestJS `services/catalog-api`, Prisma + PostgreSQL/PostGIS, REST **`/api/v1`**, local dev default **http://127.0.0.1:3002/api/v1**
- **Mobile:** Flutter `apps/mobile`
- **Web:** Next.js — `apps/business-web`, `apps/admin-web`, `apps/consumer-web`
- **Monorepo:** npm workspaces

## Shared catalog / data principle

**PostgreSQL + Catalog API** are the canonical source for catalog, business, category, and location data. **Flutter (Android/iOS) and Consumer Web consume the same backend** — do not maintain separate hardcoded production catalogs per channel. Taxonomy and business/location changes propagate via API consumption.

## Public business visibility (MAP-SEC.C1)

- **Public catalog/discovery/map** (`GET /businesses`, `@Public`) exposes **ACTIVE** businesses only.
- Clients **cannot** widen visibility with **`?status=PENDING`** or **`?status=BLOCKED`** (→ **400**). Omit **`status`** or use **`status=ACTIVE`**.
- **Administrative** status filtering remains on protected **`GET /admin/businesses`** (staff auth).

## Map user location (MAP-LOCATION.2 CLOSED / PHYSICAL PASS)

- **Pipeline:** Geolocator → passive **last-known / bounded current bootstrap** → continuous stream → **`userLocationProvider`** → **MapScreen** → **`QalaGoMapView.userLocation`** → native MapLibre GeoJSON **`qalago-user-location`** + **CircleLayer** (not **`myLocationEnabled`**).
- **Physical Samsung SM-J610FN (Android 10):** automatic initial dot; pan/zoom/fast-pan geographic attachment; map tab re-entry replay — **PASS** (debug APK **`QALAGO_DEV_HOST=172.158.10.133`**, native business layer on). Details: `docs/changelog.md` MAP-LOCATION.2 physical QA entry.
- **flutter_map fallback:** user location remains Flutter overlay markers.
- **Still open (not MAP-LOCATION):** duplicate native **`qalago-business-*`** layer add errors (**C3** track).

## Map viewport fetch hysteresis (MAP-PERF.C2 CLOSED / PHYSICAL PASS)

- **Invariant:** visible viewport **⊆** fetched padded coverage (**`lastFetchBounds`**, **12%** pad) → **suppress** fetch; viewport **exits** coverage → **fetch** new padded coverage. Error / cancel / stale / incomplete wave (**30-page** cap without API total exhausted) → **must not** establish valid coverage.
- **Physical Samsung SM-J610FN:** small pan inside coverage → **`fetchNeeded=false`** / **`fetchSkipped`**; larger pan outside → **`fetchNeeded=true`** / successful refetch — **PASS**. Details: `docs/changelog.md` MAP-PERF.C2 physical QA entry. Implementation: **`3c86164ffcd9eafdf42536642de08635c30490ed`**.
- **MAP-PERF.C3 CLOSED** — native MapLibre business layer + **Android release path finalized**. **C3.1–C3.5R** PASS (Samsung release-mode smoke **C3.5R**; **C3.4** debug; **C3.3** synthetic **100–3000** only — not physical 3000 on device). **Code default:** `QALAGO_NATIVE_MAP_BUSINESS_LAYER=false`. **Android store/release:** pass `QALAGO_NATIVE_MAP_BUSINESS_LAYER=true` + production API URL in docs (`https://api.qalago.kz/api/v1`). **iOS:** native business **not** enabled until dedicated physical QA. **No** native→overlay runtime fallback (debt). **Separate infra:** `api.qalago.kz` DNS/API not deployed/resolvable at C3.5R observation — not a C3 defect. Details: `docs/changelog.md` MAP-PERF.C3 CLOSED entry.

## Consumer Web stage

- **6.11F.3 PASS** — public SEO infrastructure (sitemap, robots, temporary business detail **noindex**, etc.).
- **6.12A.9.3.4 PASS (physical QA finalized)** — Consumer Web discovery/detail physical context; **QA-001 CLOSED**.
- **6.12A.9.3.5 PASS (physical QA finalized)** — Business Web permission-safe profile PATCH; primary-branch UX; hours-only MANAGER scope verified; closes **`A.9.3.4+`** owner slice; central audit **P1 CLOSED**.
- **6.12A.9.4.0 PASS (policy gate)** — legacy physical retirement policies & invariants frozen; **`docs/architecture/business-location.md`** § **9.4.0**; **F.4** not blocked on column drop.
- **F.4 deferred** — final public business/branch URL architecture until explicitly staged (not A.9.3.4).

## BusinessLocation track

| Stage | Status | Notes |
|-------|--------|--------|
| 6.12A.5 | PASS | Owner Business Web + Admin read-only branches |
| 6.12A.6 | PASS | checkpoint `fc13f679…` — public read + Flutter/Consumer client awareness |
| 6.12A.7.1 | PASS | checkpoint `0d8a772…` — backend `forMap` viewport → **BusinessLocation** grain + `locationId` |
| 6.12A.7.2 | PASS | Flutter map **physical key** = `locationId`; detail/reviews/favorites stay **Business.id** |
| 6.12A.7.4 | FINALIZED | multi-branch map physical QA; public locations Hotfix 2 |
| 6.12A.7.6 | CLOSED (physical QA PASS) | **`GET /businesses/:id?locationId=`** + **`effectivePhysical`** backend source of truth for detail physical UI |
| **6.12A.7.7** | **CLOSED** | **Branch media architecture finalized** — A.7.7.1–7.7.6 complete; closure audit PASS |
| 6.12A.7.7.1 | CLOSED | **`BusinessImage.locationId`** nullable; same-business DB integrity |
| 6.12A.7.7.2 | CLOSED | Owner management + public **`moderationHidden`** filter |
| 6.12A.7.7.3 | CLOSED | **`effectiveMedia`** + scoped **`/photos?locationId=`** |
| 6.12A.7.7.4 | CLOSED | **Business Web** shared/branch media UX |
| 6.12A.7.7.5 | CLOSED (physical QA PASS) | **Flutter** + Hotfix 1; Samsung SM-J610FN L1/L2 verified |
| 6.12A.7.7.6 | CLOSED | **Admin** **`MEDIA`** **`mediaTarget`** scope visibility |
| 6.12A.7.8.0 | PASS | Read-only audit — M2M branch availability for ServiceItem/Promotion; ServiceMenuGroup business-wide |
| 6.12A.7.8.1 | PASS (data foundation) | **`ServiceItemBranchAvailability`** + **`PromotionBranchAvailability`**; composite same-business FKs |
| 6.12A.7.8.2 | **PASS (management API)** | Owner **`branchAvailability`** on ServiceItem/Promotion CRUD; location **DELETE** conflict mapping; **no public filtering** |
| 6.12A.7.8.3 | **PASS (public contract)** | Detail **`effectiveCatalog`** / **`effectivePromotions`**; **`/catalog?locationId=`**; legacy previews unchanged |
| 6.12A.7.8.4 | **PASS (Business Web UX)** | Owner menu + promotions **ALL/SELECTED** branch controls; **`listManageServiceItems`** for edit assignments |
| 6.12A.7.8.5 | **CLOSED (physical QA PASS)** | Flutter branch-effective catalog/promotions; Samsung SM-J610FN L1/L2 verified; QA785 fixture cleaned (dev) |
| 6.12A.7.8.6 | **PASS (Admin read-only)** | **`GET /admin/businesses/:businessId/content`** — **`BUSINESS_VIEW`**, ALL/SELECTED branch scope labels; no branch editing |
| **6.12A.7.8** | **CLOSED** | Branch catalog/promotions architecture finalized (A.7.8.0–A.7.8.6); discovery/global promotions branch grain → **A.7.9** |
| 6.12A.7.9.1 | **PASS (contract foundation)** | Discovery **`contextLocationId`** additive; **map keeps `locationId`**; detail **`activeLocationId`** |
| 6.12A.7.9.2 | **PASS (nearby)** | Nearest/radius on **`BusinessLocation.location`**; one card per Business; geo **`contextLocationId`** + **`distanceMeters`** |
| 6.12A.7.9.3A | **PASS (city membership)** | Discovery city = branch **`cityId`** presence; non-geo **`contextLocationId`**; **`Business.cityId`** not physical presence |
| 6.12A.7.9.3B | **PASS (branch-aware search)** | Search stays **Business-grain**; branch **address** + **SIBA** honesty; search **`contextLocationId`** precedence (geo **>** SELECTED item **>** address **>** city) |
| 6.12A.7.9.4 | **PASS (promotion city feed)** | **`GET /promotions`** **ALL/SELECTED PBA** + city **`contextLocationId`**; Promotion-grain |
| 6.12A.7.9.5 | **PASS (Flutter automated)** | Discovery cards → detail **`locationId`** from backend **`contextLocationId`**; map keeps marker **`locationId`**; favorites/reviews **Business.id** |
| **6.12A.7.9.6** | **CLOSED (physical QA PASS)** | Samsung SM-J610FN: discovery **Business-grain** + map **BusinessLocation-grain**; detail branch switch; branch-aware **catalog/promotions** full lists; fixture cleaned (dev); impl checkpoints `4a24b43` / `d7b25ea` |
| **6.12A.7.QA** | **CLOSED (audit PASS)** | Final read-only BusinessLocation E2E architecture audit — **READY FOR A.8**; no P0/P1; findings **QA-001..QA-008** backlog only |
| **6.12A.8.0** | **CLOSED (audit PASS)** | Read-only ads/analytics location hooks audit — implementation plan ready |
| **6.12A.8.1** | **PASS (foundation)** | Nullable schema + API contract hooks: campaign **target** / **destination** branch FKs; `AnalyticsEvent.businessLocationId`; serve DTO fields present but **null** until A.8.3; no serving/nav/client analytics yet |
| **6.12A.8.2** | **PASS (validation)** | Server validates campaign branch target/destination (ownership, city, PBA, target≠destination); order/provision metadata path; branch delete clears safe campaign refs or conflicts |
| **6.12A.8.3** | **PASS (serving)** | Ad serve engine resolves branch destination + branch-effective business card; target filters eligibility; promotion **PBA** enforced at serve; rotation pre-filters invalid campaigns |
| **6.12A.8.4** | **CLOSED (physical QA PASS)** | Branch-aware ad taps on Samsung SM-J610FN; HOME_FEATURED / CATEGORY_TOP / HOME_PROMOTIONS / VIP BUSINESS / VIP PROMOTION + L2→L1 back stack; impl `a7806bb` + hotfix `f1d03c8` |
| **6.12A.8.4.PHYSICAL** | **CLOSED** | Fixture cleanup + dev baseline restored; changelog closure docs-only after QA |
| **6.12A.8.5** | **PASS (attribution)** | `AnalyticsEvent.businessLocationId` = interaction branch; organic server-validated; ad server-derived; historical null preserved |
| **6.12A.8.6** | **PASS (platform)** | Ad + serve record optional `AnalyticsEvent.platform` when client sends enum; organic/ads share Flutter helper; historical ad platform stays null |
| **6.12A.8** | **CLOSED / FINALIZED** | **6.12A.8.FINAL** audit PASS; branch-aware campaign/serve/nav/analytics + ad platform hooks complete; **A.8.7 not required**; impl checkpoint **A.8.6** `ae20e92…` |

**6.12A.9.3.1 PASS** — public API **read normalization**: top-level Business physical fields on list/detail/favorites are **compatibility projections** from effective **BusinessLocation** (primary or `contextLocationId`); legacy columns remain; **`forMap=true`** still branch-grain; favorites stay **Business-grain** (primary physical only).

**6.12A.9.3.2 PASS** — discovery SQL: **BL-authoritative** address search + bbox; legacy bbox without **`forMap`** = **Business-grain** + in-bbox **`contextLocationId`**; promotions nested business physical aligned to branch context.

**6.12A.9.3.2b PASS (implementation)** — no active **`GET /businesses`** physical geo on **`Business.latitude/longitude`**; bbox → BL PostGIS; **`forMap` without bbox** → BL map-ready guard in city; nearest/radius unchanged (BL PostGIS). Checkpoints: **A.9.3.1** `f4154d9a…`, **A.9.3.2** `f2bbc9c8…`, **A.9.3.2b** `c53af3c2…`.

**6.12A.9.3.3 PASS (Flutter closure)** — **`openBusinessFromFavorite`**; **QA-002 CLOSED / OBSOLETE**.

**6.12A.9.3.4 PASS (Consumer Web closure)** — **`contextLocationId` → detail `?locationId=`**; physical browser QA PASS; **QA-001 CLOSED**.

**6.12A.9.3.5 PASS (Business Web owner closure)** — permission-split profile/hours PATCH; primary-branch labeling + locations link; physical browser QA PASS; fixture **`QA A935 OWNER PHYSICAL`** cleaned (dev); impl **`9e00ef25…`**; backend sync unchanged (**A.3/A.4/A.5**).

### Flutter detail navigation (canonical)

- **File:** `apps/mobile/lib/shared/navigation/open_business.dart`
- Discovery: **`contextLocationId` → `locationId` query**
- Map: row **`locationId` → `locationId` query**
- Promotions: **`promotion.contextLocationId`** (ALL / null → primary)
- Favorites: **`openBusinessFromFavorite`** — omit `locationId` (not branch bookmarks)
- Notifications / profile review links: business-level route → primary (**by design**)

## Ads / Analytics location (A.8) — CLOSED

**Stage 6.12A.8 is finalized.** Location and platform hooks for ads/analytics are in production architecture; no further A.8 substage unless a new product stage explicitly scopes follow-on work.

- **Ownership:** **AdCampaign** remains **Business-grain** (`businessId` required).
- **Targeting (optional):** `targetBusinessLocationId` — serve eligibility narrowing (`null` = legacy city/category behavior).
- **Destination (optional):** `destinationBusinessLocationId` — configured tap branch; **serve** returns resolved `destinationLocationId` / `contextLocationId` (A.8.3).
- **Attribution (A.8.5):** `AnalyticsEvent.businessLocationId` — **branch interaction context**, not user GPS; organic DTO validated same-business; **`AD_SERVED`** = serve-time resolved destination; client **`AD_*`** = explicit campaign destination only when set.
- **Platform (A.8.6):** `AnalyticsEvent.platform` — optional client runtime (`IOS`/`ANDROID`/`WEB`/`UNKNOWN`); Flutter canonical helper; serve query + ad event body; omitted legacy → **null**; independent of branch attribution.
- **A.8.2 rules:** branch ids validated on order + provision; **BusinessLocation.cityId** must match **campaign.cityId** when branch set; **target** and **destination** independent but cannot differ when both set; promotion **PBA** enforced on destination; single selected branch in city may auto-fill destination at provision; branch delete clears nullable campaign refs when safe else **409** `BUSINESS_LOCATION_DELETE_BLOCKED`.
- **A.8.3 serving:** single engine for all placements; city authority = **BusinessLocation.cityId**; brand null/null → A.7.9.3A city-context branch when present; fail-closed stale campaigns.
- **A.8.4 Flutter:** `resolvedDestinationLocationId` → business detail `locationId`; promotion-rich ads use `promotion.contextLocationId`; **VIP PROMOTION** may be creative-target-only (no `promotion` payload) — client opens **Business** detail with backend-resolved destination/context branch; VIP external URL unchanged.
- **Deferred (post–A.8):** Consumer Web ads/analytics producers; campaign channel **ALL | APP | WEB**; **WEB_MOBILE/WEB_DESKTOP**; branch/platform analytics dashboards; creative-level analytics; serve-session bridge for runtime-only client **AD_*** branch; **A85-004** VIEW_BUSINESS branch-switch dedupe semantics.
- **Test debt:** **A8F-001** — A.8.1 runtime spec expects zero historical `businessLocationId`; stale after A.8.5 (FINAL audit focused regression **73/74**; not a product blocker). Last full Flutter **955/955** at A.8.6 closure.

## Business vs BusinessLocation

- **Business:** brand identity — membership, reviews, favorites, plans, ads, analytics; **ServiceItem** / **Promotion** are business entities with optional per-branch availability (reviews/favorites/analytics remain **Business.id**-scoped).
- **BusinessLocation:** physical branch identity — city, address, coords, hours, contacts; **Business 1:N BusinessLocation**.
- **Business detail (A.7.6–A.7.9.6 CLOSED):** optional **`locationId`** selects active branch; **`effectivePhysical`** / **`effectiveMedia`** / **`effectiveCatalog`** / **`effectivePromotions`**; consumer **`/business/:id/catalog|promotions?locationId=`**; in-detail **«Филиалы»** switch via **`context.replace`**. Reviews/favorites/analytics stay **`Business.id`**. Branch-specific media physical QA = **A.7.7**, not re-tested in **A.7.9.6**.
- **Discovery grain (A.7.9 CLOSED via A.7.9.6):** list/search/category/nearby/promotions feed = **Business-grain** card + backend **`contextLocationId`**; **map** = **BusinessLocation-grain** (**`locationId`** per marker).
- **Primary:** default active context when `locationId` omitted; **`isPrimary` badge ≠ forced active** when user/map selects another branch.
- **Primary sync:** legacy **Business** physical columns mirror **primary** for backward compatibility; branch assignments in **A.7.8.2**; **public branch-effective** catalog/promotions in **A.7.8.3** (`effectiveCatalog` / `effectivePromotions` + `/catalog?locationId=`); legacy **`catalogPreview`** / **`promotionsPreview`** stay business-wide; **A.7.9** defers city/search/map feed grain; branch reviews deferred.
- **Branch catalog/promotion invariants (A.7.8 CLOSED):** **ServiceMenuGroup** = business-wide. **ServiceItem** / **Promotion:** **0** assignment rows = all branches; **≥1** = only assigned **`BusinessLocation`** ids. Owner edits via **Business Web** (**ALL/SELECTED**); **Admin** read-only content inspection (no branch editing). Public/Flutter use **`effectiveCatalog`** / **`effectivePromotions`**; legacy **`catalogPreview`** / **`promotionsPreview`** + city **`GET /promotions`** remain business-grain until **A.7.9**. Assignments = availability only. **BusinessLocation** delete **RESTRICT** while assignments exist.
- **Branch media invariants (A.7.7 CLOSED):** shared = **`BusinessImage.locationId` null**; branch = **`locationId` = `BusinessLocation.id`** (same business); public branch view = **active branch media + shared brand** (never sibling branches); **`effectiveMedia`** is branch-aware public truth; legacy **`galleryPreview`** on detail is **compatibility-only** (not branch truth); **`Business.coverImageUrl`** remains **brand-level**; owner **Business Web** + consumer **Flutter** + **Admin MEDIA** moderation aligned; plan quota Business-wide; **`moderationHidden`** never on public surfaces.
- **Branch media deferred / debt:** legacy business-wide **`galleryPreview`**; full Admin gallery manager; Admin upload/reorder; owner Flutter branch upload; Consumer Web branch media (**F.4**); orphan file GC; reorder API/UX; explicit branch cover column; branch-level moderation status; CDN migration.
- **Cross-city:** secondary branches may live in other cities; **A.7.9.3A** discovery uses **branch city presence** + **`contextLocationId`** for the branch in the requested city (not parent **`Business.cityId`** alone).
- **Public read (A.6):** `GET /businesses/:id/locations/public` (ACTIVE only, guest-safe).
- **Management (A.4):** authenticated CRUD + `set-primary`; **DELETE** non-primary branch (409 when FK references remain, e.g. catalog/promotion assignments).

## Frozen / deferred

- **Map (A.7.1–A.7.4):** backend **BusinessLocation** grain + **`locationId`**; Flutter map layer uses **physical key**; category map renders **`mapLayerItems`** (fetch bounds); detail accepts optional **`locationId`** for branch address/route; reviews/favorites/analytics remain **Business.id**.
- **Nearest/radius/list discovery:** **Business-grain** card; branch context via **`contextLocationId`** (A.7.9.2+).
- **Public discovery:** Backend **A.7.9.3A–3B/4** + Flutter **A.7.9.5** passes **`contextLocationId`** into detail **`locationId`**. Map unchanged (**marker `locationId`**). **A.7.9.6 CLOSED** (physical QA PASS). **A.7 BusinessLocation architecture complete** (A.7.QA audit PASS).
- **F.4 / F.5:** final business URLs, branch slugs, hreflang, branch JSON-LD — not A.6.
- **Branch-level membership, location favorites, branch reviews:** deferred.

## A.7.QA outstanding debt (not implemented)

| ID | Severity | Summary | Target |
|----|----------|---------|--------|
| QA-001 | **CLOSED (A.9.3.4 physical QA PASS)** | L2 discovery → detail context preserved via **`locationId`** + **`effectivePhysical`**; back/reopen without stale primary; temp detail still **noindex** — full pages **F.4** | — |
| QA-002 | **CLOSED / OBSOLETE** (A.9.3.3) | Favorites are **Business-grain**; **`openBusinessFromFavorite`** omits route **`locationId`**; **A.9.3.1** primary projection + detail **`primary_default`** | — |
| QA-003 | P3 | BL rows with lat/lng but null geography (dev snapshot: 27) | A.9 / ops backfill |
| QA-004 | P3 | Single-primary enforced in app, not DB | A.9 |
| QA-005 | P2 | Promotions invalid-`locationId` doc vs primary-fallback | api-contracts |
| QA-006 | CLOSED (A.8) | Branch dimension in ads/analytics — **6.12A.8 CLOSED** | — |
| QA-007 | DEFERRED | Admin no full branch CRUD | Admin backlog |
| QA-008 | DEFERRED | Legacy **Business** physical columns as fallback | A.9 |

## Advertising (future architecture — not implemented in location stages)

QalaGo must ultimately use **one shared advertising backend** across **Android, iOS, and public Consumer Web**.

Existing products include: **HOME_VIP_BANNER**, **CATEGORY_TOP**, **CATEGORY_BOOST**, **HOME_FEATURED**, **HOME_PROMOTIONS**.

Future targeting should support channel/surface concepts such as **ALL**, **APP**, **WEB**, and analytics breakdown such as **APP_ANDROID**, **APP_IOS**, **WEB_MOBILE**, **WEB_DESKTOP**, while keeping aggregate campaign analytics. **BusinessLocation** may later be a campaign target/destination for branch-specific ads.

## Home composition (future Admin/CMS — not A.6/A.7)

Future architecture should allow **backend/admin-central configuration** of consumer Home: **section order**, **enabled/disabled** sections, and appropriate **section content/config**. **Android, iOS, and Consumer Web** consume the **same** backend Home configuration while keeping **platform-specific responsive presentation**. Reordering or toggling Home sections should eventually **not require a new APK** solely for layout changes. **Not implemented** in BusinessLocation stages unless explicitly staged later.

## Workflow discipline

1. **Task → implementation → final report → audit → next stage** (do not skip audit gate).
2. Plan → contract (if API changes) → code → tests → docs → **changelog in same commit as code** when possible.
3. **Git safety:** no `reset --hard`, `clean`, `stash`, mass restore; do not stage protected local dirt (mobile generated registrants, local DB dumps, `.next` caches).
4. **Prisma on Windows:** stop `catalog-api` dev processes before `prisma generate` if EPERM on `query_engine-windows.dll.node`.

## A.9 deferred (naming from changelog/roadmap)

- **P2:** `mergeSearchResultPages` dedupes by **`Business.id`** only (valid while discovery is Business-grain).
- **A.9.3.4+ owner slice** — **closed in A.9.3.5** (Business Web); Consumer Web closed in **A.9.3.4**.
- **A.9.4.0** — retirement **policy gate finalized** (docs).
- **A.9.4.1A** — Admin BL-presence visibility + **`assertBusinessParentCityInAdminScope`** owner-route guard **IMPLEMENTED** (catalog-api).
- **A.9.4.1B** — campaign city, analytics attribution, BL dedupe, public **`cityId`** projection **IMPLEMENTED** (catalog-api).
- **A.9.4.2A** — integrity auditor + repair CLI **IMPLEMENTED** (catalog-api).
- **A.9.4.2B** — runtime location invariant enforcement **IMPLEMENTED** (catalog-api).
- **A.9.4.2E** — owner branch physical QA **VERIFIED** (Business Web + API; fixture cleanup restored baseline).
- **A.9.4.2 overall** — **PASS** (invariants finalized); **2C** DB trigger **NOT REQUIRED**.
- **A.9.4.3–A.9.4.5** — writer migration, column retirement **NOT IMPLEMENTED** (**2C+** optional trigger not approved).
- **F.4** — Consumer Web business/branch URLs & SEO; **does not require** A.9.4 DB column removal (**A.9.4.0** gate); not started.
- Post **6.12A:** User contour audit, Business Web owner contour, Admin Web contour, Admin Catalog/CMS, centralized Home config, Catalog Import, QalaGo AI, remaining Consumer Web, production monetization, analytics UX, role-based E2E, security/legal/release — **not** current track unless explicitly staged.

## Context maintenance

- **`docs/changelog.md`** = historical timeline (**Implemented** / **Verified** checkpoints).
- **`docs/ai-project-context.md`** = **current-state** snapshot only (**Agreed** next, audited-vs-implemented).
- **`AGENTS.md`** = mandatory START/FINISH protocol; **no** parallel memory files.
- Update after **major stage**, **audit gate**, or **material architecture decision**; trivial edits skip noisy updates.
- **Do not create duplicate** AI/project-context documents.

## Files to attach in a new ChatGPT/Cursor chat

1. `AGENTS.md`
2. `docs/ai-project-context.md`
3. `docs/changelog.md` (top ~60 lines minimum)
4. As needed: `docs/architecture/business-location.md`, `docs/architecture/catalog-geo-query.md`, `docs/architecture/api-contracts.md`
