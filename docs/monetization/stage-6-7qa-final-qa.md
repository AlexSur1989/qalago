# Stage 6.7QA — Final adversarial QA

Date: 2026-09-11  
Baseline commit: `b9e9d8f` (6.7D)  
QA commit: (see git log)

## Scope

Adversarial regression over:

- **6.7B** purchase integrity (pending dedupe, idempotency, scheduling scope, eligibility)
- **6.7C** package snapshots, city capacity, reservations
- **6.7C.1** migration backfill + FK ordering
- **6.7D** category discovery UX + organic sort + owner purchase states

No product features added. Tests-only + documentation unless a defect is found.

## Test matrix (new in 6.7QA)

| Area | File | Cases |
|------|------|-------|
| Purchase adversarial | `stage-6-7qa-purchase-adversarial.spec.ts` | Half-open boundaries, renewal chain, idempotency replay, cross-business promotion, CATEGORY_TOP capacity scope, generic city, CreateOrderDto surface, placement scope matrix |
| Category discovery | `stage-6-7qa-category-discovery.spec.ts` | Sort-before-slice (120 rows), batch popularity metrics, plan-neutral recommended, search+sort, lat validation/NaN, rating tie-break |
| Package / inventory | `stage-6-7qa-package-inventory.spec.ts` | Snapshot immutability parse, multi-component snapshot, purchase-states auth gate |
| Flutter UX strings | `category_discovery_qa_test.dart` | RU/KK section + sort labels |

Existing suites retained: `stage-6-7b-purchase-integrity`, `stage-6-7c-package-inventory`, `stage-6-7d-purchase-states`, `order.service.spec` (payment replay, pending dedupe), `business-catalog-sort.util.spec`, `businesses.service.spec`.

## Concurrency guarantees actually tested

| Property | Coverage |
|----------|----------|
| Same idempotency key → same payment/order | Unit (OrderService + 6.7QA replay) |
| Pending intent dedupe | Unit (6.7B + OrderService) |
| Payment confirm replay → no second provision | Unit (`order.service.spec` #21) |
| Advisory locks on purchase intent / placement | Code path + lock helpers (6.7B); **not** live PostgreSQL parallel race in CI |
| Two buyers last slot race | **Not** proven under real DB concurrency; capacity counting logic tested via mocks (6.7C/QA) |

**Post-MVP:** recommend PostgreSQL integration tests or load harness for last-slot races and parallel `createOrder`.

## Verdicts

| Domain | Verdict |
|--------|---------|
| Purchase integrity | **PASS** — dedupe, schedule-after, eligibility, idempotency replay documented |
| Package integrity | **PASS** — snapshots server-side; DTO has no client snapshot fields |
| Inventory / reservations | **PASS** — HELD+TTL counted; EXPIRED/CONVERTED excluded (6.7C) |
| Multi-city | **PASS** — capacity queries scoped by `cityId`; ad serve resolves city |
| Category discovery | **PASS** — full-set sort then slice; plan-neutral organic sort |
| Paid / organic | **PASS** — sort comparators ignore tier; ads via serve API only |
| Owner purchase states | **PASS** — backend endpoint + access guard |

## Known limitations

1. **Category list `limit=100` (MVP)** — API loads all businesses matching `where`, sorts in memory, then slices. Correct for ≤ few hundred per city/category; **not** scalable to national catalogs. Future: DB-level `ORDER BY` + cursor pagination.
2. **Idempotency key** — scoped to `Payment.idempotencyKey`; replay returns existing order **without** re-validating request body (standard idempotency semantics). Clients must not reuse keys across different purchase intents.
3. **Concurrency** — transactional advisory locks exist; parallel last-slot behavior not validated on real PostgreSQL in CI.
4. **Nearest sort** — requires valid lat/lng; invalid/NaN rejected by DTO validation.
5. **Popularity** — sum of organic `AnalyticsDailyMetric.views` (30d window); paid ad views excluded by metric type.

## Migration regression (6.7C)

`20260911103000_stage_6_7c_package_inventory`: backfill `promotionId` via `JOIN Promotion` before FK; indexes on reservations and city config. No further edits (already applied).

## Bugs found / fixed in 6.7QA

**None.** Adversarial tests added; full suite green without production code changes.

## Commands

```powershell
npm test --workspace=services/catalog-api   # 681 passed (after QA)
npm run build --workspace=services/catalog-api
cd apps/mobile; flutter test test/consumer/category_discovery_qa_test.dart
```
