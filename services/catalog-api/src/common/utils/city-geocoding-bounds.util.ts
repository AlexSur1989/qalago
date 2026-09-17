import { BadRequestException } from '@nestjs/common';

/** Provider-neutral city search bounds (QalaGo config, not admin boundaries). */
export type CityGeocodingBounds = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

export type CityGeocodingBoundsSource = {
  geocodingMinLat?: unknown;
  geocodingMaxLat?: unknown;
  geocodingMinLng?: unknown;
  geocodingMaxLng?: unknown;
};

const OUT_OF_CITY_MESSAGE = 'Location is outside the selected city geocoding area';

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    const n = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(n) ? n : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseCityGeocodingBounds(
  city: CityGeocodingBoundsSource | null | undefined,
): CityGeocodingBounds | null {
  if (!city) return null;
  const minLat = toNumber(city.geocodingMinLat);
  const maxLat = toNumber(city.geocodingMaxLat);
  const minLng = toNumber(city.geocodingMinLng);
  const maxLng = toNumber(city.geocodingMaxLng);
  if (minLat == null || maxLat == null || minLng == null || maxLng == null) {
    return null;
  }
  return {
    minLat: Math.min(minLat, maxLat),
    maxLat: Math.max(minLat, maxLat),
    minLng: Math.min(minLng, maxLng),
    maxLng: Math.max(minLng, maxLng),
  };
}

export function isCoordinateWithinCityGeocodingBounds(
  bounds: CityGeocodingBounds,
  latitude: number,
  longitude: number,
): boolean {
  return (
    latitude >= bounds.minLat &&
    latitude <= bounds.maxLat &&
    longitude >= bounds.minLng &&
    longitude <= bounds.maxLng
  );
}

export function filterGeocodingSuggestionsByBounds<T extends { latitude: number; longitude: number }>(
  suggestions: T[],
  bounds: CityGeocodingBounds,
): T[] {
  return suggestions.filter((item) =>
    isCoordinateWithinCityGeocodingBounds(bounds, item.latitude, item.longitude),
  );
}

export function assertCoordinateWithinCityGeocodingBounds(
  bounds: CityGeocodingBounds | null,
  latitude: number,
  longitude: number,
): void {
  if (!bounds) {
    throw new BadRequestException('City geocoding bounds are not configured');
  }
  if (!isCoordinateWithinCityGeocodingBounds(bounds, latitude, longitude)) {
    throw new BadRequestException(OUT_OF_CITY_MESSAGE);
  }
}
