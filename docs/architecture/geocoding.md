# Geocoding (Stage 6.11C.4)

## Boundary

```
Mobile / Business Web / Admin Web
        ↓  JWT
GET /api/v1/geocoding/autocomplete
GET /api/v1/geocoding/reverse
        ↓
GeocodingService (city bias, KZ country, ru|kk language)
        ↓
GeocodingProvider (replaceable)
        ├── mock (default in dev/test without key)
        └── maptiler (production — server-side API key)
```

Business **display address + latitude/longitude** are persisted on `BusinessApplication` and `Business`. MapLibre is **render-only** (location picker). Geocoding is **not** tied to MapLibre.

## Initial provider: MapTiler Geocoding

**Why:** Commercial API with documented forward/reverse geocoding, `country`/`proximity`/`bbox`/`language` parameters, server-side key usage (no mobile embedding), aligns with existing MapLibre stack vendor without coupling runtimes.

**Operator must configure:** `QALAGO_GEOCODING_PROVIDER=maptiler`, `MAPTILER_API_KEY` (names only — never commit secrets).

**Documented capability (not live-tested in CI):** Global coverage including Kazakhstan; Cyrillic/RU/KK via `language` parameter; autocomplete via forward geocoding API; reverse geocoding endpoint; persistence of **derived business coordinates and address text** in QalaGo DB is standard product data (not republishing raw MapTiler tiles).

**Alternatives considered:**

| Provider | Notes |
|----------|--------|
| Public Nominatim | **Not for business autocomplete** — OSMF policy forbids client autocomplete and limits bulk/automated use ([usage policy](https://operations.osmfoundation.org/policies/nominatim/)). Existing admin **city** search remains low-volume moderator use — separate from C.4. |
| Geoapify | Viable commercial alternative; similar proxy model; not selected to avoid dual-vendor MVP. |
| 2GIS | Licensing/data persistence constraints for directory use — not assumed. |
| Self-hosted Nominatim/Photon | Valid migration path; out of C.4 scope. |

## Privacy

Autocomplete/reverse requests send: **query text**, **citySlug bias**, **country KZ**, **language ru|kk**, optional **proximity** from city center. Do **not** send user email, phone, JWT to MapTiler (JWT stays on Catalog API only).

## Rate limiting

`GEOCODING_USER_*` and `GEOCODING_IP_*` env limits on Catalog API; client debounce ~320ms, min 3 characters.

## Reverse geocoding after manual map move

Coordinates are **authoritative**; one optional reverse call after user confirms map adjustment may refresh display address.
