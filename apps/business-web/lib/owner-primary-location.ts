import type { BusinessLocationState } from '@/components/business-location/business-location-field';
import type { BusinessLocationRow } from '@/lib/api';

/** Resolve primary branch from management list (6.12A — isPrimary authority). */
export function findPrimaryBusinessLocation(
  items: BusinessLocationRow[],
): BusinessLocationRow | null {
  return items.find((row) => row.isPrimary) ?? items[0] ?? null;
}

export function businessLocationStateFromRow(row: BusinessLocationRow): BusinessLocationState {
  return {
    address: row.address ?? '',
    latitude: row.latitude != null ? Number(row.latitude) : undefined,
    longitude: row.longitude != null ? Number(row.longitude) : undefined,
    locationSource:
      row.locationSource === 'MANUALLY_ADJUSTED' ? 'MANUALLY_ADJUSTED' : 'GEOCODED',
  };
}

/** Physical fields for PATCH /businesses/:id/locations/:locationId (primary branch on profile). */
export function buildPrimaryLocationPhysicalPatch(
  location: BusinessLocationState,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    address: location.address.trim(),
  };
  if (location.latitude != null && location.longitude != null) {
    patch.latitude = location.latitude;
    patch.longitude = location.longitude;
    patch.locationSource = location.locationSource ?? 'GEOCODED';
  }
  return patch;
}
