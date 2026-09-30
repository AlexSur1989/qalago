# Architecture Overview — QalaGo

## Vision

QalaGo — единая платформа для городской жизни в Казахстане: найти заведение, посмотреть акции, связаться с бизнесом, вернуться снова.

**Launch:** один город (Уральск).  
**Scale:** добавление городов через данные (`City`), без форка приложения.

## Client surfaces (canonical)

All product clients consume the **same** Catalog API and **PostgreSQL** data — no separate per-channel catalogs or databases.

| Surface | Path | Role |
|---------|------|------|
| **Flutter Mobile** | `apps/mobile` | **Production native app** — **Android** and **iOS** |
| **Consumer Web** | `apps/consumer-web` | **Canonical public browser** — desktop and mobile browsers; production host **`https://qalago.kz`** when configured |
| **Flutter Web** | same `apps/mobile` codebase, `web/` target | **DEV / QA / local demo / compile-regression only** — e.g. local **`http://127.0.0.1:8080`** via `npm run dev:all`; **not** a production public frontend, **not** SEO owner, **not** an alternative host for `qalago.kz` |
| **Business Web** | `apps/business-web` | Owner cabinet (authenticated) |
| **Admin Web** | `apps/admin-web` | Staff moderation |

Flutter remains the **native mobile** technology. **Public Flutter Web is not part of the production browser architecture.**

## System context

```text
                    Catalog API + PostgreSQL
                              |
              +---------------+---------------+
              |                               |
       Flutter Mobile                   Consumer Web
       (Android / iOS)                  (Next.js)
              |                               |
        native store apps              qalago.kz (public)
              |                               |
              +---------------+---------------+
                              |
              +---------------+---------------+
              |               |               |
       business-web    admin-web      (Flutter Web: local DEV only)
       (Next.js)       (Next.js)      not shown in prod topology

Future:
       apps/mobile ──► ai-orchestrator ──► packages/agents ──► LLM provider
                              │
                              └──► catalog-api (read tools only)
```

## Architectural style

| Phase | Style |
|-------|--------|
| MVP | Modular monolith (`services/catalog-api`) |
| Growth | Extract notifications, search, analytics worker |
| AI | Sidecar `services/ai-orchestrator`, no direct DB from agents |

**Future-ready / scale principles (planning only, not implemented):** [future-ready-platform.md](./future-ready-platform.md) — modular monolith first, stateless API, SCALE.0–SCALE.12 track (**not started**).

## Multi-city model

```text
Country (KZ)
  └── City (uralsk, aktobe, …)
        └── Business
              └── ServiceItem, Promotion, Review, …
```

- `User.preferredCityId` — optional.
- API default: `citySlug=uralsk` until user selects another.
- `CITY_ADMIN` scoped to one city.

## Technology choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Flutter Mobile | Flutter | Native **Android + iOS** (`apps/mobile`) |
| Public browser | Next.js | **Consumer Web** — canonical public site (`apps/consumer-web`) |
| Flutter Web | Flutter `web` target | **DEV/QA only** — same repo as mobile; not production public |
| API | NestJS + Prisma | Typed backend, migrations |
| DB | PostgreSQL | Relations, geo, scale |
| Cache/queue | Redis (phase 2) | OTP, sessions, jobs |
| Maps | 2GIS primary, OSM fallback | KZ coverage |
| Auth | SMS OTP + JWT | Local market norm |

## Deployment (target)

| Stage | Setup |
|-------|--------|
| Dev | Docker Compose: Postgres + Redis |
| Staging | Single VM + managed Postgres |
| Prod | API + DB + CDN; separate mobile builds |

## Non-goals (MVP)

- Microservices per city
- In-app payments / delivery
- Production LLM traffic
- Separate DB per region

## Related docs

- [Future extensibility contracts](./future-extensibility-contracts.md) — post-6.12A ADR (F.4 prerequisite)
- [Modules](./modules.md)
- [API contracts](./api-contracts.md)
- [RBAC & AuditLog](./rbac.md)
- [Business membership](./business-membership.md)
- [Project status](../PROJECT_STATUS.md)
- [Agents](../agents/overview.md)
