# QalaGo Backoffice Design System (UXA)

**Status:** UXA.1 foundation implemented. **Scope:** Admin Web + Business Web light theme only.

## Token source (canonical)

| File | Role |
|------|------|
| `packages/brand/qalago-theme.css` | Semantic colors, typography, spacing, radii, shadows, controls, icons, layout, focus, motion |
| `packages/brand/backoffice-primitives.css` | Shared focus, button/input/alert/tag baselines, typography helpers |
| `packages/brand/backoffice-shell.css` | Shared shell layout: sidebar, topbar, nav item geometry, page canvas, mobile drawer (UXA.2) |
| `packages/brand/icons/` (`@qalago/brand/icons`) | QalaGo Backoffice SVG icon components (UXA.3) |
| `packages/brand/backoffice-states.css` + `@qalago/brand/states` | System states — alerts, loading, skeleton, empty, error, access (UXA.9) |
| `packages/brand/backoffice-badges.css` + `@qalago/brand/badges` | Status badges — semantic tones (UXA.7) |
| `packages/brand/status` (`@qalago/brand/status`) | Shared status → label + tone (business lifecycle, plan tier, feature flags) |
| `packages/brand/backoffice-confirm.css` + `@qalago/brand/confirm` | Accessible confirm dialog + `backofficeConfirm` bridge (UXA.7) |
| `packages/brand/backoffice-tables.css` + `@qalago/brand/tables` | Tables, toolbars, search, filters, pagination (UXA.4) |
| `packages/brand/backoffice-forms.css` + `@qalago/brand/forms` | Form fields, controls, sections, actions, switch, upload surface, dirty helpers (UXA.5) |
| `packages/brand/backoffice-locations.css` + `@qalago/brand/locations` | Branch cards, hours rows, map frame (UXA.6) |
| `packages/brand/backoffice-dashboards.css` + `@qalago/brand/dashboards` | KPI cards, dashboard sections, summary/chart shells, usage progress (UXA.8) |
| `packages/brand/backoffice-responsive.css` | Shared breakpoints, shell/page/table/form/chart/modal responsive rules (UXA.10) |

Both apps import in order:

```css
@import '../../../packages/brand/qalago-theme.css';
@import '../../../packages/brand/backoffice-primitives.css';
```

App-specific layout/shell rules remain in `apps/admin-web/app/globals.css` and `apps/business-web/app/globals.css`.

## Brand colors

| Token | Value | Usage |
|-------|-------|--------|
| `--color-brand-primary` | `#00A8D6` | Primary actions, links, focus |
| `--color-brand-accent` | `#F3A100` | Highlights, premium emphasis (not default CTA) |

Legacy `--primary` and `--accent` alias the canonical brand tokens. **`--qz-gold` (`#fec50c`) is deprecated** — retained for reference only; do not use in new UI.

## Semantic palette

Success, warning, danger, and info use `--color-{name}` and `--color-{name}-soft` pairs. Domain status **presentation** (label + tone, no raw enum in UI) is **UXA.7** — see below.

## Typography

Montserrat via Next.js `--font-sans` with fallback `--font-sans-fallback`. Scale tokens: `--text-page-title-*`, `--text-section-title-*`, `--text-body-*`, `--text-label-*`, `--text-caption-*`, `--text-kpi-*`. Opt-in classes: `.page-title`, `.section-title`.

## Spacing

`--space-1` (4px) through `--space-12` (48px) on the 4/8/12/16/20/24/32/40/48 scale.

## Radii

Canonical: `--radius-xs` (8px), `--radius-md` (12px), `--radius-lg` (16px), `--radius-pill`. Legacy `--radius` → 16px, `--radius-sm` → 12px (existing components).

## Shadows

`--shadow-sm`, `--shadow-md`, `--shadow-lg`. Legacy `--shadow` → `--shadow-md`.

## Control heights

