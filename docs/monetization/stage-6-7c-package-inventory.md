# Stage 6.7C — Package integrity, city inventory, scheduling foundation

## Summary

Stage 6.7C adds immutable package snapshots on orders, per-city placement capacity configuration, short-lived inventory reservations, business-scope **schedule-after** renewal semantics, and first-class `promotionId` on `AdCampaign`. Provisioning and payment confirmation use order snapshots and revalidated schedules—not live catalog rows.

## Package snapshot (`PackageSnapshotV1` / `ProductLineSnapshotV1`)

- Stored on `OrderItem.packageSnapshot` (packages) and `OrderItem.lineSnapshot` (single products).
- `schemaVersion: 1` — validated via `parsePackageSnapshotV1` / `parseProductLineSnapshotV1`.
- Built server-side in `PackageSnapshotService` at checkout from live `PromotionPackage` + `PurchaseSchedulingService` projections.
- Includes per-item: `projectedStartAt`, `projectedEndAt`, `conflictResolvedBy`, durations, targets (`categoryId`, `promotionId`), pricing fields on package root.
- **Never** accept client-provided snapshot JSON.

## Package immutability

- After order create, `CampaignProvisioningService` reads **only** `packageSnapshot` / `lineSnapshot` for composition and durations.
- Admin edits to `PromotionPackage` / items do not alter paid or pending orders.
- Payment confirm runs `revalidateOrderSchedules` (re-project with `excludeOrderId`) then provisions atomically in one transaction.

## Purchase / renewal policy

Mapped in `purchase-policy.types.ts` (aligned with product placements):

| Placement / product | purchasePolicy | renewalPolicy |
|---------------------|----------------|---------------|
| VIP, TOP, BOOST, FEATURED | SINGLE_PER_SCOPE | SCHEDULE |
| PROMOTED_PROMOTION | MULTI_DISTINCT_TARGETS | SCHEDULE_PER_TARGET |

Overlap for same scope → **schedule after** latest blocking campaign/reservation chain (half-open `[start, end)`).

## Scheduling algorithm

`PurchaseSchedulingService.resolveProjectedPeriod`:

1. Resolve business-scope conflicts (`ACTIVE`, `SCHEDULED`, moderation-pending where applicable) → bump start to latest `endAt`.
2. For capacity-scoped placements, bump start until `PlacementCapacityService.isWindowAvailable` succeeds (campaigns + non-expired `HELD` reservations).

Multiple future periods: always chain from **latest** occupied end in scope, not only the currently `ACTIVE` row.

**Gap handling:** repeat purchase does not auto-fill gaps unless the client sends an explicit `desiredStartAt` that passes validation.

**VIP moderation:** projected periods are stored at checkout; creative approval still gates activation via `CampaignStatusService` (duration not burned while pending—existing VIP semantics preserved).

## Entitlement model (decision)

- **Paid entitlement / delivery:** `AdCampaign` (unchanged).
- **Pre-payment hold:** `AdInventoryReservation` (`HELD` → `CONVERTED` on pay, `EXPIRED`/`CANCELLED` on abandon).
- No separate entitlement table in 6.7C.

## Promotion target persistence

- `AdCampaign.promotionId` nullable FK to `Promotion`.
- Migration backfills from `OrderItem.metadata->promotionId` where possible.
- Scope conflicts for HOME_PROMOTIONS use `promotionId`, not metadata parsing.

## Capacity hierarchy

- **Global default:** `AdPlacement.maxActiveCampaigns`
- **City override:** `AdPlacementCityConfig` (`placementId` + `cityId`, optional `maxActiveCampaigns`, `isEnabled`)
- Resolution: city config → placement default (no Uralsk hardcode).

Inventory scope:

- `HOME_VIP_BANNER` / `HOME_FEATURED`: city + placement
- `CATEGORY_TOP`: city + category + placement
- `CATEGORY_BOOST` / unlimited placements: no invented capacity unless configured later

Business duplicate rules (one effect per business scope) remain separate from shared slot counts.

## Reservation lifecycle

| Status | Meaning |
|--------|---------|
| HELD | Short-lived slot hold for AWAITING_PAYMENT checkout |
| CONVERTED | Payment confirmed; campaigns provisioned |
| EXPIRED | TTL elapsed; slot released |
| CANCELLED | Order/campaign cancelled |

TTL: `MONETIZATION_INVENTORY_RESERVATION_TTL_MS` (default 24h). Order may stay `AWAITING_PAYMENT` after hold expires.

## Payment after reservation expired

On manual payment confirm: expire stale `HELD` → `revalidateOrderSchedules` → provision → `convertHeldForOrder`. Schedules bump forward; no oversell/overlap.

## Package conflicts

Before payment, each package line item gets its own projected window in the snapshot. Active VIP in a package → VIP item `SCHEDULE_AFTER_EXISTING`; other items may start earlier if their scopes allow.

## Transactions

- Create order: intent lock → schedule assert → order + snapshots → sync reservations.
- Confirm payment: expire holds → revalidate → provision all items → convert reservations (single DB transaction).

## Multi-city

New cities use the same engine automatically. Configure optionally:

- `ProductPrice` per city
- `AdPlacementCityConfig` per placement
- Business content / categories

Same packages and placement rules apply; capacities and prices are data-driven.

## API additions (backend-only, 6.7D UI deferred)

Structured scheduling/conflict fields on snapshots; extended monetization error codes: `PLACEMENT_SOLD_OUT`, `PACKAGE_CONFLICT`, `RESERVATION_EXPIRED`.

## Deferred

- **6.7D:** Buy/Renew UI, sold-out UX, package schedule preview screens, reservation countdown.
- **6.7QA:** Adversarial concurrency storms, idempotency replay at scale.
- **Bonus spend:** monthly ad bonus spending still deferred from 6.7A.

## Security

- Price, snapshot, capacity, reservation expiry: server-authoritative only.
- Category/promotion/creative ownership enforced on create and provision paths.
