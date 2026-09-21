import { createHash } from 'crypto';
import { Prisma, type Business } from '@prisma/client';

/** Physical fields kept in sync between Business and primary BusinessLocation (Stage 6.12A.3). */
export const SYNCHRONIZED_BUSINESS_PHYSICAL_KEYS = [
  'cityId',
  'address',
  'latitude',
  'longitude',
  'locationSource',
  'workHours',
  'phone',
  'whatsapp',
  'instagram',
  'website',
] as const;

export type SynchronizedBusinessPhysicalKey =
  (typeof SYNCHRONIZED_BUSINESS_PHYSICAL_KEYS)[number];

/** PATCH keys on UpdateBusinessDto that trigger primary-location sync (cityId not on owner PATCH). */
export const BUSINESS_LOCATION_SYNC_PATCH_KEYS = new Set<string>([
  'address',
  'latitude',
  'longitude',
  'locationSource',
  'workHours',
  'phone',
  'whatsapp',
  'instagram',
  'website',
]);

export function patchTouchesSynchronizedPhysicalFields(changedKeys: string[]): boolean {
  return changedKeys.some((k) => BUSINESS_LOCATION_SYNC_PATCH_KEYS.has(k));
}

export type BusinessPhysicalSnapshot = Pick<
  Business,
  SynchronizedBusinessPhysicalKey | 'id'
>;

/** Matches A.2 backfill deterministic id so new rows align with migrated primaries. */
export function deterministicPrimaryLocationId(businessId: string): string {
  const digest = createHash('md5').update(`${businessId}:6.12A.2-primary`).digest('hex');
  return `bl${digest.slice(0, 22)}`;
}

export function primaryLocationCreateDataFromBusiness(
  business: BusinessPhysicalSnapshot,
): Prisma.BusinessLocationCreateInput {
  return {
    id: deterministicPrimaryLocationId(business.id),
    business: { connect: { id: business.id } },
    city: { connect: { id: business.cityId } },
    address: business.address,
    latitude: business.latitude ?? undefined,
    longitude: business.longitude ?? undefined,
    locationSource: business.locationSource ?? undefined,
    workHours: business.workHours ?? undefined,
    phone: business.phone ?? undefined,
    whatsapp: business.whatsapp ?? undefined,
    instagram: business.instagram ?? undefined,
    website: business.website ?? undefined,
    isPrimary: true,
  };
}

export function primaryLocationUpdateDataFromBusiness(
  business: BusinessPhysicalSnapshot,
): Prisma.BusinessLocationUpdateInput {
  return {
    city: { connect: { id: business.cityId } },
    address: business.address,
    latitude: business.latitude,
    longitude: business.longitude,
    locationSource: business.locationSource,
    workHours: business.workHours === null ? Prisma.JsonNull : business.workHours,
    phone: business.phone,
    whatsapp: business.whatsapp,
    instagram: business.instagram,
    website: business.website,
  };
}
