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
- `apps/mobile/test/core/app_theme_test.dart`

## Manual APK checklist

**Consumer:** Home, Categories, Search, Map, Favorites, Profile, Business detail, Promotions — background, cards, buttons, text hierarchy, numbers.

**Auth:** DEV Login, OTP/social — primary/secondary buttons, inputs.

**Owner:** Dashboard, profile, catalog, promotions, photos, statistics, team, plan, settings — same system as consumer.

**States:** loading, empty, error, disabled, dialog, bottom sheet — consistent styling and contrast.
