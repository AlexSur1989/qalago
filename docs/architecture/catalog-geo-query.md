# Catalog geo query (Stage 6.11C.5A+ / A.9.3.2b)

`GET /api/v1/businesses` is the **canonical** public geo catalog endpoint. There is no separate `/businesses/nearby`.

**Physical authority (A.7.9.2 / A.9.3.2 / A.9.3.2b):** discovery geo membership and map readiness use **`BusinessLocation.location`** (PostGIS) and branch stored coordinates — **not** legacy **`Business.latitude/longitude`** or **`Business.location`** for public list filtering.

## Modes

| Mode | Parameters | Sort default | Notes |
|------|------------|--------------|-------|
| **A — Catalog** | city only (+ category/search) | `recommended` | DB pagination when no search geo |
| **B — Nearest / radius** | `latitude` + `longitude`, optional `radiusKm`, optional `sort=nearest` | nearest when geo present | PostGIS on **`bl.location`**; **`contextLocationId`** = qualifying branch |
| **C — Map viewport** | bbox four corners; optional `forMap=true` | `recommended`, title asc | PostGIS **`ST_Intersects(bl.location, envelope)`**; **`forMap=true`** → **location-grain**; bbox without `forMap` → **business-grain** (one card, in-bbox branch context) |
| **C′ — forMap, no bbox** | `forMap=true` only | `recommended` | **Business-grain** list; requires map-ready **branch** in city (valid lat/lng, not 0,0) — not parent Business mirror |

## Bbox + accompanying geo (A.9.3.2b)

When **all four bbox corners** are present, physical viewport membership is always evaluated on **branches** (PostGIS), even if `latitude`/`longitude`/`radiusKm` are also sent:

- **bbox + nearest** → nearest PostGIS with optional **`mapBbox`** on branches (user position for distance only).
- **bbox + explicit `radiusKm`** → radius PostGIS with **`mapBbox`** on branches (no parent-coordinate bbox).
- **bbox + lat/lng + other sorts** → viewport PostGIS paging (bbox defines membership; user coords do not filter parent Business rows).

## Validation (C.5A)

- User geo pair: both or neither; finite; ranges; **0,0 allowed** for user position.
- `radiusKm` (0.5–100) **requires** user geo pair → **400** if missing.
- Bbox: four params together; corners normalized; max span **1.2° lat**, **1.8° lng**.
- Map readiness: exclude branches with null/invalid stored coordinates and **0,0** sentinel (same rules as legacy map guard, applied per **BusinessLocation**).

City geocoding bounds are **not** applied on read (C.5F).

## Performance (C.5D+)

- **Nearest / radius:** PostGIS `ST_DWithin` + `ST_Distance` on **`BusinessLocation.location`**, `BusinessLocation_cityId_idx` / **`BusinessLocation_location_gist_idx`**.
- **Map viewport + bbox:** branch intersect + SQL `LIMIT`/`OFFSET`; business-grain bbox uses `DISTINCT ON (business)` branch pick.

## In-memory sort inventory (post C.5D)

| Branch | Service method | Loads full set in Node |
|--------|----------------|------------------------|
| Nearest + geo | `findPagedItemsNearestPostgis` | **No** (SQL page + hydrate) |
| Rating / popular | `findPagedItems` | Yes |
| Search + recommended | `findPagedItemsSearchRelevanceInMemory` | Yes |
| Search + explicit `radiusKm` (any sort) | `findPagedItemsWithRadiusFilter` | **No** (PostGIS membership first) |
| Recommended (no search, no geo) | `findPagedItemsRecommendedAtDatabase` | No |
| Bbox (non-nearest, non-explicit-radius) | `findPagedItemsMapViewportPostgis` | **No** (PostGIS page) |

## Spatial storage (compatibility)

- **`Business.latitude` / `Business.longitude`** — legacy primary mirror / write-path sync; **not** public geo filter authority (A.9.3.2b).
- **`BusinessLocation.latitude/longitude`** + derived **`location`** geography — discovery geo authority.
- See `docs/architecture/business-spatial-location.md` for triggers and indexes.

## Deferred

- C.5F: optional read-path city bounds hygiene
