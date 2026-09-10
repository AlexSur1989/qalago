# Stage 6.7A — Monetization Purchase Integrity + Multi-City Audit

**Mode:** Read-only architecture audit (no production code changes).  
**Baseline:** `effbc855ed181254334e7a24d75d8370c3d39fd6` (= `origin/master`).  
**Date:** 2026-09-11.

---

## Executive summary

Campaign-based monetization (Orders → Manual Payment → Provisioning → AdCampaign) is implemented in `services/catalog-api` with Business Web and Flutter owner flows. **Inventory is placement-capacity based**, not per-business uniqueness. **Serving is city-scoped** (`AdCampaign.cityId`). Gaps vs target purchase-integrity matrix: no per-business duplicate prevention, VIP capacity count is **global** (no `cityId` in overlap query), package contents are **not snapshotted** on the order, **monthly ad bonus is catalog-only** (not applied at checkout), **pending-order deduplication absent**, and **assertAvailableInTransaction** counts campaigns outside the DB transaction client.

**Verdict:** **READY FOR STAGE 6.7B** (Purchase Integrity Core) — no schema blockers, but several **HIGH** risks documented below.

---

## Canonical sources

| Concern | Source |
|--------|--------|
| Product → placement | `PRODUCT_PLACEMENT_MAP` in `monetization.constants.ts` |
| Placements + capacity | `seed-monetization.ts` → `AdPlacement` |
| Prices (MVP) | `URALSK_PRICES` in `seed-monetization.ts` → `ProductPrice` |
| Packages | `PACKAGES` / `PACKAGE_ITEMS` in `seed-monetization.ts` |
| Plan ad discount | `PLAN_CATALOG[].limits.advertisingDiscountPercent` |
| Package plan discount | `PACKAGE_DISCOUNT_PERCENT = 0` |

---

## Product catalog (repo truth)

| Product code | Placement | Typical durations (seed) | Target | City scope (purchase) | Duplicate / overlap |
|--------------|-----------|--------------------------|--------|------------------------|---------------------|
| `VIP_BANNER` | `HOME_VIP_BANNER` | 3/7/14/30 d | Business + creative | Business.`cityId` on campaign; **capacity global** | Pool max 3; **same business can stack** if slots free |
| `TOP_CATEGORY` | `CATEGORY_TOP` | 3/7/30 d | Category (business primary or `item.categoryId`) | city + category | Pool max 15 per city+category; **no per-business limit** |
| `BOOST` | `CATEGORY_BOOST` | 24h, 3/7 d | Category | city on campaign | **No scoped availability** → always `available: true` |
| `FEATURED_BUSINESS` | `HOME_FEATURED` | 3/7/30 d | Business | city | Pool max 20; **no per-business limit** |
| `PROMOTED_PROMOTION` | `HOME_PROMOTIONS` | 3/7/14/30 d | `promotionId` in order metadata | city | **No scoped availability**; `promotionId` not on `AdCampaign` |
| `PACKAGE` | (multi) | package-defined | Mixed | business city | Pre-check all items; VIP uses global pool |

**Inactive / future placements in seed:** `SEARCH_TOP`, `MAP_FEATURED` (`isActive: false`, not in `SERVING_PLACEMENT_CODES`).

---

## Models (short)

- **Order:** `AWAITING_PAYMENT` → `PAID` (on manual confirm); `CANCELLED` / `REFUNDED` enums exist; **no owner cancel/refund API** in monetization module.
- **Payment:** `PENDING` → `PAID` via admin `confirmManualPayment`; `idempotencyKey` **nullable @unique, unused** in manual flow.
- **PlanPayment:** Separate model for **subscription tier** payments (`plans.service`), not ad orders.
- **AdCampaign:** `startAt`/`endAt` (no separate `requestedStart` column); requested start in **OrderItem.metadata**; statuses include `PENDING_MODERATION`, `AWAITING_PAYMENT`, `SCHEDULED`, `ACTIVE`, `COMPLETED`, etc.
- **PromotionPackage / Item:** Live DB definition; **not copied** to order beyond `packageCode` in metadata.

---

## Critical behaviors (answers)

### Package + existing VIP

If business already has ACTIVE VIP: checkout **not blocked** unless **global** VIP slot count ≥ `maxActiveCampaigns` (3). **Duplicate VIP campaigns possible** for same business.

### Package conflict / partial activation

- **Order create:** all package items must pass `checkAvailability` or whole order rejected.
- **Payment confirm:** `provisionOrderCampaigns` in **one transaction** with sequential `createCampaignForProduct`; failure rolls back payment+order updates.
- **Package order:** no transactional availability lock at order create (`PACKAGE` skipped in `persistOrder` loop).
- **Definition drift:** provisioning re-loads `PromotionPackage` by `packageCode` at pay time.

