import type { BusinessSummaryDto } from './catalog-api';

/** Active branch physical snippet for temporary detail hero (A.9.3.4). */
export function detailPhysicalAddress(business: BusinessSummaryDto): string {
  return business.effectivePhysical?.address ?? business.address;
}

export function detailPhysicalContacts(business: BusinessSummaryDto): {
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
} {
  const ep = business.effectivePhysical;
  return {
    phone: ep?.phone ?? null,
    whatsapp: ep?.whatsapp ?? null,
    website: ep?.website ?? null,
  };
}

export function activeLocationIdFromDetail(
  business: BusinessSummaryDto,
  requestedLocationId?: string | null,
): string | null {
  const fromApi = business.activeLocationId ?? business.effectivePhysical?.locationId ?? null;
  if (fromApi) return fromApi;
  const trimmed = requestedLocationId?.trim();
  return trimmed || null;
}
