import type { Business, BusinessLocation, Prisma } from '@prisma/client';
import {
  type AuthoritativePrimaryPhysicalInput,
  businessCompatibilityUpdateFromPrimaryLocation,
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

/** Normal production: sync contact defaults from primary BL onto Business (no geo, no parent city — A.9.4.5D). */
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

/** Creates exactly one primary BL from authoritative physical input (existing Business shell). */
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

function mergeBrandContactsWithPrimaryPhysical(
  brand: Prisma.BusinessUncheckedCreateInput,
  primaryPhysical: AuthoritativePrimaryPhysicalInput,
): Prisma.BusinessUncheckedCreateInput {
  return {
    ...brand,
    phone: brand.phone ?? primaryPhysical.phone ?? undefined,
    whatsapp: brand.whatsapp ?? primaryPhysical.whatsapp ?? undefined,
    instagram: brand.instagram ?? primaryPhysical.instagram ?? undefined,
    website: brand.website ?? primaryPhysical.website ?? undefined,
    workHours:
      brand.workHours !== undefined ? brand.workHours : primaryPhysical.workHours ?? undefined,
  };
}

/**
 * Production + tracked dev create (A.9.4.4C4): brand shell + authoritative primary BL atomically.
 * Physical authority: `primaryPhysical` → BusinessLocation; Business shell holds brand + contact defaults only.
 */
export async function createBusinessWithInitialPrimaryInTx(
  tx: Prisma.TransactionClient,
  params: {
    brand: Prisma.BusinessUncheckedCreateInput;
    primaryPhysical: AuthoritativePrimaryPhysicalInput;
  },
): Promise<{ business: Business; primaryLocation: BusinessLocation }> {
  const business = await tx.business.create({
    data: mergeBrandContactsWithPrimaryPhysical(params.brand, params.primaryPhysical),
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
  brandCreate: Omit<Prisma.BusinessUncheckedCreateInput, 'slug'>;
  brandUpdate: Prisma.BusinessUncheckedUpdateInput;
  primaryPhysical: AuthoritativePrimaryPhysicalInput;
};

/**
 * Idempotent seed/dev upsert (A.9.4.4C4): brand metadata + authoritative primary BL.
 */
export async function upsertSeedBusinessWithPrimaryLocationInTx(
  tx: Prisma.TransactionClient,
  params: SeedBusinessUpsertParams,
): Promise<Business> {
  const business = await tx.business.upsert({
    where: params.where,
    create: mergeBrandContactsWithPrimaryPhysical(
      { slug: params.where.slug, ...params.brandCreate },
      params.primaryPhysical,
    ),
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

/** @deprecated Use {@link upsertSeedBusinessWithPrimaryLocationInTx}. */
export async function upsertSeedBusinessWithPrimaryMirrorInTx(
  tx: Prisma.TransactionClient,
  params: SeedBusinessUpsertParams,
): Promise<Business> {
  return upsertSeedBusinessWithPrimaryLocationInTx(tx, params);
}
