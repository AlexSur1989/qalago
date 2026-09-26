import type { Business, BusinessLocation, Prisma } from '@prisma/client';
import {
  type AuthoritativePrimaryPhysicalInput,
  businessBootstrapPhysicalFromPrimaryInput,
  businessCompatibilityUpdateFromPrimaryLocation,
  businessLegacyFullMirrorUpdateFromPrimaryLocation,
  physicalSnapshotFromLocation,
  primaryLocationCreateDataFromPhysicalSnapshot,
  primaryLocationUpdateDataFromPhysicalInput,
} from './business-primary-location.util';

export class BusinessLocationSeedInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessLocationSeedInvariantError';
  }
}

export type PrimaryLocationResolution =
  | { status: 'ok'; location: BusinessLocation }
  | { status: 'missing' }
  | { status: 'ambiguous'; count: number };

export async function resolvePrimaryLocationInTx(
  tx: Prisma.TransactionClient,
  businessId: string,
): Promise<PrimaryLocationResolution> {
  const primaries = await tx.businessLocation.findMany({
    where: { businessId, isPrimary: true },
  });
  if (primaries.length === 0) {
    return { status: 'missing' };
  }
  if (primaries.length > 1) {
    return { status: 'ambiguous', count: primaries.length };
  }
  return { status: 'ok', location: primaries[0]! };
}

/** Normal production: sync cityId + contacts from primary BL onto Business (no geo — A.9.4.4C1). */
export async function syncBusinessCompatibilityFromPrimaryInTx(
  tx: Prisma.TransactionClient,
  location: Pick<BusinessLocation, 'isPrimary' | 'businessId'> &
    Parameters<typeof physicalSnapshotFromLocation>[0],
): Promise<Business> {
  if (!location.isPrimary) {
    throw new Error('syncBusinessCompatibilityFromPrimaryInTx requires a primary location row');
  }
  const snapshot = physicalSnapshotFromLocation(location);
  return tx.business.update({
    where: { id: snapshot.id },
    data: businessCompatibilityUpdateFromPrimaryLocation(snapshot),
  });
}

/** @deprecated Name retained for call sites; delegates to compatibility sync (not full geo mirror). */
export async function syncBusinessMirrorFromPrimaryInTx(
  tx: Prisma.TransactionClient,
  location: Parameters<typeof syncBusinessCompatibilityFromPrimaryInTx>[1],
): Promise<Business> {
  return syncBusinessCompatibilityFromPrimaryInTx(tx, location);
}

/** Legacy full geo mirror — create/bootstrap (C3) and migration tooling only; not integrity repair (C2). */
export async function syncBusinessLegacyFullMirrorFromPrimaryInTx(
  tx: Prisma.TransactionClient,
  location: Pick<BusinessLocation, 'isPrimary' | 'businessId'> &
    Parameters<typeof physicalSnapshotFromLocation>[0],
): Promise<Business> {
  if (!location.isPrimary) {
    throw new Error('syncBusinessLegacyFullMirrorFromPrimaryInTx requires a primary location row');
  }
  const snapshot = physicalSnapshotFromLocation(location);
  return tx.business.update({
    where: { id: snapshot.id },
    data: businessLegacyFullMirrorUpdateFromPrimaryLocation(snapshot),
  });
}

export async function createAuthoritativeInitialPrimaryInTx(
  tx: Prisma.TransactionClient,
  businessId: string,
  physical: AuthoritativePrimaryPhysicalInput,
): Promise<BusinessLocation> {
  const existing = await resolvePrimaryLocationInTx(tx, businessId);
  if (existing.status === 'ok') {
    throw new Error(`Business ${businessId} already has a primary BusinessLocation`);
  }
  if (existing.status === 'ambiguous') {
    throw new Error(`Business ${businessId} has multiple primary BusinessLocation rows`);
  }
  return tx.businessLocation.create({
    data: primaryLocationCreateDataFromPhysicalSnapshot(businessId, physical),
  });
}

