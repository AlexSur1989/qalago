# Modules — QalaGo

## Apps

| Module | Path | Status | Responsibility |
|--------|------|--------|----------------|
| Mobile | `apps/mobile` | MVP implemented | Users, map, catalog, favorites, owner/admin MVP screens |
| Admin Web | `apps/admin-web` | MVP implemented | Sidebar shell, moderation, VIP slots, users, reviews, categories, AI drafts |
| Business Web | `apps/business-web` | MVP implemented | Owner dashboard, profile, menu, media, reviews, messages |

## Services

| Module | Path | Status | Responsibility |
|--------|------|--------|----------------|
| Catalog API | `services/catalog-api` | MVP implemented | REST API, auth, catalog, engagement, admin API, analytics ingest |
| AI Orchestrator | `services/ai-orchestrator` | MVP scaffold | Rule-based recommendations, moderation assist, content drafts |
| Notifications | `services/notifications` | future | Push, SMS |
| Analytics Worker | `services/analytics-worker` | future | Event aggregation |

## Packages

| Module | Path | Status | Responsibility |
|--------|------|--------|----------------|
| shared-types | `packages/shared-types` | ready | DTOs, enums, RBAC |
| api-client | `packages/api-client` | not started | Typed HTTP (TS; Dart codegen optional) |
| geo-core | `packages/geo-core` | future | Distance, bounds, district helpers |
| ai-core | `packages/ai-core` | MVP scaffold | Rule-based recommendations, moderation, editorial drafts |
| agents | `packages/agents` | MVP scaffold | Agent specs + policies |

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
| home | categories, businesses, AI recommendations |
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
Docs, rules, infra scaffold, monorepo, Git, CI.

### Phase 1 — MVP Uralsk (done)
catalog-api + mobile + admin + business-web + seed Uralsk/Aktobe + geo-nearby + RBAC.

### Phase 2 — multi-city hardening (in progress)
CITY_ADMIN scope, category order/visibility per city, admin city CRUD + bootstrap, empty-city mobile UX. Next: feature flags per city, launch notifications.

### Phase 3 — production readiness (current)
Real SMS, Redis, S3 uploads, Docker staging verify, VPS deploy, FCM push.

### Phase 4 — AI (scaffold done)
Rule-based agents live. Next: LLM integration, editorial publish flow.

## Module ownership rules

- One Nest module per domain folder under `services/catalog-api/src/modules/`.
- Shared enums live in `packages/shared-types`.
- Cross-module calls via exported services, not direct Prisma from foreign modules.
