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

## Compatibility strategy (planned)

- A.2: one primary `BusinessLocation` per existing `Business` (1:1 backfill).
- Read layer: project legacy `Business` DTO fields from **primary location** before deprecating columns.
- Map cutover to location geography: **isolated substage** after backfill (maps frozen until then).

## Scope deferred

- Branch operational status enums, location slugs (F.4 URLs), branch-scoped reviews/favorites/promotions, membership location scope, 6.12B import provenance.

## Naming debt

Prisma enum **`BusinessLocationSource`** describes coordinate provenance only; it is reused on `BusinessLocation.locationSource` and is not the entity name.
