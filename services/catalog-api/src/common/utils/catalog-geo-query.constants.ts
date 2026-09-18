/**
 * Stage 6.11C.5A — map viewport caps (city-scoped product; not legal boundaries).
 *
 * Uralsk geocoding bounds span ~0.30° lat × ~0.60° lng; Flutter map fetch uses
 * bounds.padded(0.12) (~1.24× span). Caps allow wide city zoom-out without
 * global/abusive bbox queries.
 */
export const MAX_MAP_BBOX_LAT_SPAN_DEGREES = 1.2;
export const MAX_MAP_BBOX_LNG_SPAN_DEGREES = 1.8;

/** Uralsk geocoding bounds (reference for tests / docs). */
export const URALSK_GEOCODING_BOUNDS = {
  minLat: 51.05,
  maxLat: 51.35,
  minLng: 51.05,
  maxLng: 51.65,
} as const;
