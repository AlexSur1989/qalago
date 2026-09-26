# Business spatial location (Stage 6.11C.5C)

> **Post–A.9.4.4C4 (dev DB):** **`Business.latitude` / `longitude` / `location`** and Business-only spatial trigger/index are **retired**. Application-facing coordinates and PostGIS queries use **`BusinessLocation`** — see [business-location.md](./business-location.md) § **A.9.4.4C4**. Sections below describe the **historical Business-grain** model prior to column retirement.

## Hybrid model (historical — pre–A.9.4.4C4)

| Field | Role |
|-------|------|
| `Business.latitude` / `Business.longitude` | **Was** application-facing WGS84 on Business; **now** on **BusinessLocation**. |
| `Business.location` | **Was** derived geography on Business; **now** on **BusinessLocation**. |

`BusinessApplication` keeps lat/lng only — no spatial column.

## Synchronization

Database trigger `business_sync_location_trigger` calls `business_derive_location_from_coordinates()` **before insert or update** of `latitude` / `longitude`.

Rules (derivation only — never rewrites lat/lng):

- Both coords valid WGS84, not `0,0` → `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`
- Either NULL, out of range, or `0,0` → `location = NULL`

Application validators remain responsible for normal write pairs; the trigger fails safe on partial/legacy rows.

## Index

`Business_location_gist_idx` — GiST on `"location"` **partial** `WHERE "location" IS NOT NULL`.

Rationale: nullable column; future `ST_DWithin` / bbox filters target non-null geography; smaller index on dev/small datasets.

Dev/small tables may still **Seq Scan** in `EXPLAIN`; verify index via catalog (`pg_indexes` / `pg_class`).

## Prisma

Prisma 6.x: `location Unsupported("geography(Point,4326)")?` — validated in schema; **not** read/written by Prisma Client. Spatial SQL uses `$queryRaw` in C.5D+.

## Query status

| Feature | Status |
|---------|--------|
| Nearest / radius (`sort=nearest` + user geo) | **C.5D** — `ST_DWithin` / `ST_Distance` on `Business.location` |
| Map viewport bbox | **C.5E** — `ST_Intersects` + envelope geography |

Implementation: `business-catalog-postgis-geo.query.ts` + `findPagedItemsNearestPostgis`.

## Portability

SQL uses stable PostGIS 3.x (`ST_MakePoint`, `geography`, GiST). Local: PG 18 + PostGIS 3.6.2; Docker template: PG 16 + PostGIS 3.4.

**PS.kz PostGIS on production: UNVERIFIED** — confirm major/version before VPS cutover.

## Manual rollback (C.5C objects only)

Do **not** `DROP EXTENSION postgis`.

```sql
DROP TRIGGER IF EXISTS business_sync_location_trigger ON "Business";
DROP FUNCTION IF EXISTS public.business_derive_location_from_coordinates();
DROP INDEX IF EXISTS "Business_location_gist_idx";
ALTER TABLE "Business" DROP COLUMN IF EXISTS "location";
```

Then revert Prisma migration history row if needed (operational — not automated).
