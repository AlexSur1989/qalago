import { createHash } from 'crypto';
import { Prisma, type Business, type BusinessLocation } from '@prisma/client';

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

/** Owner PATCH fields whose authority is primary BusinessLocation (Stage 6.12A.9.4.3A). */
export const PRIMARY_PHYSICAL_BUSINESS_PATCH_KEYS = new Set<string>([
  'address',
  'latitude',
  'longitude',
  'locationSource',
]);

/** Owner PATCH contact/hours fields that still write Business first, then mirror to primary BL. */
export const BUSINESS_TO_PRIMARY_CONTACT_SYNC_PATCH_KEYS = new Set<string>([
  'workHours',
  'phone',
  'whatsapp',
  'instagram',
  'website',
]);

export function patchTouchesPrimaryPhysicalFields(changedKeys: string[]): boolean {
  return changedKeys.some((k) => PRIMARY_PHYSICAL_BUSINESS_PATCH_KEYS.has(k));
}

export function patchTouchesBusinessToPrimaryContactSync(changedKeys: string[]): boolean {
  return changedKeys.some((k) => BUSINESS_TO_PRIMARY_CONTACT_SYNC_PATCH_KEYS.has(k));
}

/** PATCH keys on UpdateBusinessLocationDto that trigger primary ↔ Business sync. */
export const BUSINESS_LOCATION_API_SYNC_PATCH_KEYS = new Set<string>([
  'cityId',
  ...BUSINESS_LOCATION_SYNC_PATCH_KEYS,
]);

export function locationPatchTouchesSynchronizedPhysicalFields(changedKeys: string[]): boolean {
  return changedKeys.some((k) => BUSINESS_LOCATION_API_SYNC_PATCH_KEYS.has(k));
}

export function physicalSnapshotFromLocation(
  location: Pick<
    BusinessLocation,
    SynchronizedBusinessPhysicalKey | 'businessId' | 'isPrimary'
  >,
): BusinessPhysicalSnapshot {
  return {
    id: location.businessId,
    cityId: location.cityId,
    address: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
    locationSource: location.locationSource,
    workHours: location.workHours,
    phone: location.phone,
    whatsapp: location.whatsapp,
    instagram: location.instagram,
    website: location.website,
  };
}

export function businessUpdateDataFromPhysicalSnapshot(
  snapshot: BusinessPhysicalSnapshot,
): Prisma.BusinessUpdateInput {
  return {
    city: { connect: { id: snapshot.cityId } },
    address: snapshot.address,
    latitude: snapshot.latitude,
    longitude: snapshot.longitude,
    locationSource: snapshot.locationSource,
    workHours: snapshot.workHours === null ? Prisma.JsonNull : snapshot.workHours,
    phone: snapshot.phone,
    whatsapp: snapshot.whatsapp,
    instagram: snapshot.instagram,
    website: snapshot.website,
  };
}

export type BusinessPhysicalSnapshot = Pick<
  Business,
  SynchronizedBusinessPhysicalKey | 'id'
>;

/** Physical fields for an initial primary branch (no business id yet). */
export type AuthoritativePrimaryPhysicalInput = Omit<BusinessPhysicalSnapshot, 'id'>;

export function primaryPhysicalFromBusinessRecord(
  business: BusinessPhysicalSnapshot,
): AuthoritativePrimaryPhysicalInput {
  const { id: _id, ...physical } = business;
  return physical;
}

/** Matches A.2 backfill deterministic id so new rows align with migrated primaries. */
export function deterministicPrimaryLocationId(businessId: string): string {
  const digest = createHash('md5').update(`${businessId}:6.12A.2-primary`).digest('hex');
  return `bl${digest.slice(0, 22)}`;
}

export function primaryLocationCreateDataFromPhysicalSnapshot(
  businessId: string,
  physical: AuthoritativePrimaryPhysicalInput,
): Prisma.BusinessLocationCreateInput {
  return {
    id: deterministicPrimaryLocationId(businessId),
    business: { connect: { id: businessId } },
    city: { connect: { id: physical.cityId } },
    address: physical.address,
    latitude: physical.latitude ?? undefined,
    longitude: physical.longitude ?? undefined,
    locationSource: physical.locationSource ?? undefined,
    workHours: physical.workHours ?? undefined,
    phone: physical.phone ?? undefined,
    whatsapp: physical.whatsapp ?? undefined,
    instagram: physical.instagram ?? undefined,
    website: physical.website ?? undefined,
    isPrimary: true,
  };
}

export function primaryLocationCreateDataFromBusiness(
  business: BusinessPhysicalSnapshot,
): Prisma.BusinessLocationCreateInput {
  return primaryLocationCreateDataFromPhysicalSnapshot(
    business.id,
    primaryPhysicalFromBusinessRecord(business),
  );
}

/** NOT NULL bootstrap fields on Business.create — same snapshot as authoritative primary BL (6.12A.9.4.3B). */
export function businessBootstrapPhysicalFromPrimaryInput(
  physical: AuthoritativePrimaryPhysicalInput,
): Pick<Business, 'cityId' | 'address' | 'latitude' | 'longitude' | 'locationSource'> {
  return {
    cityId: physical.cityId,
    address: physical.address,
    latitude: physical.latitude,
    longitude: physical.longitude,
    locationSource: physical.locationSource,
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
