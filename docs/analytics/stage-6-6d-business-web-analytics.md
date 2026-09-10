# Stage 6.6D — Business Web Analytics 360

Business Web statistics page (`/statistics`) aligned with backend **6.6A / 6.6A.1 / 6.6B** and Flutter **6.6C**. API is the single source of truth for capabilities, locked sections, effective range, and metrics.

## Page hierarchy

1. **Header** — title «Статистика», business name, API `headline`, links to ad stats and dashboard  
2. **Period chips** — from `capabilities.maxDays` (7/30; +90 PRO; +365 VIP); syncs to `effectiveRange.days` when backend clamps  
3. **Compact upgrade** — one block from `primaryUpgradeMessage` / `lockedSections`  
4. **Export CSV** — when `reportExport` + `ANALYTICS_EXPORT` (owners always)  
5. **Обзор** — views, impressions (BUSINESS+), intent actions, CTR/conversion (PRO+)  
6. **Динамика** — views trend; actions trend when allowed  
7. **Сравнение** — period comparison (BUSINESS+)  
8. **Привлечение** — sources, search queries, aggregate funnel + CTR/conversion (PRO+)  
9. **Аудитория** (VIP) — new/returning view shares, visitor/session metrics, geography buckets, popular hours (by hour only)  
10. **Контент** — promotions (summary BUSINESS+, breakdown PRO+), catalog (VIP)  
11. **Сравнение с категорией** (VIP) — anonymous benchmark  
12. **Рекомендации** (VIP) — backend cards only  

## Plan visibility

| Capability | FREE | BUSINESS | PRO | VIP |
|------------|------|----------|-----|-----|
| Views / trend | ✓ | ✓ | ✓ | ✓ |
| Actions / impressions / comparison / promo summary | — | ✓ | ✓ | ✓ |
| Sources / search / funnel / CTR / export | — | — | ✓ | ✓ |
| Audience / geo / hours / catalog / benchmark / recommendations | — | — | — | ✓ |

UI uses `capabilities` and `lockedSections` — no local tier matrix.

## Metric semantics

- **Целевые действия** — canonical intent total from API (excludes `promotionViews` in breakdown)  
- **Поиск** — «Что ищут пользователи» / «Переходов» (neutral; backend threshold ≥3)  
- **Аудитория** — shares of classified **views**, not unique people  
- **Visitors/sessions** — period distinct when present; otherwise daily-sum approx with explicit label  
- **Promotions/catalog** — when `actionsAvailable === false`, copy «Действия … не измеряются», never «0»  

## Export

- **PRO + VIP** via `capabilities.reportExport`  
- Manager: `ANALYTICS_EXPORT` required (UX mirror; backend enforces)  
- 403 → friendly Russian message  

## Locked UX

Single contextual upgrade card; section-level `LockedCard` with «Посмотреть тарифы» → `/plan`.

## Responsive

KPI grid, `table-scroll` wrappers, flexible button rows — desktop/tablet/narrow browser.

## Tests

`apps/business-web/lib/analytics-utils.test.ts` — tier caps, export gating, funnel, legacy normalize, intent labels.

## Key files

- `apps/business-web/app/statistics/page.tsx`  
- `apps/business-web/components/analytics-360-dashboard.tsx`  
- `apps/business-web/lib/analytics-utils.ts`  
- `apps/business-web/lib/api.ts` (`AnalyticsDashboard` types)  

## Deferred

- Promotion/catalog item titles: ID fallback unless single `listPromotions` join  
- Weekday popular-times heatmap (backend rollup gap)  
- Reviews analytics (not in DTO)  

## Manual QA

- [ ] FREE: views only, upgrade, no export  
- [ ] BUSINESS: actions, impressions, comparison, promo summary  
- [ ] PRO: sources, search, funnel, export with permission  
- [ ] VIP: audience, geo, hours, catalog, benchmark, recommendations, 365d  
- [ ] Manager without export permission: no export button  
- [ ] Empty views: single empty state  
- [ ] Narrow width: no horizontal overflow on tables  
