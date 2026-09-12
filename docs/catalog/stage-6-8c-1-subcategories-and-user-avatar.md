# Stage 6.8C.1 — Subcategories & user profile photo

## Previous category model

- **Business → Category:** many-to-one (`Business.categoryId`), single primary category per business.
- **CategoryCityOrder:** per-city sort/hide only; not a business M2M.

## New models

- **Subcategory:** global taxonomy under `Category` (`categoryId`, unique `(categoryId, slug)`, `nameRu`, `nameKk`, `sortOrder`, `isActive`).
- **BusinessSubcategory:** optional M2M (`businessId`, `subcategoryId` composite PK).
- **User.avatarUrl:** server-owned path (`/uploads/{uuid}.webp`); not client-writable via `PATCH /users/me`.

## Compatibility

- Businesses with **zero** subcategories remain valid in category list, search, map, recommended, ads, favorites, detail.
- `subcategoryId` query param is **optional**; omitting it preserves pre-6.8C.1 list semantics.
- Category business counts still mean businesses in the **category**, not “classified only”.

## Feature flag

- Key: **`subcategoriesEnabled`** (typed in `@qalago/shared-types`, seeded global **OFF**).
- City overrides via existing `CityFeatureFlagOverride` (e.g. Uralsk ON, Aktobe inherits global OFF).
- Flag OFF: no subcategory UI; API/schema/data remain.

## API (additive)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/categories/:categoryId/subcategories` | Public active subs |
| GET | `/businesses?subcategoryId=` | Validates parent `categoryId` when both set |
| PATCH | `/businesses/:id` | Optional `subcategoryIds[]` (owner/manager `BUSINESS_PROFILE_EDIT`) |
| PATCH | `/admin/businesses/:id/taxonomy` | Admin `categoryId` + `subcategoryIds` |
| Admin | `/admin/categories/:categoryId/subcategories` | CRUD list/create |
| Admin | `/admin/subcategories/:id` | Update / deactivate / delete (guarded) |
| POST | `/users/me/avatar` | Multipart `file`; session user only |
| DELETE | `/users/me/avatar` | Clears avatar |

## Parent validation

- Subcategory `categoryId` must match business `categoryId` on assign.
- Category change without `subcategoryIds`: invalid cross-category links are **reconciled** (removed).

## Search / sort / ads

- Subcategory is an extra **filter**; recommended/popular/rating/nearest unchanged in ranking semantics.
- **CATEGORY_TOP / CATEGORY_BOOST** remain category-scoped; sponsored business must still match selected subcategory filter on client/API list.

## Avatar security

- Magic bytes, dimension caps, **sharp** normalize to 512×512 WebP, EXIF stripped via re-encode.
- Rate limit `avatar:{userId}`; no `userId` in body (IDOR-safe).

## Future

- **6.8D:** provider avatar only if no custom upload; never overwrite custom on re-login.
- **Subcategory ads:** not sold in this stage; campaigns stay category-scoped.

## Enable rollout

1. Deploy backend + seed taxonomy.
2. `PATCH /admin/release/feature-flags` or city override for pilot city.
3. Ship mobile/web with flag-aware UI.

## Map discovery scope (6.8C.1.2)

| Entry | Scope | API fetch |
|-------|--------|-----------|
| Bottom nav **Карта** | none | city-wide |
| Category **На карте** + «Все» | `categoryId`, `subcategoryId=null` | all businesses in category |
| Category **На карте** + sub chip | `categoryId` + `subcategoryId` | filtered (sub only if `subcategoriesEnabled`) |

Tapping bottom-nav **Карта** clears category discovery scope. Category → Map uses `push` and keeps scope until user opens global Map or another tab that clears it.