`--control-height-sm` 32px, `--control-height-md` 40px, `--control-height-lg` 48px. Opt-in `.form-control` for 40px fields.

## Iconography (UXA.3)

- **Source:** `packages/brand/icons` — typed React components (`QalaIcon`, `BackofficeNavIcon`), no external icon package, no runtime SVG string parsing.
- **Language:** 24×24 viewBox, stroke-first (~1.75), round caps/joins, **monochrome `currentColor`** (no brand hex inside SVG, no gradients).
- **Sizes:** `--icon-size-sm` 16px, `--icon-size-md` 20px (**canonical nav slot**), `--icon-size-lg` 24px (prominent header controls).
- **Accessibility:** decorative nav/shell icons `aria-hidden` + `focusable="false"`; icon-only controls keep visible text or `aria-label` on the control (not duplicated on the SVG).
- **Scope:** Authenticated Admin/Business **shell + nav metadata** use SVG only — **no emoji** in those surfaces. Charts/complex viz, locale copy, and user-generated content may still contain emoji elsewhere.
- **Admin maps:** `apps/admin-web/lib/admin-shell-icons.ts`. **Business maps:** `BUSINESS_NAV_ICONS` in `apps/business-web/lib/business-access.ts`.
- **Regression:** scoped emoji scan tests on shell/nav sources; nav icon resolution tests (no SVG path snapshots).

## Layout

`--sidebar-expanded` 260px, `--sidebar-collapsed` 72px, `--topbar-height` 64px, `--content-max` 1200px, page padding desktop/tablet/mobile tokens. Shell behavior unification: **UXA.2**.

## Breakpoints (documented only)

640 / 768 / **960** (admin shell collapse) / 1200 / 1440. Business mobile nav ~900px — align in **UXA.10**.

## Focus & motion

`--focus-ring-*` + `:focus-visible` in primitives. `--transition-fast` (150ms), `--transition-normal` (200ms). `prefers-reduced-motion` global reduction in primitives.

## Shell (UXA.2)

- **Dimensions:** `--sidebar-expanded` 260px, `--sidebar-collapsed` 72px (desktop collapse only on Business), `--topbar-height` 64px, `--content-max` 1200px, page padding tokens.
- **Responsive:** At **≤960px** both apps use **off-canvas drawer + backdrop** (no unlabeled Admin icon rail). `body.shell-drawer-open` locks background scroll.
- **Admin integration:** `/reports`, `/settings`, `/staff`, `/audit-logs` render inside `AdminAuthenticatedShell` + global `AdminShell`. Section subnav uses `.shell-section-subnav` (reports, settings).
- **Nav visibility helpers:** `apps/admin-web/lib/admin-shell-nav.ts` (Staff SUPER_ADMIN, Settings all admin-web roles, Platform tab SUPER_ADMIN, Audit `AUDIT_VIEW`).
- **Page header helper:** `BackofficePageHeader` (admin-web) — title, description, optional back link/actions.
- **Nav grouping:** **Flat nav** retained (no section labels) to avoid clutter.
- **Nav icons:** UXA.3 SVG slot (20px, centered via `.nav-icon` flex box).

## System states (UXA.9)

- **Source:** `@qalago/brand/states` + `backoffice-states.css`. Primitives: `BackofficeAlert`, `BackofficeSuccessState`, `BackofficeLoadingState` (page / section / inline), `BackofficeSkeleton` (line, title, card, table-row, kpi), `BackofficeEmptyState`, `BackofficeErrorState` (retry), `BackofficeAccessDenied`, `BackofficeFeatureUnavailable`, `BackofficeNotFoundState`.
- **Alerts:** Variants `success` | `warning` | `danger` | `info` | `neutral` via existing `.alert-*` token classes; **danger** → `role="alert"`, others → `role="status"` where appropriate. **No toast library** in UXA.9 — durable feedback uses inline alerts.
- **Access vs feature:** **Access denied** = missing permission (`BackofficeAccessDenied` / Business wrapper). **Feature unavailable** = platform flag off (`BackofficeFeatureUnavailable` / Team `businessTeamEnabled`). Logic unchanged.
- **Retry:** Secondary button, disabled while pending, no auto-retry loops.
- **Icons:** UXA.3 state glyphs (`check`, `alert-circle`, `alert-triangle`, `info`, `empty`, `lock`, `refresh`) — no emoji in state components.
- **i18n:** Business wrappers pass RU/KK copy from `useUi()`; Admin representative surfaces RU-first.
- **Migration debt:** Not every screen migrated; remaining non-dashboard surfaces may still use legacy `.kpi-grid` until swept.

