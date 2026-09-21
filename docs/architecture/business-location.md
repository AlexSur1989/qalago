# BusinessLocation architecture (Stage 6.12A)

## Model split (accepted A.0)

| Entity | Role |
|--------|------|
| **Business** | Brand / organization identity: title, slug, taxonomy, plan, membership, reviews, favorites, promotions, catalog, ads, analytics |
| **BusinessLocation** | Physical branch / venue: city, address, coordinates, hours, branch contacts |

Relationship: **Business 1 → N BusinessLocation**.

## Stage 6.12A.1 (database foundation)

- **`BusinessLocation` table** added with physical fields mirroring `Business` (address, lat/lng, `location` geography, `locationSource`, `workHours`, contacts).
- **`isPrimary`** with partial unique index: at most one primary row per `businessId` (no rows until A.2 backfill).
- **PostGIS:** isolated trigger `business_location_derive_location_from_coordinates` + GiST index on `BusinessLocation.location`.
- **Legacy `Business` physical columns unchanged** and remain authoritative for all APIs and map queries until later substages.
- **No data backfill** in A.1; **no public API** for locations yet.

## Stage 6.12A.2 (1:1 backfill)

- Migration **`20260921190000_stage_6_12a2_business_location_backfill`**: idempotent `INSERT … SELECT` from `Business` where no `BusinessLocation` exists yet.
- Copies: `cityId`, `address`, lat/lng, `locationSource`, `workHours`, phone/social/website; **`isPrimary = true`**; deterministic `id` prefix `bl` + md5 fragment.
- **Does not UPDATE `Business`** — legacy physical columns remain authoritative for APIs and map until A.3+.
- **Geography:** derived on insert via BusinessLocation trigger (not copied from `Business.location`).
- **Temporary gap (until A.3):** new `Business` rows (application approval, admin create) do **not** auto-create `BusinessLocation`; primary location can become stale vs new Business writes.

## Compatibility strategy (planned)

- **A.3:** compatibility read/write — sync primary location on Business PATCH; create initial location on new Business.
- Read layer: project legacy `Business` DTO fields from **primary location** before deprecating columns.
- Map cutover to location geography: **isolated substage** after backfill (maps frozen until then).

## Scope deferred

- Branch operational status enums, location slugs (F.4 URLs), branch-scoped reviews/favorites/promotions, membership location scope, 6.12B import provenance.

## Naming debt

Prisma enum **`BusinessLocationSource`** describes coordinate provenance only; it is reused on `BusinessLocation.locationSource` and is not the entity name.
