# QalaGo Light map style (Stage 6.11C.6F.2)

## Purpose

QalaGo Light is a **city-agnostic**, runtime MapLibre paint treatment applied on top of the current DEV/QA basemap ([OpenFreeMap Liberty](https://tiles.openfreemap.org/styles/liberty)). It calms the basemap so **QalaGo catalog businesses** remain the primary discovery layer.

## Policy

- **Global only** — no per-city paint, filters, or zoom rules.
- **Runtime mutations** — `setLayerProperties` on fill/line/raster layers only once per style load. Liberty street/road symbol layers are **not** mutated (`maplibre_gl` would clear `text-field` / layout).
- **Order** — after C.6F.1 commercial POI hardening, before house numbers and QalaGo business layers.
- **Custom styles** — `QALAGO_MAP_STYLE_URL` overrides still work; missing layers are skipped.

## House numbers

- **Source:** existing vector source `openmaptiles`, layer `housenumber`, property `housenumber`.
- **QalaGo layer id:** `qalago-housenumber`.
- **Zoom:** visible from **z16** (global).
- **Stack:** inserted **below** `highway-name-*` when present so street names outrank numbers.
- **Coverage:** depends on OpenStreetMap / OpenMapTiles data only. QalaGo does not fabricate or geocode missing numbers.

## Production note

Public OpenFreeMap has **no production SLA**. For production, plan a pinned QalaGo-owned style JSON after legal/ops review; keep the same city-agnostic policy modules.

## Related code

- `QalaGoMapBasemapHardening` — C.6F.1 commercial POI suppression
- `QalaGoMapLightStyle` — visual hierarchy
- `QalaGoMapHouseNumbers` — address labels