## Status badges & confirmations (UXA.7)

- **Badge:** `BackofficeBadge` — props `label`, `tone` (`neutral` | `info` | `success` | `warning` | `danger`), optional `icon` (16px via UXA.3), `size` `default` | `compact`. Pill geometry, semantic soft background + foreground from UXA.1 tokens. **No emoji.**
- **Presentation rule:** Backend enum values stay unchanged. UI shows localized human labels + tone via domain helpers (`@qalago/brand/status`, `apps/admin-web/lib/audit-action-presentation.ts`, `staff-presentation.ts`, existing catalog/monetization label helpers). **Never** use raw `SCREAMING_SNAKE_CASE` as primary copy; unknown → safe fallback (e.g. «Неизвестное действие», «Неизвестный статус»).
- **Plan tiers (public names):** FREE → «Бесплатный», BASIC → «BUSINESS», PREMIUM → «PRO», VIP → «VIP» (`planTierPresentation`).
- **Feature flags:** ON → «Включено» / success; OFF → «Выключено» / neutral (`featureFlagPresentation`). Runtime semantics unchanged.
- **Business RU/KK:** Business lifecycle labels in shared status helper remain RU; Business Web membership/plan copy continues to use existing locale helpers where already wired.
- **Confirm:** `BackofficeConfirmDialog` (native `<dialog>`, `aria-labelledby` / `aria-describedby`, initial focus on **Cancel**, Escape when not pending, `pending` disables double-submit). Variants: `default`, `warning`, `danger`. Async entry: `backofficeConfirm()` via `BackofficeConfirmProvider` in both app roots. **No `window.confirm`** on migrated surfaces.
- **Destructive copy:** Title names action + target; `consequence` states irreversible or product-accurate side effect (delete location, revoke invite, lifecycle block, etc.).
- **Post-action feedback:** Success/error still via UXA.9 inline alerts / `BackofficeSuccessState` — no new toast layer.
- **Migrated (representative):** Admin — audit logs, staff list/detail, catalog businesses list/detail (badges + lifecycle confirm), moderation case actions, catalog location delete, monetization campaigns/creatives/payments confirms, platform team toggle. Business — locations set-primary/delete, onboarding cancel, menu/media/promotions delete, team invite revoke + member suspend/revoke.
- **Deferred:** Admin legacy **dashboard** (`confirmAction` / `window.confirm`); full monetization/catalog badge sweep; business-requests ModalDialog (separate pattern); reports staff role raw string.

## Tables / filters / search (UXA.4)

