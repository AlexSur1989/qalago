# Mobile UI design system consistency

QalaGo Flutter apps share one **Material 3** theme (`AppTheme.light`) and `QalagoTheme` context extensions. Screens should prefer theme tokens over one-off colors.

## Color usage

| Role | Token |
|------|--------|
| Brand primary (CTA, links) | `colorScheme.primary` (`AppTheme.kzBlue`) |
| On primary | `colorScheme.onPrimary` |
| Accent / FAB | `colorScheme.secondary` (`AppTheme.kzGold`) |
| Screen background | `scaffoldBackgroundColor` → `AppTheme.background` |
| Cards, AppBar, inputs fill | `colorScheme.surface` |
| Primary text | `colorScheme.onSurface` |
| Secondary / captions | `colorScheme.onSurfaceVariant` |
| Borders | `colorScheme.outline` / `outlineVariant` |
| Errors | `colorScheme.error` |
| Success / warning (status) | `AppSemanticColors.success` / `.warning` via `context.successColor` |

**Hardcoded color policy:** `AppTheme.kzBlue` / `kzGold` remain brand constants wired into `ColorScheme`. Avoid new raw `Colors.*` or `Color(0xFF…)` for UI chrome. Exceptions: photo overlays (black scrims), map tiles, ad brand assets, third-party login artwork.

## Typography roles

Use `TextTheme` + extensions (`theme_extensions.dart`):

- Screen / section titles → `titleLarge` / `sectionTitleStyle`
- Card titles → `cardTitleStyle`
- Body → `bodyMedium`
- Secondary → `bodySecondaryStyle` / `captionStyle`
- Metrics / stats → `metricValueStyle`
- Prices (primary) → `pricePrimaryStyle`
- Buttons → `labelLarge` (via button themes)

Do **not** flatten hierarchy by using one text color everywhere.

## Buttons

| Priority | Widget |
|----------|--------|
| Primary CTA | `FilledButton` / `.icon` |
| Secondary | `OutlinedButton` |
| Tertiary | `TextButton` |
| Destructive | `FilledButton` with `colorScheme.error` / `onError` |
| Icon-only | `IconButton` |

Themes: min height 48, radius 16, disabled states with readable contrast. Do not override `backgroundColor: AppTheme.kzBlue` unless merging extra layout (e.g. `minimumSize`).

## Cards

Default `Card` uses `CardTheme`: white surface, radius **20**, elevation 2. Prefer `Card` over ad-hoc `BoxDecoration` duplicates.

## Inputs

`InputDecorationTheme`: filled white surface, radius 16, focus ring primary, error borders semantic.

## Numbers / prices / metrics

- Primary metric → `metricValueStyle` / `headlineSmall` + `onSurface`
- Secondary unit → `bodySecondaryStyle`
- Trend up/down → `successColor` / `colorScheme.error` (not random green/red shades)

## Navigation

Consumer shell tabs: selected `primary`, unselected `onSurfaceVariant`, labels `labelMedium`. Owner drawer: same primary for selected labels and badge circles.

## Dialogs / bottom sheets

`DialogTheme` / `BottomSheetTheme`: surface background, radius 20, theme action buttons (TextButton cancel + FilledButton confirm).

## Loading / empty / error

- Loading → `LoadingView` / `CircularProgressIndicator` (theme primary)
- Error → `ErrorView` (card + tonal retry)
- Empty → shared empty patterns with `captionStyle`

## Allowed exceptions

- Business detail / photo viewer: black or transparent AppBar over media
- Map: platform map styling
- Sponsored / VIP ad creatives: campaign artwork colors
- DEV Login panel: bordered container using `primarySurfaceTint`

## Responsive rules

Use `LayoutBuilder`, `Wrap`, `Flexible` for &lt;360dp widths; avoid horizontal overflow on button rows and stat grids.

## Key files

- `apps/mobile/lib/core/theme/app_theme.dart`
- `apps/mobile/lib/core/theme/theme_extensions.dart`
- `apps/mobile/lib/core/theme/app_spacing.dart`
- `apps/mobile/lib/shared/widgets/qalago_search_field.dart`
- `apps/mobile/test/core/app_theme_test.dart`

## Final screen-by-screen cleanup (2026-09-10)

**Screens audited:** 52 presentation screens under `apps/mobile/lib/features/**` plus shared widgets (cards, city picker, empty states, search).

**Categories of changes**

- Replaced routine `Color(0xFF…)` / `Colors.grey|black` UI chrome with `AppTheme` tokens (`textMuted`, `surfaceSubtle`, `borderSubtle`, `primaryTint`, open/closed status) and `ColorScheme` roles.
- Unified **search fields** via `QalagoSearchField` + `context.qalagoSearchDecoration` on Home (tap-through), Categories, Search AppBar, Promotions.
- Owner cabinet + monetization: greys/oranges/blues on dashboards, team, plan, campaigns aligned to the same tokens and semantic colors.
- Profile, auth (non-brand), favorites, onboarding forms: secondary text and borders migrated off raw greys.
- Promotions: category chips and promo cards use `colorScheme` for selected/unselected and surfaces.

**Search field standard**

- Filled `surface`, radius `AppTheme.inputRadius`, prefix search icon `onSurfaceVariant`, soft border `softBorderColor`, focus ring `primary` 2px, optional clear suffix — see `qalago_search_field.dart`.

**Intentional remaining hardcoded colors (~100 `Colors.*`, ~36 hex literals in lib)**

| Area | Why kept |
|------|----------|
| `app_theme.dart` | Source of truth / `ColorScheme` construction |
| Home / business detail / photos | Hero gradients, scrims, white text/icons on media, `barrierColor` |
| Map | Pin clusters, sheet shadows, map-adjacent controls |
| Ads (VIP / sponsored) | Campaign creative and label contrast |
| Auth login | Google / social brand assets |
| Owner gallery menu on photos | White icon on dark thumbnail overlay |
| Drawer header on brand blue | `Colors.white` on `AppTheme.kzBlue` (const header) |
| Rating star | `Colors.amber` on business detail |

**Typography:** Screen-level `TextStyle(` count remains where roles are explicit (metrics, moderation hints, ad copy); prefer `QalagoTheme` extensions for new work.

**Responsive:** Existing `LayoutBuilder` / narrow tests retained; `BusinessCard` @320px in `app_theme_test.dart`.

## Manual APK checklist

**Consumer:** Главная, Категории, Поиск, Карта, Избранное, Профиль, Бизнес, Акции, Каталог, Фото, Отзывы — background, title, cards, button hierarchy, primary/secondary text, numbers, icons, fields, chips, contrast @320dp.

**Auth:** Login, DEV Login — theme buttons/inputs; Google/Apple branding unchanged.

**Owner:** Dashboard, профиль, каталог, акции, фото, отзывы, статистика, команда, тариф, монетизация, настройки — KPI cards, forms, empty/error same tokens as consumer.

**States:** loading (`LoadingView`), empty, error (`ErrorView`), disabled buttons, destructive dialogs, bottom sheets (city picker) — surface/radius/actions from theme.
