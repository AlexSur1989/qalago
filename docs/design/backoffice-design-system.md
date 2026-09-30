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
- **Migration debt:** Not every screen migrated; tables/forms/dashboard partial-failure UX deferred to UXA.4/UXA.5/UXA.8.

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
- **Deferred:** Admin legacy **dashboard** (`confirmAction` / `window.confirm`); full monetization/catalog badge sweep; business-requests ModalDialog (separate pattern); reports staff role raw string; filter/table redesign (**UXA.4**).

## UXA.1 does NOT cover

Tables/filters (UXA.4), forms migration (UXA.5), location UX (UXA.6), dashboards (UXA.8), responsive pass (UXA.10), a11y closure (UXA.11), RU/KK visual QA (UXA.12), dark mode.

## Tests

`npm run test -w @qalago/brand` — CSS + icon registry contracts. Admin/Business vitest includes shell/nav emoji audit and nav icon resolution tests.