- **Primitives:** `@qalago/brand/tables` — `BackofficeTable*` (container, head/body/row/cell, `scope="col"`), `BackofficeTableToolbar`, `BackofficeSearchField`, `BackofficeFilterSelect`, `BackofficeFilterChip`, `BackofficePagination` (UXA.3 chevrons), `BackofficeTableEmpty` (no data vs filtered + reset), `useDebouncedValue` (300ms default for live search when adopted).
- **Density:** `normal` (catalog/management) | `compact` (audit, dense monetization). No user density toggle.
- **Visual:** Header muted background, row hover, numeric/actions alignment, horizontal scroll via `.bo-table-wrap`. UXA.1 tokens only.
- **Status cells:** UXA.7 `BackofficeBadge`; filter `<option value>` unchanged.
- **Empty vs filtered:** `BackofficeTableEmpty` + «Сбросить фильтры»; UXA.9 skeleton/error for table loads.
- **URL state:** Preserved on applications, claims, moderation (`page`, `status` query). Catalog businesses filters remain **local state** (API unchanged); client title search on loaded page only.
- **Debounce:** Explicit-submit search (menu) unchanged; hook available for future live search — do not debounce submit-button flows.
- **Responsive:** Desktop table + horizontal scroll on narrow; card/mobile conversion deferred **UXA.10**.
- **Migrated Admin:** catalog businesses, audit logs, staff, applications, claims, moderation cases, monetization campaigns, reports businesses table snippet.
- **Migrated Business:** menu (search/chips/empty), promotions list badges, messages inbox search, media grid unchanged (scope radios).
- **Deferred:** Admin dashboard monolith tables; legal/data-requests full pass; remaining `.data-table` / `.table` pages; reviews card layout; team list-as-cards.

## Forms (UXA.5)

- **Primitives:** `@qalago/brand/forms` + `backoffice-forms.css` — `BackofficeField` (label, required `*`, helper, error, `aria-describedby` / `aria-invalid`), `BackofficeInput` / `Textarea` / `Select`, `BackofficeCheckbox` / `Radio`, `BackofficeSwitch` (`role="switch"`), `BackofficeFormSection`, `BackofficeFormActions`, `BackofficeFieldGroup`, `BackofficeUploadSurface`. Hooks: `useFormDirty`, `useUnsavedChangesGuard` (`beforeunload` when dirty).
- **Field contract:** Label above control; required marker on label + `required` / `aria-required`; errors via `.bo-field-error` + `role="alert"` (not border-only). Disabled/read-only preserve UXA.1 control tokens (40px default, 32px compact where used).
- **Feedback:** Field validation → field error; server/general → `BackofficeErrorState`. Success → `BackofficeSuccessState` («Изменения сохранены» or domain copy). Submit: primary disabled + `aria-busy` while pending (UXA.9 inline loading pattern).
- **Dirty / unsaved:** Only on local-state forms where safe (Business settings, business profile). `beforeunload` when dirty; in-app cancel-with-dirty via UXA.7 confirm **deferred** on some surfaces.
- **Special types:** `inputMode="tel"` / `type="url"` / `inputMode="decimal"` presentation-only — **no** backend normalization changes. Native `<select>` only (no custom select library). Work-hours rows use same controls; **6.12A** Business vs BusinessLocation semantics unchanged.
- **Migrated Admin:** catalog business create/detail (core + taxonomy + catalog edit), platform feature row (`BackofficeSwitch`), staff MFA enrollment TOTP form.
- **Migrated Business:** settings (name), business profile + hours sections, locations create/edit (incl. `BusinessLocationField` address), promotions create/edit overlay, menu group/item create.
- **Deferred:** Admin staff `[id]` action panels; business-requests editable modals; media upload full `BackofficeUploadSurface`; menu/item edit overlays; onboarding/claim forms; monetization checkout; in-app dirty cancel on all routes.

## Location / geo (UXA.6)

- **Primitives:** `@qalago/brand/locations` + `backoffice-locations.css` — `BackofficeBranchCard`, `BackofficeLocationHoursGroup`.
- **Business vs branch:** UI copy treats **Business** as brand and **BusinessLocation** as physical branch; primary uses UXA.7 badge «Основной филиал» / KK.
- **Business Web:** sectioned create/edit; map pan + center pin; manual lat/lon; set-primary UXA.7 confirm; no DELETE (unchanged).
- **Admin:** `CatalogLocationsManager` — branch cards, UXA.5 form sections, set-primary/delete confirms; manual coordinates (no embedded map).
- **Invariants:** API, primary rules, city authority, geo derivation — **unchanged**. Physical QA **UXA.13**.

