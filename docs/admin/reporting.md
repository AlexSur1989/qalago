# Admin reporting (Stage 6.9.2)

Read-only administrative reporting under `/api/v1/admin/reports/*`. All routes use `@AdminStaffRoute()` and `@RequireStaffPermission(REPORT_*)`.

## Principles

- Queries and aggregates only — no domain mutations via report endpoints.
- CITY_ADMIN scope enforced in SQL via `ReportingScopeService` (never trust client-only filters).
- Search queries use `aggregateSearchQueries` (privacy threshold **≥ 3**).
- Activity intents use canonical `BUSINESS_INTENT_ACTION_EVENT_TYPES` (excludes `FAVORITE_REMOVE`).
- Finance uses immutable `Payment.amount` on `PAID` payments, not current catalog prices.
- **Staff MFA:** `mfaStatus: NOT_IMPLEMENTED` — no fabricated MFA compliance metrics.

## Filters

`from`, `to` (UTC, max **366** days), `cityId`, `citySlug`, `categoryId`, `subcategoryId`, `businessId`, `status`, `placement`, `plan`, `role`.

## Endpoints

| Path | Permission | Notes |
|------|------------|--------|
| `GET /admin/reports/overview` | `REPORT_OVERVIEW_VIEW` | Role-gated sections (staff/security/system omitted without permission) |
| `GET /admin/reports/users` | `REPORT_USERS_VIEW` | City scope via `preferredCityId`; DAU/MAU **unsupported** |
| `GET /admin/reports/businesses` | `REPORT_BUSINESSES_VIEW` | Paginated new businesses list |
| `GET /admin/reports/cities` | `REPORT_CITIES_VIEW` | Per-city rollups; finance block for FINANCE/SUPER_ADMIN |
| `GET /admin/reports/categories` | `REPORT_CATEGORIES_VIEW` | Subcategory rollup omitted (see limitations) |
| `GET /admin/reports/search` | `REPORT_SEARCH_VIEW` | Privacy-safe top queries |
| `GET /admin/reports/activity` | `REPORT_ACTIVITY_VIEW` | `AnalyticsDailyMetric` sums |
| `GET /admin/reports/reviews` | `REPORT_REVIEWS_VIEW` | |
| `GET /admin/reports/promotions` | `REPORT_PROMOTIONS_VIEW` | |
| `GET /admin/reports/ads` | `REPORT_ADS_VIEW` | Canonical placements; revenue if FINANCE/SUPER_ADMIN |
| `GET /admin/reports/plans` | `REPORT_PLANS_VIEW` | Tiers FREE/BASIC/PREMIUM/VIP; churn **unsupported** |
| `GET /admin/reports/finance` | `REPORT_FINANCE_VIEW` | |
| `GET /admin/reports/moderation` | `REPORT_MODERATION_VIEW` | No moderator leaderboard |
| `GET /admin/reports/staff` | `REPORT_STAFF_VIEW` | SUPER_ADMIN only (service guard) |
| `GET /admin/reports/staff/:userId` | `REPORT_STAFF_VIEW` | No tokens/secrets |
| `GET /admin/reports/staff/anomalies` | `REPORT_STAFF_VIEW` | Deterministic signals, wording “requires review” |
| `GET /admin/reports/audit` | `REPORT_AUDIT_VIEW` | SUPER_ADMIN only; paginated |
| `GET /admin/reports/security` | `REPORT_SECURITY_VIEW` | SUPER_ADMIN only; summaries only |
| `GET /admin/reports/system` | `REPORT_TECH_VIEW` | No secrets; redis/queue null unless wired |
| `GET /admin/reports/export?report=&format=csv` | `REPORT_EXPORT` | Aggregate CSV; audited via audit log metadata |

## Performance

Prefer `AnalyticsDailyMetric` / `AnalyticsDailyDimensionMetric` and Prisma aggregates; avoid long-range raw `AnalyticsEvent` scans.

## Limitations

- No platform-wide DAU/MAU without a canonical activity definition.
- Subcategory reporting not aggregated in 6.9.2.
- Export audit uses `PLAN_CHECKOUT` action with `metadata.reportExport` until dedicated audit enum exists.
- Redis/queue health placeholders.

See also: [report-access-matrix.md](./report-access-matrix.md), [reporting-ui.md](./reporting-ui.md), [staff-oversight.md](../security/staff-oversight.md).
