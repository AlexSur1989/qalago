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
| 6.12A.7.1 | PASS (pending gate) | Backend `forMap` viewport → **BusinessLocation** grain + `locationId`; Flutter markers **A.7.2** |

## Business vs BusinessLocation

- **Business:** brand identity — membership, reviews, favorites, plans, ads, analytics (Business-scoped).
- **BusinessLocation:** physical branch — city, address, coords, hours, contacts; **Business 1:N BusinessLocation**.
- **Primary:** exactly one `isPrimary=true` per business; legacy **Business** physical columns mirror **primary** for public/discovery until later cutover.
- **Cross-city:** secondary branches may live in other cities; discovery still uses **primary** `Business.cityId` until a later stage.
- **Public read (A.6):** `GET /businesses/:id/locations/public` (ACTIVE only, guest-safe).
- **Management (A.4):** authenticated CRUD + `set-primary`; **no DELETE** yet.

## Frozen / deferred

- **Map backend (A.7.1):** `forMap`+bbox uses **`BusinessLocation.location`** + **`locationId`**; nearest/radius/list discovery still **Business-grain**.
- **Map client (A.7.2):** GeoJSON/marker identity still **businessId** until Flutter cutover.
- **Public discovery:** city/category/search unchanged (primary business city) except map viewport city filter uses branch city.
- **F.4 / F.5:** final business URLs, branch slugs, hreflang, branch JSON-LD — not A.6.
- **Branch-level membership, location favorites, branch reviews:** deferred.

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
