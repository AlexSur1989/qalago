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
- **Temporary gap (until A.3):** closed in A.3 — see below.

## Stage 6.12A.3 (primary compatibility & write sync)

- **Transition policy:** legacy `Business` physical columns remain on public API responses; **writes** to those fields and **production creates** keep the **primary** `BusinessLocation` in sync in the **same DB transaction**.
- **Synchronized fields:** `cityId`, `address`, `latitude`, `longitude`, `locationSource`, `workHours`, `phone`, `whatsapp`, `instagram`, `website` (brand/plan/taxonomy fields are **not** mirrored).
- **Central services:** `BusinessPrimaryLocationService` — resolve primary (`isPrimary=true` only; no “first by createdAt” fallback); `createInitialPrimary`; `syncPrimaryFromBusinessRecord`.
- **Production create paths:** admin `POST /businesses` (import) and business-application **approval** create `Business` + one primary location atomically.
- **Owner PATCH:** `PATCH /businesses/:id` — when the DTO touches any synchronized physical field, update Business + primary location in one transaction; brand-only patches skip location writes; partial PATCH semantics unchanged (omitted fields not cleared).
- **Primary resolution errors:** missing or multiple primary rows → controlled internal error on sync paths (no silent repair during ordinary PATCH).
- **Read layer (A.3):** public list/detail still read top-level **Business** fields while synchronized; optional internal use of primary resolution for A.4.
- **Map:** unchanged — catalog/map PostGIS still queries **`Business.location`**; triggers keep Business and primary `BusinessLocation` geography aligned on coordinate writes.

## Compatibility strategy (forward)

- Later substages may project legacy DTO fields from primary location before deprecating columns.
- Map cutover to location geography: **isolated substage** after backfill (maps frozen until then).

## Scope deferred

- Branch operational status enums, location slugs (F.4 URLs), branch-scoped reviews/favorites/promotions, membership location scope, 6.12B import provenance.

## Naming debt

Prisma enum **`BusinessLocationSource`** describes coordinate provenance only; it is reused on `BusinessLocation.locationSource` and is not the entity name.
