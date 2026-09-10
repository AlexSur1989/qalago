# Stage 6.7B — Purchase Integrity Core

**Date:** 2026-09-11  
**Scope:** Backend-only hardening (no UI redesign, no Prisma migration).

See also: [Stage 6.7A audit](./stage-6-7a-purchase-integrity-audit.md).

---

## Canonical purchase scopes

| Placement | Scope dimensions |
|-----------|------------------|
| `HOME_VIP_BANNER` | `businessId` + `cityId` + placement |
| `CATEGORY_TOP` | `businessId` + `cityId` + `categoryId` + placement |
| `CATEGORY_BOOST` | `businessId` + `cityId` + `categoryId` + placement |
| `HOME_FEATURED` | `businessId` + `cityId` + placement |
| `HOME_PROMOTIONS` | `businessId` + `cityId` + `promotionId` + placement (via order item metadata) |

Implemented in `PurchaseScopeService` + enforced by `PurchaseIntegrityService.assertNoScopeOverlap`.

---

## Overlap semantics

Half-open interval (unchanged):

`existing.startAt < newEnd AND existing.endAt > newStart`

Adjacent periods (10–20, 20–30) do **not** overlap.

---

## Statuses that block same-business overlap

- Default products: `ACTIVE`, `SCHEDULED`
- VIP: also `PENDING_MODERATION` (reserves slot while creative awaits approval)

Terminal states (`COMPLETED`, `CANCELLED`, `REJECTED`, …) are excluded.

---

## Pending order policy

Equivalent `AWAITING_PAYMENT` orders are **reused** (not duplicated) when purchase intent matches:

- business, product or package, duration SKU, category/promotion/creative when required, normalized `desiredStartAt`

Response flags (additive): `reusedPendingOrder`, `existingOrderId`, `reasonCode: PENDING_ORDER_EXISTS`.

Pending orders do **not** consume placement capacity (deferred to 6.7C inventory reservation).

---

## Checkout idempotency

Optional `CreateOrderDto.idempotencyKey` (8–128 chars) stored on `Payment.idempotencyKey`.

Same key → same order/payment; duplicate create returns `idempotentReplay: true`.

---

## Transactions & locks

1. **Purchase intent lock:** `pg_advisory_xact_lock` keyed by `businessId + intent fingerprint` serializes duplicate checkout.
2. **Placement capacity lock:** unchanged identity `placement + city + category`; availability counts run on the **same** `tx` client (6.7B fix).

---

## VIP city isolation

`HOME_VIP_BANNER` shared pool counts include `cityId` — cities no longer share one global VIP capacity bucket.

---

## Validation parity

- `createOrder` enforces category eligibility (same rule as quote).
- Promotions must be owned and `ACTIVE` for purchase.
- Server-authoritative pricing/plan tier unchanged.

---

## Error codes (409 Conflict)

- `PURCHASE_CONFLICT` + `reasonCode`: `ALREADY_ACTIVE`, `ALREADY_SCHEDULED`, `TARGET_ALREADY_PROMOTED`
- `CATEGORY_NOT_ELIGIBLE` (category mismatch)
- `PENDING_ORDER_EXISTS` (reuse path metadata)

---

## Package limitations (6.7C)

- No package item snapshot on order
- `promotionId` still on order metadata (not `AdCampaign` column)
- No stale pending cleanup scheduler
- No per-city capacity configuration table

---

## Key files

- `purchase-scope.service.ts`
- `purchase-integrity.service.ts`
- `utils/purchase-intent.util.ts`
- `availability.service.ts` (tx-safe counts, VIP city scope)
- `order.service.ts` (dedupe, idempotency, tx validation)
- `stage-6-7b-purchase-integrity.spec.ts`
