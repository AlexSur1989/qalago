# Stage 6.6F — Analytics 360 reporting & CSV export

## Export entitlement (Stage 6.6B)

| Plan | Export |
|------|--------|
| FREE / BASIC | No |
| PREMIUM (PRO) | Yes + `ANALYTICS_EXPORT` for managers |
| VIP | Yes + `ANALYTICS_EXPORT` for managers |

Backend is authoritative; UI checks are UX only.

## Architecture

- **`AnalyticsBusinessReportBuilder`** — `buildBusinessAnalyticsReport`, `buildWeeklyReport`, `buildMonthlyReport`.
- Builds **`AnalyticsDashboardBuilder`** once per report (rollup-first, same caps as dashboard).
- **`buildAnalyticsExportCsv(report)`** — serializes report; no independent metric math.
- **No HTTP `/report` endpoint** in 6.6F (service-level foundation for CSV + future scheduler).

## Report types & completed periods

| Type | Range |
|------|--------|
| CUSTOM | Last N local days ending today (clamped by plan max days) |
| WEEKLY | Previous completed Mon–Sun in city timezone |
| MONTHLY | Previous completed calendar month |

Example: reference Wed 2026-09-16 → weekly **2026-09-07 … 2026-09-13** (not partial current week).

## Timezone

`Business.city.timezone` → local `metricDate` ranges (Stage 6.6A semantics).

## Report payload (`schemaVersion: 1`)

- `business` — id, name, city, category (owner context only)
- `period` / `previousPeriod` metadata
- `dashboard` — capability-filtered dashboard JSON
- `summary` — deterministic Russian sentences (non-AI, no causal claims)

## CSV

- Sections: overview, aggregate funnel, comparison, sources, search, audience, geography, promotions, catalog, popular hours, benchmark, recommendations, trends.
- Delimiter: **semicolon** (`CSV_DELIMITER`).
- Encoding: **UTF-8 with BOM** for Excel RU/KZ.
- Security: formula injection prefix on `=`, `+`, `-`, `@`.
- Filename: `qalago-analytics-{slug}-{start}_{end}.csv`
- Headers: `Content-Type: text/csv; charset=utf-8`, `Cache-Control: private, no-store`

## Privacy

No peer IDs, visitor hashes, raw queries below threshold, or precise GPS in export.

## Performance

Single dashboard build per export/report; no extra raw event scans for 90/365d.

## Deferred

Email, push, WhatsApp/Telegram delivery, cron scheduler, PDF, persisted report storage, Stage **6.6QA**.
