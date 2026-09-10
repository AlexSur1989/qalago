# Mobile navigation & back behavior

QalaGo uses **GoRouter** with a **ShellRoute** for consumer tabs and **root navigator** routes for owner/onboarding.

## Architecture

| Layer | Routes |
|-------|--------|
| Shell (bottom nav) | `/home`, `/categories`, `/categories/:id`, `/map`, `/favorites`, `/profile/*`, `/search`, `/promotions`, `/business/:id`, catalog/photos |
| Root | `/login`, `/owner`, `/owner/*`, `/business/*` onboarding, `/invite/:token`, `/admin` |

Business opens use **`context.push`** via `openBusiness()` so back returns to the previous shell screen.

## Root screens (no back arrow)

Bottom-tab destinations when opened as tab roots:

- Главная, Категории, Карта, Избранное, Профиль

They use in-screen headers, not nested AppBar back.

## Nested consumer screens

| Screen | Back behavior |
|--------|----------------|
| Search | `pop` or fallback `/home` |
| Category list | `pop` or fallback `/categories` |
| Business detail | `pop` or **source-based fallback** (search/map/favorites/…) |
| Catalog / photos | `pop` or fallback `/business/:id` |

### Deep link fallback (business detail)

When `canPop == false`, `qalagoPopBusinessDetail()` uses `?source=` from the route:

| Source | Fallback |
|--------|----------|
| SEARCH | `/search` (+ `q` when known) |
| CATEGORY | `/categories` |
| MAP | `/map` |
| FAVORITES | `/favorites` |
| PROMOTIONS | `/promotions` |
| Other | `/home` |

## Owner flow

- **Root:** `/owner` (dashboard) — no back to consumer unless drawer «На главную».
- **Nested owner screens:** `pop` or fallback **`/owner`** via `qalagoOwnerPopOrGo()` / `OwnerScaffold` leading.
- Monetization/onboarding uses `push`; confirm screens may `go` to orders (replacement).

## Auth

- `/login` redirect after success → `redirect` query or `/home` / `/owner`.
- Do not `pop` to login after successful auth when router replaced the stack.
- Invite accept → `go('/owner')` (invite not in back stack).

## Modals

- **Dialog:** system Back closes dialog (Flutter default).
- **Bottom sheet:** dismisses sheet first.
- **Fullscreen gallery:** `Navigator.push` + AppBar back / PopScope.

## Close vs back

- **BackButton** — previous route (`pop` / safe fallback).
- **Close (X)** — modals/fullscreen flows only (gallery uses AppBar back on black scrim).

## Helpers

`apps/mobile/lib/shared/navigation/navigation_utils.dart`:

- `qalagoPopOrGo`
- `qalagoPopBusinessDetail`
- `qalagoOwnerPopOrGo`
- `qalagoBackLeading`
- `consumerFallbackRoute`

## Unsaved forms

No global confirmation added. Existing forms keep current save/discard behavior.

## Manual APK QA

See checklist in spec: consumer chains (categories, search, map, favorites, promotions), profile settings, auth back, owner nested screens, dialog/sheet back, fullscreen photos.

## Tests

`apps/mobile/test/navigation/navigation_utils_test.dart`
