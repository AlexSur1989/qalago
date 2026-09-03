# Architecture Rules — QalaGo

**Scope:** always apply in this repository.

## Monorepo layout

```text
apps/                 — deployable UIs (mobile, admin-web, business-web)
services/             — backend services with own DB access
packages/             — shared libraries, no direct deploy
packages/ai-core/     — LLM adapters, prompts, embeddings
packages/agents/      — agent definitions (schemas, policies)
services/ai-orchestrator/ — agent routing, tool execution, audit
docs/                 — source of truth for design
tests/                — cross-cutting tests
infra/                — docker, CI, env templates
scripts/              — dev, seed, migration helpers
```

## Layer rules

1. **Presentation** (`apps/*`) — widgets, pages, routing only.
2. **Application** (`services/*/src/modules`) — use cases, orchestration.
3. **Domain** (`packages/*` or `services/*/domain`) — entities, invariants.
4. **Infrastructure** — Prisma, HTTP clients, file storage, queues.

**Forbidden:** SQL/Prisma calls from `apps/*`. Business rules in Flutter widgets or Next.js pages.

## Multi-city (mandatory from day one)

- Entity `City` exists before first `Business`.
- Every business belongs to `cityId`.
- API lists accept `cityId` or `citySlug`; default `uralsk` on MVP.
- Roles: `USER`, `BUSINESS`, `CITY_ADMIN`, `ADMIN`.

## Naming

| Item | Convention |
|------|------------|
| Services | kebab-case: `catalog-api` |
| Nest modules | kebab-case folders, PascalCase classes |
| Flutter features | snake_case folders |
| API routes | plural nouns: `/businesses`, `/categories` |
| Env vars | SCREAMING_SNAKE |

## New folders

Before adding a top-level directory:

1. Explain in PR/commit message why existing layout is insufficient.
2. Update `docs/architecture/overview.md` and this file if approved.

## API changes

1. Update `docs/architecture/api-contracts.md`.
2. Update `packages/shared-types` if it exists.
3. Then implement in `services/catalog-api`.
4. Then update clients in `apps/*`.

## Dependency direction

```text
apps → packages/api-client → services (HTTP)
apps → packages/shared-types
services → packages/shared-types
services/ai-orchestrator → packages/agents → packages/ai-core
services → PostgreSQL (only services touch DB)
```

No circular imports between packages.

## MVP scope lock

In scope for v1: auth, catalog, map, promotions, favorites, reviews (basic), owner cabinet, admin moderation.

Out of scope until v2: delivery, payments, QR, full loyalty, chat, afisha, production AI.

## Implementation order (greenfield)

1. `infra` + `services/catalog-api` schema + auth
2. `packages/shared-types`
3. `apps/mobile` core flows
4. Web panels or mobile admin (explicit decision)
5. AI scaffold (no prod traffic)
