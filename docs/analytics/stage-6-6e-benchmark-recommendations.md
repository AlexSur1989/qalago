# Stage 6.6E — VIP benchmark & deterministic recommendations

## A. Cohort definition

- **Geography:** same `cityId` as the subject business.
- **Category:** same primary `categoryId` as the subject (canonical relation on `Business`, no new priority rules).
- **Period:** same local `metricDate` range as the dashboard `effectiveRange` (`rangeStart` … `rangeEnd` from city timezone via Stage 6.6A helpers).

## B. Subject exclusion

- Peer cohort = **other** businesses only.
- Prisma filter: `business.id: { not: subjectBusinessId }`.
- Subject metrics come from the subject’s own rollup totals for the period, not from the peer aggregate.

## C. Business eligibility

- Peers must have `BusinessStatus.ACTIVE`.
- No separate invented status rules; deleted/rejected/inactive peers are excluded by this filter.

## D. Minimum peer threshold (global)

- `BENCHMARK_MIN_PEER_BUSINESSES = 5`: at least **five peer businesses** with at least one `AnalyticsDailyMetric` row in the selected period (rollup `groupBy` by `businessId`).

## E. Per-metric threshold

- `BENCHMARK_MIN_PEERS_FOR_METRIC = 5`:
  - **Views average:** peers with `views > 0` in period.
  - **Actions average:** peers with `actions > 0` or `views > 0`.
  - **Conversion benchmark:** mean of per-peer view→intent conversion; requires ≥5 peers with `views > 0`.
  - **CTR benchmark:** mean of per-peer CTR; requires ≥5 peers with `impressions > 0`.

## F. Same-period behavior

- Subject and peers aggregate the **same** `[rangeStart, rangeEnd]` window.
- No comparison of subject 30d vs peer lifetime totals.

## G. Timezone behavior

- Dashboard builds `metricDate` range with `buildLocalMetricDateRange` and business city timezone (Stage 6.6A).
- Benchmark uses those dates directly on `AnalyticsDailyMetric.metricDate`.

## H. Metrics benchmarked

- **Views** (period sum).
- **Intent actions** (sum of call, WhatsApp, route, website, Instagram, favorite add rollups).
- **Conversion rate** (view → intent action, not purchase).
- **CTR** (views / impressions) when PRO/VIP impressions exist and per-metric peer count is sufficient.

## I. Recommendation rules

Deterministic, VIP-only (`buildDeterministicRecommendations`), no LLM, no named competitors.

| Id | Trigger (summary) |
|----|-------------------|
| `visibility-below-category` | Valid benchmark; views ≥10; subject views < 75% of peer avg views |
| `conversion-above-category` | Valid benchmark; conversion > 125% of peer avg (positive insight) |
| `ctr-below-category` | VIP CTR cap; impressions ≥20; CTR < 75% of peer avg CTR |
| `intent-conversion-weak` | Views ≥20; conversion below 75% of peer avg |
| `no-intent-actions` | Views ≥20; zero intent actions |
| `search-discovery-low` | Search-attributed views known; total views ≥15; search share < 15% |
| `promotions-visibility` | Low promotion views (visibility only, no promotion conversion claims) |
| `returning-share-low` | Classified audience views ≥30; returning share < 25% |
| `popular-hours` | Peak hour label from popular-times section |

## J. Minimum data thresholds

Centralized in `services/catalog-api/src/common/utils/analytics-insights.constants.ts`:

- `MIN_VIEWS_FOR_CONVERSION_INSIGHT = 20`
- `MIN_IMPRESSIONS_FOR_CTR_INSIGHT = 20`
- `MIN_VIEWS_FOR_VISIBILITY_BENCHMARK = 10`
- `MIN_CLASSIFIED_AUDIENCE_VIEWS = 30`
- `MIN_PROMOTION_VIEWS_FOR_INSIGHT = 5`
- `MIN_SEARCH_ATTRIBUTED_VIEWS = 15`
- Underperform ratios: `0.75` (visibility, CTR, conversion); outperform: `1.25`

## K. Recommendation priority

Lower `priority` number = higher rank (10 visibility → 80 positive conversion insight).

## L. Max recommendations

- `RECOMMENDATION_MAX_COUNT = 5`.

## M. Privacy

- Benchmark: aggregate cohort only; no peer `businessId`, names, or per-peer values in API JSON.
- Recommendations: no visitor identifiers, raw queries, or competitor identity.
- Search queries / geography thresholds unchanged (≥3 / ≥10).

## N. Performance

- Single `analyticsDailyMetric.groupBy({ by: ['businessId'], … })` per benchmark request.
- Rollup-first; no raw `AnalyticsEvent` scan for benchmark (including VIP 365d).

## O. Known limitations

- Cohort mean (not median) for MVP.
- Catalog/promotion **actions** not instrumented — recommendations limited to visibility wording.
- Audience new/returning is **view-classified**, not customer retention.

## P. Lost demand

- **Deferred.** No “users search X but don’t find you” recommendations; Stage 6.6 audit confirmed unsupported.
