import type { Business, BusinessLocation, Prisma } from '@prisma/client';

/** Additive public detail block (Stage 6.12A.7.6). */
export type EffectivePhysicalDto = {
  locationId: string | null;
  isPrimary: boolean;
  cityId: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  workHours: Prisma.JsonValue | null;
};

/** Business-level defaults for contact merge (not physical geo authority). */
export type BusinessContactDefaults = Pick<
  Business,
  'cityId' | 'phone' | 'whatsapp' | 'instagram' | 'website' | 'workHours'
>;

/** @deprecated Alias for contact defaults — runtime geo comes from BusinessLocation only (A.9.4.4B). */
export type BusinessPhysicalFallback = BusinessContactDefaults;

export type ActiveLocationResolution =
  | 'requested'
  | 'primary_default'
  | 'invalid_location_fallback_primary'
  | 'foreign_location_fallback_primary'
  | 'missing_primary_location';

function toNumberOrNull(value: BusinessLocation['latitude']): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pickPrimaryLocation(locations: BusinessLocation[]): BusinessLocation | null {
  if (locations.length === 0) return null;
  const primaries = locations.filter((row) => row.isPrimary);
  if (primaries.length === 1) return primaries[0]!;
  if (primaries.length > 1) {
    return [...primaries].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
    )[0]!;
  }
  return [...locations].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  )[0]!;
}

/**
 * Resolves the active BusinessLocation for public detail.
 * Wrong-business or unknown locationId → primary for this business only (no cross-business data).
 */
export function resolveActiveBusinessLocationForDetail(
  locations: BusinessLocation[],
  requestedLocationId: string | undefined | null,
): { location: BusinessLocation | null; resolution: ActiveLocationResolution } {
  const primary = pickPrimaryLocation(locations);
  const trimmed = requestedLocationId?.trim();

  if (!trimmed) {
    return {
      location: primary,
      resolution: primary ? 'primary_default' : 'missing_primary_location',
    };
  }

  const match = locations.find((row) => row.id === trimmed);
  if (match) {
    return { location: match, resolution: 'requested' };
  }

  return {
    location: primary,
    resolution: primary ? 'invalid_location_fallback_primary' : 'missing_primary_location',
  };
}

/**
 * Physical geo fields always from `location` when present; never from legacy Business storage.
 * Contact fields merge branch overrides with Business-level defaults.
 */
export function buildEffectivePhysicalDto(
  contactDefaults: BusinessContactDefaults,
  location: BusinessLocation | null,
): EffectivePhysicalDto {
  if (!location) {
    return {
      locationId: null,
      isPrimary: false,
      cityId: contactDefaults.cityId,
      address: '',
      latitude: null,
      longitude: null,
      phone: contactDefaults.phone ?? null,
      whatsapp: contactDefaults.whatsapp ?? null,
      instagram: contactDefaults.instagram ?? null,
      website: contactDefaults.website ?? null,
      workHours: contactDefaults.workHours ?? null,
    };
  }

  return {
    locationId: location.id,
    isPrimary: location.isPrimary,
    cityId: location.cityId,
    address: location.address,
    latitude: toNumberOrNull(location.latitude),
    longitude: toNumberOrNull(location.longitude),
    phone: location.phone ?? contactDefaults.phone ?? null,
    whatsapp: location.whatsapp ?? contactDefaults.whatsapp ?? null,
    instagram: location.instagram ?? contactDefaults.instagram ?? null,
    website: location.website ?? contactDefaults.website ?? null,
    workHours: location.workHours ?? contactDefaults.workHours ?? null,
  };
}

export function attachEffectivePhysicalToDetail<
  T extends BusinessContactDefaults & { id?: string },
>(
  business: T,
  locations: BusinessLocation[],
  requestedLocationId?: string | null,
): T & { activeLocationId: string | null; effectivePhysical: EffectivePhysicalDto } {
  const { location } = resolveActiveBusinessLocationForDetail(locations, requestedLocationId);
  const effectivePhysical = buildEffectivePhysicalDto(business, location);
  return {
    ...business,
    activeLocationId: effectivePhysical.locationId,
    effectivePhysical,
  };
}
