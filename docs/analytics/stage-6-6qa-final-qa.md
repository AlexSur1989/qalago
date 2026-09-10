# Stage 6.6QA — Analytics 360 final QA

## Scope

End-to-end audit of Analytics 360 backend (6.5–6.6F), export/report foundation, and client capability trust (Flutter/Business Web read-only audit).

## Entitlement matrix (verified)

Backend `getAnalyticsCapabilitiesForPlan` + `AnalyticsDashboardBuilder` gating:

| Tier | Key gates |
|------|-----------|
| FREE | views, trends; max 30d; no export |
| BASIC | + actions, impressions, comparison, promotion summary; max 30d |
| PREMIUM | + sources, search, funnel, CTR, conversion, export; max 90d |
| VIP | + audience, geography, popular hours, catalog, benchmark, recommendations; max 365d |

Admin/CITY_ADMIN access uses **business effective tier**, not admin VIP bypass.

## Permissions (verified)

- Dashboard: `ANALYTICS_VIEW` via `assertCanViewBusinessAnalytics`.
- Export: **`ANALYTICS_VIEW` + `ANALYTICS_EXPORT`** + PRO/VIP `reportExport`.
- Manager permission normalization: `ANALYTICS_EXPORT` implies `ANALYTICS_VIEW` at assignment time; export path still requires VIEW explicitly.

## Privacy thresholds (verified)

- Search queries: **≥3** (`MIN_SEARCH_QUERY_DISPLAY_COUNT`).
- Geography: **≥10** total views (`MIN_AUDIENCE_GEOGRAPHY_SAMPLE`).
- Benchmark peers: **≥5** excluding subject (Stage 6.6E).

## Performance architecture (verified)

- VIP 365 dashboard/report: **rollup-first** (`AnalyticsDailyMetric` / dimension rollups).
- No full 365d raw `AnalyticsEvent` scan when rollups exist.
- Report export: **one** `AnalyticsDashboardBuilder.build` per `buildBusinessAnalyticsReport`.

## Export security (verified)

- UTF-8 BOM, `;` delimiter, formula-injection prefix in `csv.util`.
- `Cache-Control: private, no-store` on export route.
- Filename: `qalago-analytics-{slug}-{start}_{end}.csv`.

## Defects found & fixed (Stage 6.6QA)

1. **Export without ANALYTICS_VIEW** — `exportCsv` only checked `ANALYTICS_EXPORT`. Fixed: require `assertCanViewBusinessAnalytics` first. Regression: `analytics-stage-6-6qa-final.spec.ts`.
2. **Fake 0% conversion** — `buildConversion` returned `rate: 0` when `views=0`. Fixed: `rate: null` via `viewToIntentConversionPercent`. DTO `AnalyticsConversionDto.rate` nullable; CSV skips null rate.

## Deferred (out of scope)

Email/push/WhatsApp/Telegram delivery, scheduler, PDF, report persistence, new metrics, monetization integrity, 6.7, APK QA.

## Verdict

**STAGE 6.6QA PASSED — ANALYTICS 360 CLOSED** (with two minimal hardening fixes above).