## Dashboards / KPI / statistics (UXA.8)

- **Primitives:** `@qalago/brand/dashboards` + `backoffice-dashboards.css` — `BackofficeKpiCard`, `BackofficeKpiGrid`, `BackofficeDashboardSection`, `BackofficeSummaryCard`, `BackofficeChartContainer`, `BackofficeProgress`; presentation helpers `formatKpiCount` / `formatKpiKzt` / `formatKpiPercent` (display only).
- **KPI hierarchy:** Value → label → secondary/trend → optional drilldown («Подробнее» / link row). Small decorative UXA.3 icon (opacity ~0.35); numbers stay focal (`tabular-nums`).
- **KPI contract:** Props only — no embedded analytics formulas. Loading skeleton, error (— + message, not fake zero), empty label when unknown.
- **Trend:** Only when caller supplies comparison (e.g. reports `previousValue`); direction arrow + text; neutral tone supported — not color-only.
- **Currency:** Canonical display `1 234 ₸` via existing formatters / `formatKpiKzt`; amounts unchanged.
- **Chart container:** Title, description, legend slot, loading/error/empty via UXA.9 states; chart implementation stays Recharts/custom SVG.
- **Partial failure (Business `/dashboard`):** Independent section fetches (analytics, plan, promotions, campaigns). One section error → `BackofficeErrorState` + retry; other sections still render. Global fatal only for missing auth/business context — not one `Promise.all` blanking the page.
- **Usage / limits:** `BackofficeProgress` with `aria-valuenow/min/max`; danger tone only when existing entitlements already flag over-limit.
- **Freshness:** Show «Обновлено …» only when API provides timestamp — no fabricated freshness.
- **Migrated:** Admin — dashboard KPI row, monetization overview KPIs, reports `ReportKpiCard` shell. Business — `/dashboard` (partial failure), `/statistics` (360 + chart shell), `/plan` usage summary, monetization overview KPIs.
- **Deferred:** Admin dashboard monolith split/routes; business monetization overview partial-failure parity; full dashboard sweep; chart semantic recolor audit.

## Responsive layout (UXA.10)

- **Source:** `backoffice-responsive.css` (imported after dashboards in both apps). **Shell collapse:** `≤960px` — off-canvas drawer, backdrop, body scroll lock (`shell-drawer-open`); no permanent 72px icon rail on mobile.
- **Breakpoints (canonical):** mobile `≤640` · tablet `641–959` · shell `≤960` · desktop `≥961` · wide `≥1200` · very wide `≥1440`. Legacy app rules (e.g. reports formerly `@900px`) normalized to **960** where they competed with shell.
- **Page headers:** `.page-header` / `BackofficePageHeader` stack title + actions on mobile; long titles wrap (`overflow-wrap`).
- **Topbar:** Menu + critical controls preserved; secondary `.user-meta` hidden `≤960` (Admin); Business shows `.topbar-entity-title` truncate + locale in `.topbar-locale`; touch targets ~44px for mobile menu icon.
- **Tables:** Horizontal scroll inside `.bo-table-wrap` / `.table-wrap` / `.data-table` min-width; toolbars stack at `≤640`; filters remain visible (wrap/scroll).
- **Forms:** UXA.5 `bo-form-grid--2` → 1 col at `≤640` (unchanged); responsive CSS adds legacy grid/card header wrap.
- **KPI grid (UXA.8):** 4 → 3 (`≤1439`) → 2 (`≤1023`) → 1 (`≤767`); value `clamp` prevents clipping.
- **Subnav:** Monetization/reports use `--scroll` modifier (horizontal scroll + wrap fallback); settings/legal wrap via shared subnav classes.
- **Modals/confirm:** Max height + internal scroll; action buttons stack on mobile.
- **Content width:** Default `page-content` max `--content-max` (1200); utilities `page-content--wide` (1600) / `page-content--fluid` for data-heavy exceptions (opt-in per page).
- **Maps/charts:** Map frame 100% width, capped height on mobile; charts `width:100%` + responsive SVG.
- **Physical browser QA:** **Deferred UXA.13** — UXA.10 = code/static contracts only.

