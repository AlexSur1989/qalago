import { BadRequestException } from '@nestjs/common';

const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

export type BusinessCoordinatePair = {
  latitude: number;
  longitude: number;
};

export function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Validates a lat/lng pair; returns false if either value is missing or invalid. */
export function isValidBusinessCoordinatePair(
  latitude: unknown,
  longitude: unknown,
): latitude is number {
  if (!isFiniteCoordinate(latitude) || !isFiniteCoordinate(longitude)) {
    return false;
  }
  if (latitude < LAT_MIN || latitude > LAT_MAX) {
    return false;
  }
  if (longitude < LNG_MIN || longitude > LNG_MAX) {
    return false;
  }
  if (latitude === 0 && longitude === 0) {
    return false;
  }
  return true;
}

/** Optional pair: both absent OK; both present must pass validation; one absent is invalid. */
export function isOptionalBusinessCoordinatePairValid(
  latitude: unknown,
  longitude: unknown,
): boolean {
  const hasLat = latitude !== undefined && latitude !== null;
  const hasLng = longitude !== undefined && longitude !== null;
  if (!hasLat && !hasLng) {
    return true;
  }
  if (hasLat !== hasLng) {
    return false;
  }
  return isValidBusinessCoordinatePair(latitude, longitude);
}

export function assertValidBusinessCoordinatePair(
  latitude: unknown,
  longitude: unknown,
  message = 'Valid latitude and longitude are required',
): void {
  if (!isValidBusinessCoordinatePair(latitude, longitude)) {
    throw new BadRequestException(message);
  }
}

export function toBusinessCoordinatePair(
  latitude: unknown,
  longitude: unknown,
): BusinessCoordinatePair {
  assertValidBusinessCoordinatePair(latitude, longitude);
  return { latitude: latitude as number, longitude: longitude as number };
}
