# Testing Rules — QalaGo

**Scope:** `tests/**`, `**/*.spec.ts`, `**/*.test.ts`, `**/*_test.dart`.

## Pyramid

```text
E2E (few)        — critical user journeys
Integration      — API + DB, contract tests
Unit (many)      — services, packages, pure logic
```

## What must be tested

| Area | Minimum |
|------|---------|
| Auth | OTP verify, JWT expiry, role guards |
| Multi-city | business in city A not returned for city B |
| Favorites | add, remove, idempotent |
| Owner guards | cannot edit another owner's business |
| Admin | status transitions PENDING → ACTIVE → BLOCKED |
| Agents | input/output schema, tool deny |

## Where tests live

| Code | Tests |
|------|-------|
| `services/catalog-api` | colocated `*.spec.ts` + `tests/integration/catalog-api/` |
| `packages/*` | colocated unit tests |
| `apps/mobile` | `test/`, `integration_test/` |
| API contracts | `tests/contract/` vs OpenAPI / api-contracts.md |

## Commands (after setup)

```powershell
npm test                          # root / workspaces
cd services/catalog-api && npm test
cd apps/mobile && flutter test
cd apps/mobile && flutter analyze
```

## CI expectations (future)

- PR: lint + unit + integration (test DB).
- Main: + contract tests.
- Nightly: optional e2e mobile.

## Rules for AI/devs

- New service method with branching logic → unit test in same PR.
- Bug fix → regression test.
- No `@ts-ignore` to make tests pass.
- No skipped tests without issue link and expiry.
- Mock external APIs (SMS, LLM, maps); use real PostgreSQL only in integration job.

## Coverage targets (MVP)

- `services/catalog-api` critical modules: **≥ 60%** lines.
- `packages/shared-types`: schema validation **100%**.
- Mobile repositories: **≥ 50%** when introduced.

## Smoke flows (e2e backlog)

1. Login → home → business details
2. Search → filter → favorite
3. Owner login → edit business → pending → admin approve

## Forbidden

- Tests that hit production URLs or real SMS.
- Committing `.env` to make tests pass.
- Deleting failing tests instead of fixing code.
