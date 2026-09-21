# QalaGo — AI / developer current-state context

**Purpose:** concise handoff for ChatGPT/Cursor sessions. **History:** `docs/changelog.md`. **Rules:** `AGENTS.md`.

## Product

QalaGo — городской маркетплейс/гид (MVP city: Uralsk; multi-city via `cityId`/`citySlug`, not hardcoded city names in domain logic).

## Stack

- **Backend:** NestJS `services/catalog-api`, Prisma + PostgreSQL/PostGIS, REST prefix `/api/v1/`
- **Web:** Next.js — `apps/business-web`, `apps/admin-web`, `apps/consumer-web`
- **Mobile:** Flutter `apps/mobile` (deferred per stage)
- **Monorepo:** npm workspaces; local API default **http://127.0.0.1:3002/api/v1**

## Stage checkpoints (BusinessLocation track)

| Stage | Status | Notes |
|-------|--------|--------|
| 6.12A.4 | PASS | Management API; checkpoint `d5958ba5…` |
| 6.12A.5 | PASS | checkpoint `d8904a7…` — Owner Business Web + Admin read-only |
| **Next after A.5** | **6.12A.6** | Flutter location consumption (not started in A.5) |

## Business vs BusinessLocation

- **Business:** brand, membership, reviews, favorites, plans, ads, analytics.
- **BusinessLocation:** physical branch (city, address, coords, hours, contacts); **1:N** under Business.
- **Primary:** one `isPrimary=true` per business; legacy **Business** physical columns stay public/discovery authority until map/discovery cutover; A.3+ keeps primary row in sync on writes.
- **Management API (A.4):** `/businesses/:businessId/locations` CRUD + `set-primary`; **no DELETE** yet.

## Frozen / deferred (do not scope-creep)

- **Map / PostGIS public queries:** still **`Business.location`** (A.7 cutover).
- **Public discovery / consumer-web branches:** not A.5 (F.4 blocked until sequence allows).
- **Flutter:** A.6+.
- **Branch-level membership / DELETE archive:** deferred.

## Advertising (future architecture only)

One shared advertising backend for Android, iOS, and public Consumer Web; channel/surface targeting (e.g. APP vs WEB) and optional branch-level campaign targets later — **not implemented** in location UX stages unless explicitly staged.

## Workflow discipline

1. Task → plan → contract (if API changes) → code → tests → docs → **changelog in same commit as code**.
2. **Git safety:** no `reset --hard`, `clean`, `stash`, mass restore; do not stage protected local dirt (mobile generated Firebase/plugin files, local DB dumps, `.next` caches).
3. **Prisma on Windows:** stop `catalog-api` dev processes before `prisma generate` if EPERM on `query_engine-windows.dll.node`.

## Context maintenance

When a **major stage completes** or **architecture materially changes**, update **this file** (current snapshot) and **`docs/architecture/*`** as needed. Do not duplicate full changelog entries here.