### Pending order duplication

Each `createOrder` creates new `AWAITING_PAYMENT` order + `PENDING` payment. **No dedupe**, no idempotency key on create.

### Price / duration / plan tampering

- **Quote:** `finalPrice` ignored; server pricing via `PricingService`.
- **Order:** lines priced server-side; no client total on `CreateOrderDto`.
- **Duration:** client picks `durationHours`/`durationDays`; price lookup **must match** a `ProductPrice` row or `PRICE_NOT_FOUND` (no arbitrary 365d unless priced).
- **Plan tier:** discount from `resolvePlanDiscountPercent(businessId)` — **not from request**.

### Category / promotion / creative security

- **Quote** enforces `categoryId === business.categoryId`; **createOrder does not** (API bypass).
- **Promotion:** ownership only (`businessId`); not validated for active/expired.
- **Creative:** VIP requires owned creative; cross-business blocked.

### VIP dates (4B.1)

After creative approve, `resolveOnCreativeApproved` runs **7d from approve** (or later `desiredStartAt`). Pre-approval window does not consume paid days (see `campaign-status-vip-dates.spec.ts`).

### Organic vs paid (4C)

`compareBusinessCatalogRank` — **title only**; plan/`isFeatured` do not affect organic lists. Home organic excludes paid `HOME_FEATURED` IDs in Flutter.

**Recommended/Promoted “Реклама” UX:** Category screen labels paid TOP block **«Рекомендуемые»** and BOOST **«Продвигаются»**; both use `SponsoredBusinessSection` → `displayLabel: 'Реклама'` from API. **Root cause:** product naming (TOP ≈ “recommended”) + uniform sponsored label, not organic/paid DTO merge.

### Multi-city

- **Serving:** `loadEligibleCampaigns` filters `cityId` — **PASS**.
- **VIP capacity:** overlap count **without `cityId`** — **FAIL** for per-city inventory.
- **Seed:** monetization catalog/prices run with **`uralskCityId` only** (`seed.ts`).
- **Admin UI:** default filter `citySlug = 'uralsk'` in `monetization-layout-client.tsx`.
- **Pricing:** `ProductPrice.cityId` + fallback chain — **READY FOR CITY OVERRIDES** once rows exist.

### Monthly ad bonus

Values in `PLAN_CATALOG` only; **not wired** to monetization checkout (no spend/ledger).

---

## Target matrix vs current

| Placement | Target (6.7+) | Current match |
|-----------|-----------------|---------------|
| HOME_VIP_BANNER | 1 active/scheduled per business+city | **NO** (global pool, multi per business) |
| CATEGORY_TOP | 1 per business+city+category | **NO** (shared pool) |
| CATEGORY_BOOST | 1 per business+city+category | **NO** (no check) |
| HOME_FEATURED | 1 per business+city | **NO** (shared pool) |
| HOME_PROMOTIONS | multi promotion targets | **PARTIAL** (multi allowed; no overlap on same promotion) |

---

## Risk register (summary)

| Severity | Issue |
|----------|--------|
| CRITICAL | Same business can run overlapping paid campaigns of same placement (except when global pool full) |
| HIGH | VIP inventory counted **cross-city** |
| HIGH | `checkAvailability` inside `$transaction` uses non-`tx` Prisma client (stale counts / overbook) |
| HIGH | Double `createOrder` → double pending orders / double pay risk |
| HIGH | Package TOCTOU (no lock at order create) |
| MEDIUM | No order/package snapshot immutability |
| MEDIUM | `categoryId` tampering on createOrder |
| MEDIUM | Ad bonus not implemented at checkout |
| LOW | Admin default city uralsk |
| INFO | `Payment.idempotencyKey` unused |

---

## Recommended roadmap

1. **6.7B — Purchase Integrity Core:** per-scope policies, pending-order policy, transactional availability counts, idempotent checkout, category validation parity, VIP city scope.
2. **6.7C — Package + inventory:** order snapshot, package atomic policy, promotionId on campaign or overlap index, city capacity config.
3. **6.7D — UX + organic/paid:** rename category TOP section copy; eligibility API for UI.
4. **6.7QA — Abuse/race/payment** concurrency tests.

---

## Test coverage map

Present: `order.service.spec`, `availability.service.spec`, `stage-4b1-vip-package`, `stage-4b2-vip-inventory`, `ad-serving`, `campaign-provisioning`, `creative-lifecycle`, pricing/access specs.

Missing / weak: concurrent createOrder, pending dedupe, per-business duplicate campaigns, multi-city VIP isolation, package definition drift, ad bonus spend, cancel/refund.

---

*End of Stage 6.7A audit document.*
