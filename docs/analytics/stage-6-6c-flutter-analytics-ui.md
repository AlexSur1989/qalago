# Stage 6.6C — Flutter Owner Analytics 360 UI

Mobile owner statistics screen aligned with backend Stages **6.6A**, **6.6A.1**, and **6.6B**. The API is the only source of truth for capabilities, locked sections, effective range, metrics, and gating.

## Screen hierarchy

**Route:** Owner cabinet → Статистика (`OwnerAnalyticsScreen`)

1. **Header** — business title, optional API `headline`, horizontal period chips
2. **Compact upgrade card** — at most one hint from `lockedSections` / tier (CTA: «Посмотреть тарифы» → `/owner/plan`)
3. **Export CSV** — visible only when `capabilities.reportExport` and manager has `ANALYTICS_EXPORT` (owners always allowed)
4. **Обзор** — summary grid, period comparison (BASIC+), trend chart, intent actions breakdown
5. **Привлечение** (PRO+) — sources, search queries, aggregate funnel (impressions → views → actions)
6. **Аудитория** (VIP) — new/returning view shares, visitor/session metrics, geography buckets, popular hours (by hour only)
7. **Контент** — promotions (BASIC summary, PRO+ breakdown), catalog (VIP)
8. **Сравнение с категорией** (VIP) — anonymous benchmark
9. **Рекомендации** (VIP) — deterministic backend cards only

## Plan visibility (UI follows `capabilities`)

| Area | FREE | BASIC (Бизнес) | PRO | VIP |
|------|------|----------------|-----|-----|
| Views + trend | ✓ | ✓ | ✓ | ✓ |
| Actions / impressions | — | ✓ | ✓ | ✓ |
| Period comparison | — | ✓ | ✓ | ✓ |
| CTR / funnel / sources / search | — | — | ✓ | ✓ |
| Export CSV | — | — | ✓ | ✓ |
| Audience / geography / hours / catalog / benchmark / recommendations | — | — | — | ✓ |

Period chips derive from `capabilities.maxDays`: 7 and 30 for all; +90 for PRO+; +365 for VIP. If `effectiveRange.days` differs from the selected chip (e.g. after downgrade), the UI syncs to the effective value.

## Metric labels (Russian)

- **Просмотры карточки** — `overview.views`
- **Показы** — `overview.impressions` (BASIC+)
- **Целевые действия** — intent total (not promotion views)
- **CTR** — `overview.ctr` (PRO+)
- **Конверсия в действие** — view → intent action (PRO+)
- **Новые / вернувшиеся посетители** — share of classified **views**, not unique people
- Search rows: «N переходов» when API returns transition count

## Locked UX

- No per-section upgrade spam; one compact card when upgrade is relevant
- Locked metrics are **not** rendered as zero
- Inline text hints in Привлечение when a subsection is locked

## Export (PRO + VIP)

- Gated by `reportExport` + `ANALYTICS_EXPORT` for managers
- 403 → friendly snackbar
- No VIP-only hardcoding in UI

## Null / unavailable semantics

- Missing overview fields → hidden tiles (not «0»)
- `actionsAvailable: false` on promotions/catalog → neutral copy, never «0 действий»
- Rates: no NaN/Infinity; `—` when null

## Deferred

- **Reviews analytics** — not in dashboard DTO; not fabricated in Flutter
- **Popular times by weekday** — not shown (rollup gap); hour pattern only
- **Business Web** redesign — out of scope (6.6D not started)

## Manual QA checklist (APK)

Owner → Кабинет → Статистика:

- [ ] FREE: views + trend; no actions/impressions/CTR; upgrade card
- [ ] BASIC: actions, impressions, comparison, promotion summary; no sources/search
- [ ] PRO: sources, search, funnel, export (with permission), promotion breakdown
- [ ] VIP: audience, geography, popular hours, catalog, benchmark, recommendations, 365-day period
- [ ] Period switch reloads data; pull-to-refresh works
- [ ] Narrow width (~320dp) without overflow
- [ ] Empty state when views = 0
- [ ] Error + retry
- [ ] No raw null/NaN in UI
- [ ] Manager without `ANALYTICS_EXPORT`: no export button

## Key files

- `apps/mobile/lib/features/owner/presentation/owner_analytics_screen.dart`
- `apps/mobile/lib/features/owner/presentation/widgets/owner_analytics_widgets.dart`
- `apps/mobile/lib/features/owner/owner_analytics_utils.dart`
- `apps/mobile/test/owner/owner_analytics_test.dart`
