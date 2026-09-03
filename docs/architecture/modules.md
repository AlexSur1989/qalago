# Modules — QalaGo

## Apps

| Module | Path | Status | Responsibility |
|--------|------|--------|----------------|
| Mobile | `apps/mobile` | MVP implemented | Users, map, catalog, favorites, owner/admin MVP screens |
| Admin Web | `apps/admin-web` | MVP implemented | Platform/city moderation, businesses, users |
| Business Web | `apps/business-web` | MVP implemented | Owner profile, promotions, stats (web) |

## Services

| Module | Path | Status | Responsibility |
|--------|------|--------|----------------|
| Catalog API | `services/catalog-api` | MVP implemented | REST API, auth, catalog, engagement, admin API, analytics ingest |
| AI Orchestrator | `services/ai-orchestrator` | not started | Agent routing, tool execution, audit |
| Notifications | `services/notifications` | future | Push, SMS |
| Analytics Worker | `services/analytics-worker` | future | Event aggregation |

## Packages

| Module | Path | Status | Responsibility |
|--------|------|--------|----------------|
| shared-types | `packages/shared-types` | ready | DTOs, enums, Zod schemas |
| api-client | `packages/api-client` | not started | Typed HTTP (TS; Dart codegen optional) |
| geo-core | `packages/geo-core` | future | Distance, bounds, district helpers |
| ai-core | `packages/ai-core` | not started | LLM adapters, prompt utils |
| agents | `packages/agents` | not started | Agent specs + policies |

## Catalog API — domain modules

| Module | Entities | Notes |
|--------|----------|-------|
| auth | User, OtpCode | Phone OTP, JWT |
| cities | City | Multi-city root |
| users | User profile | Me, admin user mgmt |
| categories | Category | Global + city display order |
| businesses | Business, BusinessImage | Core catalog |
| service-items | ServiceItem | Menu/services |
| promotions | Promotion | Discounts, date range |
| favorites | Favorite | User ↔ business |
| reviews | Review | Ratings, owner reply |
| notifications | Notification | In-app inbox |
| analytics | AnalyticsEvent | Views, clicks |
| uploads | — | Images → local/S3 |
| admin | — | Moderation, featured |

## Dependency graph (catalog-api)

```text
auth ──► users
cities ──► businesses ──► service-items
                      ├── promotions
                      ├── reviews
                      ├── favorites
                      └── analytics
admin ──► businesses, users, categories, promotions
uploads ──► businesses (images)
```

## Mobile feature map

| Feature | Depends on API |
|---------|----------------|
| auth | auth, users |
| home | categories, businesses |
| search | businesses (filters) |
| map | businesses (lat/lng) |
| business_details | businesses, promotions, reviews |
| favorites | favorites |
| promotions | promotions |
| profile | users, favorites |
| owner | businesses, service-items, promotions, analytics |
| admin | admin/* |

## Phase plan

### Phase 0 — foundation (done)
Docs, rules, infra scaffold, monorepo.

### Phase 1 — MVP Uralsk (current)
catalog-api + mobile + admin moderation + seed Uralsk/Aktobe.

### Phase 2 — multi-city hardening (next)
CITY_ADMIN city scope, city content ops, no code fork.

### Phase 3 — web panels
Extract owner/admin from mobile if needed.

### Phase 4 — AI
Orchestrator + recommendation/moderation agents.

## Module ownership rules

- One Nest module per domain folder under `services/catalog-api/src/modules/`.
- Shared enums live in `packages/shared-types` once package exists.
- Cross-module calls via exported services, not direct Prisma from foreign modules.
