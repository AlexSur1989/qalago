# Catalog geo query (Stage 6.11C.5A+)

`GET /api/v1/businesses` is the **canonical** public geo catalog endpoint. There is no separate `/businesses/nearby`.

## Modes

| Mode | Parameters | Sort default | Notes |
|------|------------|--------------|-------|
| **A — Catalog** | city only (+ category/search) | `recommended` | DB pagination when no search geo |
| **B — Nearest / radius** | `latitude` + `longitude`, optional `radiusKm`, optional `sort=nearest` | nearest when geo present | `distanceMeters` int, straight-line geodesic (Haversine in Node until C.5D) |
| **C — Map viewport** | `forMap=true` + bbox four corners | `recommended` with DB skip/take | Server excludes invalid stored coords |

## Validation (C.5A)

- User geo pair: both or neither; finite; ranges; **0,0 allowed** for user position.
- `radiusKm` (0.5–100) **requires** user geo pair → **400** if missing.
- Bbox: four params together; corners normalized; max span **1.2° lat**, **1.8° lng**.
- Map paths: exclude null coords and business **0,0** sentinel; WGS84 range filter in SQL.

City geocoding bounds are **not** applied on read (C.5F).

## Performance baseline (C.5A)

- **Nearest:** `findMany` loads **all** matching city rows → sort/filter in Node → slice (C.5D: PostGIS SQL + LIMIT).
- **Map recommended + bbox:** PostgreSQL `skip`/`take` on `(cityId, status)` + coordinate filters; **no geo index** yet (C.5B/C).

## C.5D in-memory sort inventory

| Branch | Service method | Loads full set in Node |
|--------|----------------|------------------------|
| Nearest + geo | `findPagedItems` → `useGeoSort` | Yes |
| Rating / popular | `findPagedItems` | Yes |
| Search + recommended | `findPagedItemsSearchRelevanceInMemory` | Yes |
| Recommended (no search, no geo) | `findPagedItemsRecommendedAtDatabase` | No |

Monetization ad `nearest` placement uses separate serve path (documented in monetization stage); not changed in C.5A.

## Privacy

No dedicated HTTP access logger; bootstrap does not log query strings. Exception filter logs stack only for unhandled 500s — not query params.

## Deferred

- C.5B: PostGIS extension / Docker image (operator approval)
- C.5C: `Business.location geography` + GiST
- C.5D: SQL nearest/radius
- C.5E: SQL bbox on geography
- C.5F: optional read-path city bounds hygiene
