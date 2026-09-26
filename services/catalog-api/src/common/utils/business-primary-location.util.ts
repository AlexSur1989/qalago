import { createHash } from 'crypto';
import { Prisma, type Business, type BusinessLocation } from '@prisma/client';

/** Primary BL physical + contact fields (API/BL authority — not stored on Business after C4). */
export const PRIMARY_LOCATION_PHYSICAL_FIELD_KEYS = [
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

/** Business ↔ primary BL fields synchronized in normal production until A.9.4.5 (cityId) / ongoing (contacts). */
export const BUSINESS_PRIMARY_COMPATIBILITY_KEYS = [
  'cityId',
  'workHours',
  'phone',
  'whatsapp',
  'instagram',
  'website',
] as const;

export type BusinessPrimaryCompatibilitySnapshot = Pick<
  Business,
  (typeof BUSINESS_PRIMARY_COMPATIBILITY_KEYS)[number]
> & { id: string };

export type PrimaryLocationPhysicalFieldKey =
  (typeof PRIMARY_LOCATION_PHYSICAL_FIELD_KEYS)[number];

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

export type BusinessPhysicalSnapshot = {
  id: string;
  cityId: string;
  address: string;
  latitude: BusinessLocation['latitude'];
  longitude: BusinessLocation['longitude'];
  locationSource: BusinessLocation['locationSource'];
  workHours: BusinessLocation['workHours'];
  phone: BusinessLocation['phone'];
  whatsapp: BusinessLocation['whatsapp'];
  instagram: BusinessLocation['instagram'];
  website: BusinessLocation['website'];
};

/** Physical fields for an initial primary branch (no business id yet). */
export type AuthoritativePrimaryPhysicalInput = Omit<BusinessPhysicalSnapshot, 'id'>;

export function physicalSnapshotFromLocation(
  location: Pick<
    BusinessLocation,
    PrimaryLocationPhysicalFieldKey | 'businessId' | 'isPrimary'
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

/** Normal production: primary BL → Business (cityId + contacts only; no geo — A.9.4.4C1). */
export function businessCompatibilityUpdateFromPrimaryLocation(
  snapshot: BusinessPrimaryCompatibilitySnapshot,
): Prisma.BusinessUpdateInput {
  return {
    city: { connect: { id: snapshot.cityId } },
    workHours: snapshot.workHours === null ? Prisma.JsonNull : snapshot.workHours,
    phone: snapshot.phone,
    whatsapp: snapshot.whatsapp,
    instagram: snapshot.instagram,
    website: snapshot.website,
  };
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

/** Business → primary BL: contact/default fields only (never stale Business geo — A.9.4.4C1). */
export function primaryLocationContactUpdateDataFromBusiness(
  business: Pick<Business, 'phone' | 'whatsapp' | 'instagram' | 'website' | 'workHours'>,
): Prisma.BusinessLocationUpdateInput {
  return {
    phone: business.phone,
    whatsapp: business.whatsapp,
    instagram: business.instagram,
    website: business.website,
    workHours: business.workHours === null ? Prisma.JsonNull : business.workHours,
  };
}

export function primaryLocationUpdateDataFromPhysicalInput(
  physical: AuthoritativePrimaryPhysicalInput,
): Prisma.BusinessLocationUpdateInput {
  return {
    city: { connect: { id: physical.cityId } },
    address: physical.address,
    latitude: physical.latitude,
    longitude: physical.longitude,
    locationSource: physical.locationSource,
    workHours: physical.workHours === null ? Prisma.JsonNull : physical.workHours,
    phone: physical.phone,
    whatsapp: physical.whatsapp,
    instagram: physical.instagram,
    website: physical.website,
  };
}

/** @deprecated Transitional name — use {@link PRIMARY_LOCATION_PHYSICAL_FIELD_KEYS}. */
export const SYNCHRONIZED_BUSINESS_PHYSICAL_KEYS = PRIMARY_LOCATION_PHYSICAL_FIELD_KEYS;

/** @deprecated Transitional name — use {@link PrimaryLocationPhysicalFieldKey}. */
export type SynchronizedBusinessPhysicalKey = PrimaryLocationPhysicalFieldKey;
