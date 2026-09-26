import type { BusinessLocation } from '@prisma/client';

export type F4PublicLocationResolution =
  | { kind: 'resolved'; locationId: string }
  | { kind: 'wrong_city'; locationId: string; actualCityId: string };

/** @throws when no eligible branch exists in city (caller maps to 404). */
export function assertF4CityMembership(
  locations: readonly BusinessLocation[],
  cityId: string,
): BusinessLocation[] {
  const inCity = locations.filter((row) => row.cityId === cityId);
  if (inCity.length === 0) {
    throw new F4NoCityMembershipError();
  }
  return inCity;
}

export class F4NoCityMembershipError extends Error {
  readonly name = 'F4NoCityMembershipError';
}

/**
 * F.4 Phase 1 — city-scoped active location for public slug detail.
 * Foreign/unowned locationId → city-default (Rule 7/8). Wrong-city owned → explicit result (Rule 6).
 */
export function resolveF4PublicActiveLocation(
  locations: readonly BusinessLocation[],
  cityId: string,
  requestedLocationId?: string | null,
): F4PublicLocationResolution {
  const inCity = assertF4CityMembership(locations, cityId);
  const trimmed = requestedLocationId?.trim();

  if (trimmed) {
    const owned = locations.find((row) => row.id === trimmed);
    if (!owned) {
      return { kind: 'resolved', locationId: pickCityDefaultLocationId(inCity) };
    }
    if (owned.cityId === cityId) {
      return { kind: 'resolved', locationId: owned.id };
    }
    return { kind: 'wrong_city', locationId: owned.id, actualCityId: owned.cityId };
  }

  return { kind: 'resolved', locationId: pickCityDefaultLocationId(inCity) };
}

/** Rule 4 — primary in city, else A.7.9.3A ordering among branches in C. */
export function pickCityDefaultLocationId(inCity: readonly BusinessLocation[]): string {
  const primaryInCity = inCity.find((row) => row.isPrimary);
  if (primaryInCity) {
    return primaryInCity.id;
  }
  const sorted = [...inCity].sort(
    (a, b) =>
      Number(b.isPrimary) - Number(a.isPrimary) ||
      a.createdAt.getTime() - b.createdAt.getTime() ||
      a.id.localeCompare(b.id),
  );
  return sorted[0]!.id;
}
