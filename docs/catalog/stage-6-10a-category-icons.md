# Stage 6.10A — Category icon system & home category UI

## Data model

- Reuses Prisma `Category.icon` and `Subcategory.icon` (nullable string URLs/paths).
- Consumer API adds **`iconUrl`** as a read alias of `icon` (backward compatible).

## Consumer UX

- Home: compact icon grid, label below icon, «Ещё» opens full categories (UI-only, not a DB category).
- Full categories / subcategories: same tile pattern with fallback when `iconUrl` is null.

## Admin

- Category and subcategory tables: preview, upload (PNG/JPEG/WebP via existing `POST /uploads`), remove icon.

## Apps

- **Flutter** (`apps/mobile`): `CategoryIconTile`, home slice (`sortOrder` list unchanged).
- **Consumer web** (`apps/consumer-web`, port 3005): matching grid and routes.

## Future

- Replace placeholder fallbacks with canonical 3D icon asset set (1024² WebP).
- Optional CDN resize params for tile sizes.
