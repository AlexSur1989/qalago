/** Matches mobile `maxUserDistanceFromCityMeters` (user_location_provider.dart). */
export const MAX_USER_DISTANCE_FROM_CITY_METERS = 25_000;

/** Matches mobile `nearbyRadiusKm` (business_rank.dart). */
export const NEARBY_RADIUS_KM = 3;

export const NEARBY_MAX_PREVIEW_ITEMS = 12;

export type GeoPoint = { latitude: number; longitude: number };

export type CityCenter = { centerLat: number; centerLng: number };

/** ~100 m grid — avoids excessive refetch while moving (mobile UserPosition.snapped). */
export function snapGeoCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function snapGeoPoint(point: GeoPoint): GeoPoint {
  return {
    latitude: snapGeoCoordinate(point.latitude),
    longitude: snapGeoCoordinate(point.longitude),
  };
}

/** Haversine distance in meters (no external deps). */
export function distanceMetersBetween(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusM = 6_371_000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** True when browser GPS should drive copy + query (not city-center fallback). */
export function nearbyUsesUserGps(
  userPos: GeoPoint | null,
  cityCenter: CityCenter | null,
): boolean {
  if (!userPos) return false;
  if (!cityCenter) return true;
  return (
    distanceMetersBetween(userPos, {
      latitude: cityCenter.centerLat,
      longitude: cityCenter.centerLng,
    }) <= MAX_USER_DISTANCE_FROM_CITY_METERS
  );
}

export function resolveNearbySearchPosition(
  userPos: GeoPoint | null,
  cityCenter: CityCenter | null,
): GeoPoint | null {
  if (
    userPos &&
    cityCenter &&
    distanceMetersBetween(userPos, {
      latitude: cityCenter.centerLat,
      longitude: cityCenter.centerLng,
    }) <= MAX_USER_DISTANCE_FROM_CITY_METERS
  ) {
    return snapGeoPoint(userPos);
  }
  if (userPos && !cityCenter) {
    return snapGeoPoint(userPos);
  }
  if (cityCenter) {
    return {
      latitude: cityCenter.centerLat,
      longitude: cityCenter.centerLng,
    };
  }
  return null;
}

export function sortNearbyBusinesses<
  T extends { distanceMeters?: number | null; title: string },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const distA = a.distanceMeters ?? 999_999_999;
    const distB = b.distanceMeters ?? 999_999_999;
    if (distA !== distB) return distA - distB;
    return a.title.localeCompare(b.title, 'ru');
  });
}
