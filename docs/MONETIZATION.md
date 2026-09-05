# Monetization — QalaGo (Stage 2 Backend)

Campaign-based advertising monetization in `services/catalog-api`.  
Coexists with legacy subscription tiers (`Business.planTier`, `PlanPayment`, `/plans`).

---

## Scope (Stage 2)

| Included | Not included (later stages) |
|----------|----------------------------|
| Product catalog & packages | Ad serving / fair rotation |
| Pricing engine + plan discounts | Impression/click tracking |
| Availability checks | Flutter ad widgets |
| Orders + manual payments | Real payment gateways (Kaspi/Halyk) |
| Campaign provisioning | Cron scheduler |
| Creative moderation API | Admin/business UI |

---

## Products & placements

| Product code | Type | Placement |
|--------------|------|-----------|
| `BOOST` | BOOST | `CATEGORY_BOOST` |
| `TOP_CATEGORY` | TOP_CATEGORY | `CATEGORY_TOP` |
| `FEATURED_BUSINESS` | FEATURED_BUSINESS | `HOME_FEATURED` |
| `VIP_BANNER` | VIP_BANNER | `HOME_VIP_BANNER` |
| `PROMOTED_PROMOTION` | PROMOTED_PROMOTION | `HOME_PROMOTIONS` |
| `PACKAGE` | PACKAGE | (line item only; provisions package items) |

---

## Pricing precedence

`ProductPrice` lookup order (exact `durationHours`/`durationDays` match required):

1. `cityId` + `categoryId` + `placementId`
2. `cityId` + `categoryId`
3. `cityId`
4. `categoryId`
5. Global (all null)

Filters: `isActive`, `validFrom`, `validUntil`.  
No fallback beyond step 5 → `PRICE_NOT_FOUND`.

---

## Legacy plan discounts (temporary)

Server-side mapping in `PricingService` (Stage 2 only):

| Plan tier | Discount |
|-----------|----------|
| BASIC | 0% |
| PRO | 10% |
| TOP_CITY | 15% |

**Packages:** `discountPercent = 0` always (fixed package price).

Money: integer KZT, `discountAmount = Math.round(basePrice * percent / 100)`.

Client `finalPrice` is **never** trusted.

---

## Quote flow

`POST /monetization/quote`:

1. Auth + business ownership
2. Resolve city/category from business (reject client mismatch)
3. Lookup price + plan discount
4. Check placement availability
5. Return quote — **does not reserve slot or create order**

Response includes `basePrice`, `discountPercent`, `discountAmount`, `finalPrice`, `availability`, `calculatedEndAt`.

---

## Availability

Limited placements enforce `maxActiveCampaigns` for overlapping `ACTIVE` + `SCHEDULED` campaigns:

| Placement | Scope |
|-----------|-------|
| `HOME_VIP_BANNER` | Global placement limit |
| `CATEGORY_TOP` | Per city + category |
| `HOME_FEATURED` | Per city |

`COMPLETED`, `CANCELLED`, `REJECTED` do not consume capacity.

When full: `available: false`, optional `nextAvailableAt` (earliest overlapping `endAt`).

### Race condition protection

Quote does **not** guarantee a slot. On order creation and campaign provisioning, availability is re-checked inside a PostgreSQL transaction using `pg_advisory_xact_lock` keyed by `placement:city:category` hash.

---

## Orders

- Human-readable `orderNumber`: `QLG-YYYYMMDD-XXXXXX` (server random, unique check)
- Status: `AWAITING_PAYMENT` on create
- `OrderItem` snapshots: `basePrice`, `discountPercent`, `discountAmount`, `finalPrice`
- Integrity: `subtotal - discountAmount = totalAmount`
- Auto-creates `Payment` `PENDING` / `provider=MANUAL`

---

## Manual payment confirmation

`POST /admin/monetization/payments/:id/confirm` — single transaction:

1. Idempotent if already `PAID` → `{ alreadyPaid: true }`
2. Verify `Payment=PENDING`, `Order=AWAITING_PAYMENT`, amounts match
3. `Payment→PAID`, `Order→PAID`, provision campaigns
4. Rollback entire transaction if provisioning fails

---

## Campaign provisioning

After `Order→PAID`, create `AdCampaign` + `AdCampaignPlacement` per order item.

**VIP_BANNER:** requires `AdCreative`. Without approved creative → `PENDING_MODERATION`.  
Paid days are not lost: on `APPROVED`, `startAt = max(now, desiredStartAt)`, `endAt = startAt + duration`.

**Status rules:**

| Condition | Status |
|-----------|--------|
| Awaiting creative approval | `PENDING_MODERATION` |
| Approved, start in future | `SCHEDULED` |
| Approved, start now/past | `ACTIVE` |
| `endAt <= now` | `COMPLETED` (effective) |

**Packages:** one `OrderItem` (type `PACKAGE`), provisions each `PromotionPackageItem`:

| Package | Items |
|---------|-------|
| START | TOP_CATEGORY 7d, PROMOTED_PROMOTION 7d |
| BUSINESS | TOP_CATEGORY 7d, FEATURED_BUSINESS 7d, PROMOTED_PROMOTION 7d |
| MAX | VIP_BANNER 7d, TOP_CATEGORY 7d, FEATURED_BUSINESS 7d, PROMOTED_PROMOTION 7d |
| NEW_PLACE | VIP_BANNER 7d, TOP_CATEGORY 14d, FEATURED_BUSINESS 14d, PROMOTED_PROMOTION 14d |

Package prices: START 6900, BUSINESS 12900, MAX 19900, NEW_PLACE 24900 KZT.

`NEW_PLACE` badge not implemented in Stage 2.

---

## Creatives & moderation

- Owner: create/list/get/update (DRAFT/REJECTED only)
- Admin: approve/reject
- On approve: linked paid campaigns → `SCHEDULED` or `ACTIVE`
- On reject: campaigns → `REJECTED` (no auto-refund)

---

## RBAC

- `BUSINESS`: own businesses only
- `CITY_ADMIN`: city scope via `CityScopeService`
- `ADMIN`: all cities
- `BUSINESS` cannot confirm payments

---

## Legacy fields (unchanged)

`Business.isFeatured`, `featuredSlot`, `planTier` — not wired to new ad campaigns.  
`business-rank.util.ts` unchanged; ad products do not affect `GET /businesses` yet.

---

## Module layout

```
src/modules/monetization/
  monetization.module.ts
  monetization.controller.ts
  monetization-admin.controller.ts
  monetization.service.ts
  pricing.service.ts
  availability.service.ts
  order.service.ts
  campaign-provisioning.service.ts
  campaign-status.service.ts
  creative.service.ts
  monetization-access.service.ts
  constants/ errors/ dto/ utils/
```

---

## Future (Stage 3+)

- Ad serving endpoint with fair rotation
- Analytics event wiring (AD_SERVED, AD_IMPRESSION, AD_CLICK)
- Real payment providers + webhooks
- Cron for `syncExpiredCampaigns`
- Migration from legacy `isFeatured` to campaign-based featured
