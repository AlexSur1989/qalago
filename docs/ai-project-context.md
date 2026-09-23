# QalaGo — AI / developer current-state context

**Purpose:** concise handoff for ChatGPT/Cursor sessions. **History:** `docs/changelog.md`. **Rules:** `AGENTS.md`.

## Product

QalaGo — городской маркетплейс/гид (MVP city: Uralsk; multi-city via `cityId`/`citySlug`, not hardcoded city names in domain logic).

## Stack

- **Backend:** NestJS `services/catalog-api`, Prisma + PostgreSQL/PostGIS, REST **`/api/v1`**, local dev default **http://127.0.0.1:3002/api/v1**
- **Mobile:** Flutter `apps/mobile`
- **Web:** Next.js — `apps/business-web`, `apps/admin-web`, `apps/consumer-web`
- **Monorepo:** npm workspaces

## Shared catalog / data principle

**PostgreSQL + Catalog API** are the canonical source for catalog, business, category, and location data. **Flutter (Android/iOS) and Consumer Web consume the same backend** — do not maintain separate hardcoded production catalogs per channel. Taxonomy and business/location changes propagate via API consumption.

## Consumer Web stage

- **6.11F.3 PASS** — public SEO infrastructure (sitemap, robots, temporary business detail **noindex**, etc.).
- **F.4 deferred** — final public business/branch URL architecture until BusinessLocation sequence permits (after map cutover stages as planned).

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

**Next stage:** **6.12A.8.4** — Flutter branch-aware ad navigation.

## Ads / Analytics location (A.8)

- **Ownership:** **AdCampaign** remains **Business-grain** (`businessId` required).
- **Targeting (optional):** `targetBusinessLocationId` — serve eligibility narrowing (`null` = legacy city/category behavior).
- **Destination (optional):** `destinationBusinessLocationId` — configured tap branch; **serve** returns resolved `destinationLocationId` / `contextLocationId` (A.8.3).
- **Attribution (optional):** `AnalyticsEvent.businessLocationId` — **branch interaction context**, not user GPS; public organic ingestion **A.8.5**; ad events stay server-trusted later.
- **A.8.2 rules:** branch ids validated on order + provision; **BusinessLocation.cityId** must match **campaign.cityId** when branch set; **target** and **destination** independent but cannot differ when both set; promotion **PBA** enforced on destination; single selected branch in city may auto-fill destination at provision; branch delete clears nullable campaign refs when safe else **409** `BUSINESS_LOCATION_DELETE_BLOCKED`.
- **A.8.3 serving:** single engine for all placements; city authority = **BusinessLocation.cityId**; brand null/null → A.7.9.3A city-context branch when present; fail-closed stale campaigns.
- **Deferred:** ALL/APP/WEB campaign channel; WEB_MOBILE/WEB_DESKTOP analytics split; **A8-001** ad tap nav (**A.8.4**); **A8-002** server-side serve **closed**, client tap **A.8.4**.

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
| QA-001 | P2 | Consumer Web temp detail uses legacy **`business.address`** | F.4 |
| QA-002 | P2 | Flutter favorites open without **`contextLocationId`** | Flutter/discovery fix |
| QA-003 | P3 | BL rows with lat/lng but null geography (dev snapshot: 27) | A.9 / ops backfill |
| QA-004 | P3 | Single-primary enforced in app, not DB | A.9 |
| QA-005 | P2 | Promotions invalid-`locationId` doc vs primary-fallback | api-contracts |
| QA-006 | DEFERRED | Ads/analytics no **BusinessLocation** dimension | **A.8** |
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

## Context maintenance

- **`docs/changelog.md`** = historical timeline.
- **`docs/ai-project-context.md`** = **current-state** snapshot only.
- Update context when a **major stage** or **material architecture decision** completes; **trivial changes** do not need noisy edits.
- **Do not create duplicate** AI/project-context documents.
