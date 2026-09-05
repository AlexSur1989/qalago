# Monetization — QalaGo (Stage 2 + 3A Backend)

Campaign-based advertising monetization in `services/catalog-api`.  
Coexists with legacy subscription tiers (`Business.planTier`, `PlanPayment`, `/plans`).

---

## Scope

| Stage | Included |
|-------|----------|
| **Stage 2** | Product catalog, pricing, orders, manual payments, campaign provisioning, creative moderation |
| **Stage 3A** | Ad serving API, fair rotation, impression/click analytics, campaign expiration cron |

| Not included (later) | |
|--------------------|---|
| Flutter ad widgets | Stage 3B+ |
| Real payment gateways | Stage 4+ |
| Redis session store | Uses deterministic hash instead |
| `GET /businesses` ad mixing | Paid ads via separate API only |

---

## Products & placements

| Product code | Type | Placement |
|--------------|------|-----------|
| `BOOST` | BOOST | `CATEGORY_BOOST` |
| `TOP_CATEGORY` | TOP_CATEGORY | `CATEGORY_TOP` |
| `FEATURED_BUSINESS` | FEATURED_BUSINESS | `HOME_FEATURED` |
| `VIP_BANNER` | VIP_BANNER | `HOME_VIP_BANNER` |
| `PROMOTED_PROMOTION` | PROMOTED_PROMOTION | `HOME_PROMOTIONS` |
| `PACKAGE` | PACKAGE | (line item only) |

### Serving placements (Stage 3A)

Active: `HOME_VIP_BANNER`, `HOME_FEATURED`, `HOME_PROMOTIONS`, `CATEGORY_TOP`, `CATEGORY_BOOST`

Inactive (reserved): `SEARCH_TOP`, `MAP_FEATURED`

---

## Fair rotation (Stage 3A)

No Redis. Session stability via deterministic hash:

```
hash = SHA256(sessionId + campaignId + scope)
scope = sessionScopeKey(placement, cityId, categoryId?)
```

### Selection algorithm

1. **fairSort** — order candidates by `qualifiedImpressions / weight` ASC (lower = higher priority).
2. **Tie-break** — `hash(sessionId, campaignId, scope)` ascending.
3. **CATEGORY_TOP position 1** — among selected pool, campaign with oldest (or `null`) `lastTopPositionAt` gets position 1; positions 2+ from fairSort excluding the top-1 winner.
4. **Other placements** — first `maxVisible` from fairSort.

### Position fairness without schema migration

Schema has `lastTopPositionAt` (not separate top1/top3/top5 counters).  
When client reports `AD_IMPRESSION` with `position=1`, server sets `lastTopPositionAt = now`.  
This rotates CATEGORY_TOP slot 1 fairly over time.

`AD_SERVED` increments `servedCount` only (not `qualifiedImpressions`).  
Qualified impressions increment on deduped `AD_IMPRESSION` within 30 minutes per `sessionId+campaignId+placementId`.

---

## Ad serving API

`GET /monetization/ads/serve` (public)

Query: `placementCode`, `sessionId`, `citySlug|cityId`, `categoryId?` (required for category placements), `limit?`

- Validates placement is active and in `SERVING_PLACEMENT_CODES`
- `limit` capped by `AdPlacement.maxVisible`
- Filters: `ACTIVE` campaign, date window, `ACTIVE` business, active product, placement link, VIP requires `APPROVED` creative
- Response items: `sponsored: true`, `displayLabel: "Реклама"`, no financial fields
- Payload shape by product: VIP → creative; featured/top/boost → business card fields; promotions → promotion + business stub

On serve: atomic `servedCount++`, `lastShownAt`, `AnalyticsEvent` type `AD_SERVED`.

---

## Ad events API

`POST /monetization/ads/events` (public, rate limit 120 req/min/IP)

Body: `campaignId`, `placementCode`, `sessionId`, `type`, `position?`

| Type | Behavior |
|------|----------|
| `AD_IMPRESSION` | Dedupe 30 min; `qualifiedImpressions++`; if `position=1` → `lastTopPositionAt=now` |
| `AD_CLICK` | `clickCount++` |
| `AD_CARD_OPEN`, `AD_CALL_CLICK`, … | Store `AnalyticsEvent` only |

---

## Campaign analytics

- Owner: `GET /monetization/campaigns/:id/analytics?from&to`
- Admin: `GET /admin/monetization/campaigns/:id/analytics?from&to`

Returns: `served`, `qualifiedImpressions`, `clicks`, `ctr` (%), `actions` (groupBy on action event types).  
RBAC via `MonetizationAccessService`. Optional `from`/`to` filters action event counts.

---

## Campaign expiration

Cron every 5 minutes (`CampaignExpirationScheduler`):  
`ACTIVE`/`SCHEDULED` campaigns with `endAt <= now` → `COMPLETED` via `CampaignStatusService.syncExpiredCampaigns`.

---

## Pricing precedence

`ProductPrice` lookup order (exact `durationHours`/`durationDays` match required):

1. `cityId` + `categoryId` + `placementId`
2. `cityId` + `categoryId`
3. `cityId`
4. `categoryId`
5. Global (all null)

---

## Legacy plan discounts (temporary)

| Plan tier | Discount |
|-----------|----------|
| BASIC | 0% |
| PRO | 10% |
| TOP_CITY | 15% |

---

## Legacy fields (unchanged)

`Business.isFeatured`, `featuredSlot`, `planTier` — not wired to ad serving.  
`business-rank.util.ts` and `GET /businesses` unchanged.

---

## Module layout

```
src/modules/monetization/
  ad-rotation.service.ts      # fairSort, assignPositions (exported for tests)
  ad-serving.service.ts
  ad-events.service.ts
  ad-analytics.service.ts
  campaign-expiration.scheduler.ts
  guards/ad-events-rate-limit.guard.ts
  … (Stage 2 services)
```

---

## Dev demo seed

```powershell
npm run seed:monetization-demo
```

Creates sample ACTIVE campaigns in Uralsk (not part of main `prisma db seed`).

---

## Future

- Flutter ad widgets + impression beacons
- Real payment providers + webhooks
- Period-scoped served/impression aggregates from events
- Migration from legacy `isFeatured` to campaign-based featured
