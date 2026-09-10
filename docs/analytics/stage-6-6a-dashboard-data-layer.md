# Stage 6.6A — Analytics 360 dashboard data layer

Authoritative read path for `GET /api/v1/analytics/business/:businessId/dashboard`.

## Rollup sources

| Dashboard field | Source | Exact vs approximate |
|-----------------|--------|----------------------|
| `overview.views` | `AnalyticsDailyMetric.views` (sum) | Exact for rolled-up days |
| `overview.impressions` | Sum `impressions` (BUSINESS_IMPRESSION + SEARCH_RESULT_IMPRESSION at rollup) | Exact for rolled-up days |
| `overview.actions` / `totalCustomerActions` | **Business intent actions** (see below) | Exact for rolled-up days |
| `overview.ctr` | `views / impressions × 100` (period aggregate) | Exact; `null` if impressions = 0 |
| `overview.conversionRate` | `actions / views × 100` (view → intent action) | Not purchase; `null` if views = 0 |
| `overview.uniqueVisitorsDailySumApprox` | Sum of daily `uniqueVisitorsApprox` | **Approximate** — not period distinct |
| `overview.sessionsDailySumApprox` | Sum of daily `sessionsApprox` | **Approximate** |
| `overview.uniqueVisitorsPeriodDistinct` | Raw `groupBy visitorHash` | Only when period ≤ 90d; else `null` |
| `overview.sessionsPeriodDistinct` | Raw `groupBy sessionId` | Only when period ≤ 90d; else `null` |
| `trends.views` / `trends.actions` | Daily rollup rows keyed by local `metricDate` | Local timezone |
| `sources` | `AnalyticsDailyDimensionMetric` SOURCE / `views` | Rollup when data exists |
| `searchQueries` | SEARCH_QUERY dimension + `aggregateSearchQueries` | Backend threshold ≥ 3 |
| `audienceGeography` | DISTANCE_BUCKET dimension | Threshold ≥ 10 total views |
| `popularTimes.byHour` | HOUR dimension (local hour) | Rollup when data exists |
| `popularTimes.byWeekday` | Raw VIEW_BUSINESS only in ≤90d fallback | **Deferred** full rollup (6.6E) |
| `audience.*VisitorViews` | VISITOR_TYPE dimension | Counts VIEW_BUSINESS by new/returning, not unique people |
| `promotions.byPromotion` | PROMOTION dimension | Views only; `actions: null`, `actionsAvailable: false` |
| `catalog.items` | CATALOG_ITEM dimension | Views only; actions not instrumented |

## Canonical Business Intent Action Definition (Stage 6.6A.1)

**Business views** = `VIEW_BUSINESS` (rollup field `views` also includes `SEARCH_RESULT_OPEN` at ingest).

**Business intent actions** (numerator for `actions`, `totalCustomerActions`, `conversionRate`, period comparison, benchmark actions, action trends):

- `CALL_CLICK`
- `WHATSAPP_CLICK`
- `ROUTE_CLICK`
- `WEBSITE_CLICK`
- `INSTAGRAM_CLICK`
- `FAVORITE_ADD`

**Not** included in business intent actions:

- `FAVORITE_REMOVE` (not a positive intent)
- `PROMOTION_VIEW`, `PROMOTION_IMPRESSION`, `PROMOTION_ACTION` (promotion engagement — track via `promotionViews` / future promotion metrics)
- `CATALOG_ITEM_*`, `REVIEWS_VIEW`, `REVIEW_CREATED`, search/impression events

Implementation: `analytics-intent-actions.util.ts`; rollup uses separate daily counters (no migration).

## Formulas

- **Impressions:** rollup field `impressions`.
- **Views:** rollup field `views`.
- **Business intent actions:** sum of the six intent counters above (rollup or raw fallback).
- **Period CTR:** `views / impressions × 100` (not session CTR).
- **Business conversion rate:** `intent actions / views × 100` (`null` if views = 0; not purchase conversion).

## Timezone

- Events stored in UTC.
- Rollup `metricDate` and dashboard trends use `City.timezone` (fallback `Asia/Oral`).
- Period boundaries use `utcWindowForLocalDate` on first/last local metric dates.

## Raw fallback (≤ 90 days)

When no daily rollup rows exist and requested period ≤ 90 days, aggregates fall back to raw `analyticsEvent` queries (legacy dev / pre-rollup). Periods **> 90 days never** use raw event scans for core metrics; empty rollups yield zeros.

## Exceptions (documented)

- **Benchmark:** peer cohort still uses raw `groupBy` (unchanged; may move in 6.6E).
- **Period distinct visitors/sessions:** raw groupBy when ≤ 90d.

## Capability gating

Unchanged Stage 6.4 matrix (`getAnalyticsCapabilitiesForPlan`). New sections (`audience`, extended `promotions`, `catalog`) follow existing flags: VIP `recommendations` for audience/catalog; PREMIUM+ `promotionAnalytics`.

## Privacy

- Search queries below `MIN_SEARCH_QUERY_DISPLAY_COUNT` (3) never returned.
- Geography hidden below `MIN_AUDIENCE_GEOGRAPHY_SAMPLE` (10 views).
- No `visitorHash`, coordinates, or raw search history in dashboard JSON.

## Deferred

- Session-level impression → view funnel.
- Lost demand («искали, но не открыли»).
- PROMOTION_ACTION / CATALOG_ITEM_ACTION client instrumentation.
- Weekday popular times from rollups without raw 365d scan.
