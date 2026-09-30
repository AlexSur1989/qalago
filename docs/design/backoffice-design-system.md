# QalaGo Backoffice Design System (UXA)

**Status:** UXA.1 foundation implemented. **Scope:** Admin Web + Business Web light theme only.

## Token source (canonical)

| File | Role |
|------|------|
| `packages/brand/qalago-theme.css` | Semantic colors, typography, spacing, radii, shadows, controls, icons, layout, focus, motion |
| `packages/brand/backoffice-primitives.css` | Shared focus, button/input/alert/tag baselines, typography helpers |
| `packages/brand/backoffice-shell.css` | Shared shell layout: sidebar, topbar, nav item geometry, page canvas, mobile drawer (UXA.2) |

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

Success, warning, danger, and info use `--color-{name}` and `--color-{name}-soft` pairs. Domain status mapping (badges, enums) is **UXA.7** — do not map enums in UXA.1.

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

## Icon sizes (UXA.3)

`--icon-size-sm` 16px, `--icon-size-md` 20px (nav), `--icon-size-lg` 24px (header/empty). Emoji nav not replaced in UXA.1.

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
- **Nav grouping:** **Flat nav** retained (no section labels) to avoid clutter; emoji placeholders until UXA.3.

## UXA.1 does NOT cover

Icons (UXA.3), tables/filters (UXA.4), forms migration (UXA.5), location UX (UXA.6), status badges (UXA.7), dashboards (UXA.8), loading/empty states (UXA.9), responsive pass (UXA.10), a11y closure (UXA.11), RU/KK visual QA (UXA.12), dark mode.

## Tests

`npm run test -w @qalago/brand` — CSS token contract (no full-file snapshots).