## Accessibility (UXA.11)

**Target:** Practical WCAG 2.2 AA-aligned patterns where applicable. **Formal WCAG certification is not claimed.** Physical screen-reader / device browser QA **deferred to UXA.13**.

- **Styles:** `backoffice-a11y.css` — skip link focus ring, `.bo-sr-only`, closed mobile sidebar visibility, notification badge non-focusable, contextual link underline hint, `prefers-reduced-motion` hooks aligned with UXA.1.
- **Skip link:** `@qalago/brand/accessibility` **`BackofficeSkipLink`** → `#admin-main-content` / `#business-main-content` (Business label **RU/KK** via `shellSkipToMainContent`).
- **Landmarks:** One **`main`** per shell; **`header`** topbar; sidebar **`nav`** with `aria-label`; avoid redundant landmark nesting.
- **Headings:** Page-level **h1** via existing page headers; no product copy rewrites solely for tags.
- **Navigation:** `aria-current="page"` on active routes; decorative nav icons (`aria-hidden`); mobile menu **`aria-expanded`** + **`aria-controls`**; drawer **`useShellDrawerA11y`** — **`inert`** on `.shell-main`, initial focus in drawer, restore menu button on close, **Escape** unchanged.
- **Icon-only controls:** Named via visible text, **`aria-label`**, or linked label; decorative icons **`aria-hidden`**.
- **Button vs link:** Actions → **`button`**; navigation → **`Link`/`a`** (e.g. messages unread mark-read uses native **`button`**, not `role="button"` on **`article`**).
- **Tables (UXA.4):** **`th scope="col"`**; pagination **`nav`** + **`aria-current="page"`** on current meta; horizontal scroll inside table wrap — focus not clipped.
- **Forms (UXA.5):** Label ↔ control **`htmlFor`/`id`**; errors **`aria-describedby`** + **`aria-invalid`**; switch **`role="switch"`** + **`aria-checked`** + optional description id.
- **Dialogs (UXA.7):** Native **`<dialog>`** + **`aria-labelledby`/`aria-describedby`**; optional **`triggerRef`** focus restore on close.
- **Live regions (UXA.9):** **`role="alert"`** for critical errors; **`role="status"`** / polite live for save success — avoid duplicate/noisy regions.
- **Loading / empty:** Decorative skeletons hidden from AT where applicable; empty states readable without icon-only meaning.
- **KPI / progress (UXA.8):** KPI link/card accessible name; **`BackofficeProgress`** **`role="progressbar"`** + value min/max/now.
- **Charts:** Textual summary alongside SVG (`role="img"` + **`aria-label`** or sr-only data sentence) — chart not sole carrier of critical metrics.
- **Maps / locations (UXA.6):** Map labelled; manual coordinates remain; failure text visible.
- **Image alt:** Decorative → **`alt=""`**; informative when data exists — no fabricated descriptions.
- **Focus:** UXA.1 focus tokens on interactive controls; no positive **`tabIndex`** in shells; hidden collapsed drawer not tabbable on mobile (CSS + inert main while open).
- **Contrast / target size:** Obvious token risks documented in deferred debt; touch ~44px for shell icon triggers where feasible.
- **Language:** Business **`html lang`** follows locale layout; Admin unchanged.
- **Tests:** `@qalago/brand/accessibility/accessibility.contract.test.mjs` + Admin/Business **`backoffice-accessibility.test.ts`** (static/DOM contracts — **not** real screen-reader validation).

## Visual localization RU/KK (UXA.12)

**Scope:** Business Web **RU/KK** UI copy and layout stress; Admin remains **RU-first** (no full Admin localization).

