import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  BusinessLocationPrimaryInvariantBrokenCode,
} from '../utils/business-location-invariant.util';
import type { Business, BusinessLocation, Prisma } from '@prisma/client';
import {
  AuthoritativePrimaryPhysicalInput,
  BusinessPhysicalSnapshot,
  businessBootstrapPhysicalFromPrimaryInput,
  businessUpdateDataFromPhysicalSnapshot,
  locationPatchTouchesSynchronizedPhysicalFields,
  patchTouchesSynchronizedPhysicalFields,
  physicalSnapshotFromLocation,
  primaryLocationCreateDataFromBusiness,
  primaryLocationCreateDataFromPhysicalSnapshot,
  primaryLocationUpdateDataFromBusiness,
  primaryPhysicalFromBusinessRecord,
} from '../utils/business-primary-location.util';

export type PrimaryLocationResolution =
  | { status: 'ok'; location: BusinessLocation }
  | { status: 'missing' }
  | { status: 'ambiguous'; count: number };

@Injectable()
export class BusinessPrimaryLocationService {
  /**
   * Resolves the primary BusinessLocation for a business.
   * Does not fall back to arbitrary non-primary rows.
   */
  async resolvePrimaryLocation(
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

  async getPrimaryLocationOrThrow(
    tx: Prisma.TransactionClient,
    businessId: string,
  ): Promise<BusinessLocation> {
    const resolved = await this.resolvePrimaryLocation(tx, businessId);
    if (resolved.status === 'missing') {
      throw new ConflictException({
        code: BusinessLocationPrimaryInvariantBrokenCode,
        message: `Business ${businessId} has no primary BusinessLocation`,
      });
    }
    if (resolved.status === 'ambiguous') {
      throw new ConflictException({
        code: BusinessLocationPrimaryInvariantBrokenCode,
        message: `Business ${businessId} has ${resolved.count} primary BusinessLocation rows`,
      });
    }
    return resolved.location;
  }

  /**
   * Creates authoritative initial primary BL from physical input (repair / legacy callers).
   * Prefer {@link createBusinessWithInitialPrimary} for production onboarding/create.
   */
  async createAuthoritativeInitialPrimary(
    tx: Prisma.TransactionClient,
    businessId: string,
    physical: AuthoritativePrimaryPhysicalInput,
  ): Promise<BusinessLocation> {
    const existing = await this.resolvePrimaryLocation(tx, businessId);
    if (existing.status === 'ok') {
      throw new InternalServerErrorException(
        `Business ${businessId} already has a primary BusinessLocation`,
      );
    }
    if (existing.status === 'ambiguous') {
      throw new InternalServerErrorException(
        `Business ${businessId} has multiple primary BusinessLocation rows`,
      );
    }
    return tx.businessLocation.create({
      data: primaryLocationCreateDataFromPhysicalSnapshot(businessId, physical),
    });
  }

  /** Repair/transitional: copies physical fields from an existing Business row onto new primary BL. */
  async createInitialPrimary(
    tx: Prisma.TransactionClient,
    business: BusinessPhysicalSnapshot,
  ): Promise<BusinessLocation> {
    return this.createAuthoritativeInitialPrimary(
      tx,
      business.id,
      primaryPhysicalFromBusinessRecord(business),
    );
  }

  /**
   * Production aggregate: Business brand shell + exactly one primary BL + compatibility mirror.
   * Physical authority: `primaryPhysical` → BL → Business mirror (NOT NULL bootstrap only).
   */
  async createBusinessWithInitialPrimary(
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

    const primaryLocation = await this.createAuthoritativeInitialPrimary(
      tx,
      business.id,
      params.primaryPhysical,
    );
    const syncedBusiness = await this.syncBusinessFromPrimaryLocationRecord(tx, primaryLocation);
    return { business: syncedBusiness, primaryLocation };
  }

  /**
   * Mirrors synchronized physical fields from Business onto the primary BusinessLocation.
   * Must run in the same transaction as the Business update.
   */
  async syncPrimaryFromBusinessRecord(
    tx: Prisma.TransactionClient,
    business: BusinessPhysicalSnapshot,
  ): Promise<BusinessLocation> {
    const primary = await this.getPrimaryLocationOrThrow(tx, business.id);
    return tx.businessLocation.update({
      where: { id: primary.id },
      data: primaryLocationUpdateDataFromBusiness(business),
    });
  }

  shouldSyncAfterPatch(changedKeys: string[]): boolean {
    return patchTouchesSynchronizedPhysicalFields(changedKeys);
  }

  shouldSyncBusinessAfterLocationPatch(changedKeys: string[]): boolean {
    return locationPatchTouchesSynchronizedPhysicalFields(changedKeys);
  }

  /**
   * Mirrors synchronized physical fields from primary BusinessLocation onto Business.
   * Must run in the same transaction as the primary location update (no HTTP recursion).
   */
  async syncBusinessFromPrimaryLocationRecord(
    tx: Prisma.TransactionClient,
    location: Parameters<typeof physicalSnapshotFromLocation>[0],
  ): Promise<Business> {
    if (!location.isPrimary) {
      throw new InternalServerErrorException(
        'syncBusinessFromPrimaryLocationRecord requires a primary location row',
      );
    }
    const snapshot = physicalSnapshotFromLocation(location);
    return tx.business.update({
      where: { id: snapshot.id },
      data: businessUpdateDataFromPhysicalSnapshot(snapshot),
    });
  }

  /**
   * Promotes a secondary location to primary and syncs legacy Business physical fields.
   * Unsets the previous primary in the same transaction (partial unique index safe).
   */
  async promoteLocationToPrimary(
    tx: Prisma.TransactionClient,
    businessId: string,
    locationId: string,
  ): Promise<{ business: Business; location: BusinessLocation }> {
    const target = await tx.businessLocation.findFirst({
      where: { id: locationId, businessId },
    });
    if (!target) {
      throw new NotFoundException('Location not found');
    }
    if (target.isPrimary) {
      const business = await tx.business.findUniqueOrThrow({ where: { id: businessId } });
      return { business, location: target };
    }

    const currentPrimary = await this.getPrimaryLocationOrThrow(tx, businessId);
    await tx.businessLocation.update({
      where: { id: currentPrimary.id },
      data: { isPrimary: false },
    });
    const newPrimary = await tx.businessLocation.update({
      where: { id: locationId },
      data: { isPrimary: true },
    });
    const business = await this.syncBusinessFromPrimaryLocationRecord(tx, newPrimary);
    return { business, location: newPrimary };
  }
}
