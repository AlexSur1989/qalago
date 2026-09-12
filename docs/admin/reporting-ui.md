# Admin Reports UI (Stage 6.9.2.1)

## Routes (admin-web)

| Path | Report |
|------|--------|
| `/reports` | Обзор |
| `/reports/users` | Пользователи |
| `/reports/businesses` | Бизнесы |
| `/reports/cities` | Города |
| `/reports/categories` | Категории |
| `/reports/search` | Поиск |
| `/reports/activity` | Активность |
| `/reports/reviews` | Отзывы |
| `/reports/promotions` | Акции |
| `/reports/ads` | Реклама |
| `/reports/plans` | Тарифы |
| `/reports/moderation` | Модерация |
| `/reports/finance` | Финансы |
| `/reports/staff` | Staff |
| `/reports/staff/[userId]` | Staff detail |
| `/reports/staff/anomalies` | Staff anomalies |
| `/reports/audit` | Audit |
| `/reports/security` | Безопасность |
| `/reports/system` | Система |

Navigation visibility: `canViewReport(role, id)` in `apps/admin-web/lib/report-rbac.ts` (must match backend `REPORT_*` permissions).

## Filters

Query params: `from`, `to`, `cityId`, `categoryId`, `placement`, `plan`, …  
Default period: last 30 days. Max range: **366 days** (validated client-side).

CITY_ADMIN: city selector limited to assigned city; backend enforces scope.

## UI semantics

- **Null/unsupported metrics** → «Метрика пока недоступна», never `0`.
- **Loading** → skeleton KPI cards.
- **403** → forbidden state.
- **Search privacy** → explanation text; no sub-threshold queries in UI.
- **MFA** → «Не настроено — функция ещё не внедрена».
- **Export** → `GET /admin/reports/export` when `REPORT_EXPORT`; CSV filename includes report key and dates.

## Components

`apps/admin-web/components/reports/` — KPI grid, filter bar, charts (recharts), shared states.

## Known UI limitations

- User/business trend series not provided by API → empty/notes.
- Subcategory rollup unsupported (backend).
- Churn displayed as unavailable.
- Staff anomalies: structured cards (code, «Требует проверки», link to staff detail); no raw JSON dump.