/** Production + dev create: brand shell + exactly one primary BL + Business mirror. */
export async function createBusinessWithInitialPrimaryInTx(
  tx: Prisma.TransactionClient,
  params: {
    brand: Omit<
      Prisma.BusinessUncheckedCreateInput,
      'cityId' | 'address' | 'latitude' | 'longitude' | 'locationSource'
    >;
    primaryPhysical: AuthoritativePrimaryPhysicalInput;
  },
): Promise<{ business: Business; primaryLocation: BusinessLocation }> {
  const bootstrap = businessBootstrapPhysicalFromPrimaryInput(params.primaryPhysical);
  const business = await tx.business.create({
    data: {
      ...params.brand,
      ...bootstrap,
      phone: params.brand.phone ?? params.primaryPhysical.phone ?? undefined,
      whatsapp: params.brand.whatsapp ?? params.primaryPhysical.whatsapp ?? undefined,
      instagram: params.brand.instagram ?? params.primaryPhysical.instagram ?? undefined,
      website: params.brand.website ?? params.primaryPhysical.website ?? undefined,
      workHours:
        params.brand.workHours !== undefined
          ? params.brand.workHours
          : params.primaryPhysical.workHours ?? undefined,
    },
  });

  const primaryLocation = await createAuthoritativeInitialPrimaryInTx(
    tx,
    business.id,
    params.primaryPhysical,
  );
  const syncedBusiness = await syncBusinessCompatibilityFromPrimaryInTx(tx, primaryLocation);
  return { business: syncedBusiness, primaryLocation };
}

export type SeedBusinessUpsertParams = {
  where: { slug: string };
  brandCreate: Omit<
    Prisma.BusinessUncheckedCreateInput,
    'cityId' | 'address' | 'latitude' | 'longitude' | 'locationSource' | 'slug'
  >;
  brandUpdate: Omit<
    Prisma.BusinessUncheckedUpdateInput,
    'cityId' | 'address' | 'latitude' | 'longitude' | 'locationSource'
  >;
  primaryPhysical: AuthoritativePrimaryPhysicalInput;
};

/**
 * Idempotent seed/dev upsert: authoritative primaryPhysical → primary BL → Business mirror.
 * Does not create duplicate branches on re-run; updates the existing primary when present.
 */
export async function upsertSeedBusinessWithPrimaryMirrorInTx(
  tx: Prisma.TransactionClient,
  params: SeedBusinessUpsertParams,
): Promise<Business> {
  const bootstrap = businessBootstrapPhysicalFromPrimaryInput(params.primaryPhysical);

  const business = await tx.business.upsert({
    where: params.where,
    create: {
      slug: params.where.slug,
      ...params.brandCreate,
      ...bootstrap,
      phone: params.brandCreate.phone ?? params.primaryPhysical.phone ?? undefined,
      whatsapp: params.brandCreate.whatsapp ?? params.primaryPhysical.whatsapp ?? undefined,
      instagram: params.brandCreate.instagram ?? params.primaryPhysical.instagram ?? undefined,
      website: params.brandCreate.website ?? params.primaryPhysical.website ?? undefined,
      workHours:
        params.brandCreate.workHours !== undefined
          ? params.brandCreate.workHours
          : params.primaryPhysical.workHours ?? undefined,
    },
    update: params.brandUpdate,
  });

  const resolved = await resolvePrimaryLocationInTx(tx, business.id);
  let primaryLocation: BusinessLocation;

  if (resolved.status === 'missing') {
    primaryLocation = await tx.businessLocation.create({
      data: primaryLocationCreateDataFromPhysicalSnapshot(business.id, params.primaryPhysical),
    });
  } else if (resolved.status === 'ok') {
    primaryLocation = await tx.businessLocation.update({
      where: { id: resolved.location.id },
      data: primaryLocationUpdateDataFromPhysicalInput(params.primaryPhysical),
    });
  } else {
    throw new BusinessLocationSeedInvariantError(
      `Business "${params.where.slug}" has ${resolved.count} primary BusinessLocation rows. ` +
        'Run npm run integrity:business-locations:audit (and --apply if needed) before seed.',
    );
  }

  return syncBusinessCompatibilityFromPrimaryInTx(tx, primaryLocation);
}
