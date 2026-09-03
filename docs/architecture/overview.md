# Architecture Overview — QalaGo

## Vision

QalaGo — единая платформа для городской жизни в Казахстане: найти заведение, посмотреть акции, связаться с бизнесом, вернуться снова.

**Launch:** один город (Уральск).  
**Scale:** добавление городов через данные (`City`), без форка приложения.

## System context

```text
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ apps/mobile │     │ admin-web   │     │ business-web│
│  (Flutter)  │     │  (Next.js)  │     │  (Next.js)  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │ HTTPS /api/v1
                    ┌──────▼──────┐
                    │ catalog-api │  NestJS + Prisma
                    │  (monolith) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
        │ PostgreSQL│ │  Redis  │ │ S3 (later)│
        └───────────┘ └─────────┘ └───────────┘

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
| Mobile | Flutter | Single codebase iOS/Android/Web |
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

- [Modules](./modules.md)
- [API contracts](./api-contracts.md)
- [Agents](../agents/overview.md)