- **Dictionaries:** `apps/business-web/lib/locale.ts` (`UI_LABELS.ru` / `UI_LABELS.kk`) + `presentation.ts` (status/plan/permission enums) + **`owner-visual-copy.ts`** (inline analytics/plan/monetization/login copy migrated off JSX).
- **Locale contract:** Cookie **`qalago_locale`**; invalid → **kk** product default; Business **`html lang`** from layout; switcher preserves persistence and routes — **unchanged**.
- **System vs user content:** System UI must be RU or KK per active locale; **business names, menu/review/promotion body, API `nameRu` plan catalog titles** are user/content — not translation defects.
- **Canonical terms (examples):** branch **`Основной филиал` / `Негізгі филиал`**; plan tiers **`Бесплатный/Тегін`**, **`Бизнес`**, **`PRO`**, **`VIP`**; notifications **`Уведомления` / `Хабарландырулар`** — reuse existing keys; do not invent page-local synonyms.
- **Hardcoded guard:** `hardcoded-ui-guard.ts` — Cyrillic product strings only in dictionary files (tighter than pre-UXA.12 `{…}` JSX exemption).
- **Long copy CSS:** `backoffice-i18n.css` — `overflow-wrap: anywhere` on nav, headers, table headers, badges, non-icon buttons; **no** `word-break: break-all` on ordinary labels; dialog/page-header stack on mobile (UXA.10 breakpoints).
- **Fallback:** Missing/invalid locale → **kk**; unknown enum → presentation mapper or em dash — not raw enum in UI where mapper exists.
- **Tests:** `locale-parity.test.ts` (RU/KK key parity), `uxa12-visual-localization.test.ts`, `@qalago/brand/i18n/i18n.contract.test.mjs`.
- **Deferred:** Full KK rewrite of legacy `____*` hash keys in `locale.ts` (large backlog); remaining mixed RU strings in KK dictionary → **POST-UXA debt** until swept.

## Physical browser QA (UXA.13 — partial, not closed)

**Method:** Cursor IDE Browser MCP (Chromium); local dev **`catalog-api` :3002**, Admin **:3001**, Business **:3003**; BFF dev-login where UI automation clicks were unreliable (fetch + navigation).

**Verified (representative):**

- Admin **Platform Admin** (`+77000000005`) — login via BFF, **`/dashboard`** KPI cards, moderation queue, skip link, mobile shell (~390), city picker, logout control present.
- Business **OWNER** (`+77000000002`) — login KK lead/onboarding link after fix; **`/dashboard`** KK shell, locale toggle, KPI grid, plan usage (VIP), skip link.
- **Stale `.next` dev cache** on long-running Admin/Business processes caused missing chunk / infinite loading — cleared by restart + `.next` delete (**environment**, not product regression).

**Not physically verified in this session:** full viewport matrix (320/768/1024/1440 all routes); **SUPER_ADMIN** / **CITY_ADMIN** / **MANAGER** walkthroughs; keyboard-only drawer focus sweep; Windows Narrator; measured contrast ratios; exhaustive modal/table/form/map/media routes; team feature-flag toggle; independent Admin+Business simultaneous sessions.

**UXA.13 fixes (Business KK):** login lead (`____c8191d`), onboarding link (`___c1d1fc`), dashboard KPI/link strings (`__79b074`, `__7__0205a6`, `__bb49cc`, `__19c279`, `__a144ec`, `___ee3b0e`, `__591eff`, `__24c04c`, `___c89390`); contract test **`uxa12-visual-localization.test.ts`**.

## UXA.1 does NOT cover

Dark mode, formal WCAG certification, full physical browser closure (UXA.13 — **ACTIVE**).

## Tests

`npm run test -w @qalago/brand` — CSS + icon registry contracts. Admin/Business vitest includes shell/nav emoji audit and nav icon resolution tests.
