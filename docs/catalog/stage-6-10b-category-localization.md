# Stage 6.10B — Category localization & consumer web parity

## Data model

- `Category.nameRu`, `Category.nameKk` (required).
- `Category.title` — backward-compatible alias; kept equal to `nameRu` on writes.
- `Subcategory.nameRu` / `nameKk` — unchanged (Stage 6.8C.1).

## API

Public `GET /categories` items include: `id`, `slug`, `nameRu`, `nameKk`, `title`, `icon`, `iconUrl`, `sortOrder`, `isActive`.

Clients pick display strings locally (`kk` → `nameKk`, else `nameRu`; fallback chain includes `title`).

## Flutter

- `CategoryModel.displayName(localeCode:)`
- `appLocaleCodeProvider` (`ru` | `kk`) — profile language switch can override later.

## Consumer Web

- Cookie `qalago_locale` (`ru` | `kk`), header switcher.
- `/categories/[id]?sub=` → subcategory filter + `GET /businesses` list.
- `/businesses/[id]` minimal detail scaffold.

## Icons (6.10A)

Unchanged: `Category.icon`, upload pipeline, grids, fallbacks.
