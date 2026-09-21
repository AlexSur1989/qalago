import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type { BusinessLocation, Prisma } from '@prisma/client';
import {
  BusinessPhysicalSnapshot,
  patchTouchesSynchronizedPhysicalFields,
  primaryLocationCreateDataFromBusiness,
  primaryLocationUpdateDataFromBusiness,
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
      throw new InternalServerErrorException(
        `Business ${businessId} has no primary BusinessLocation`,
      );
    }
    if (resolved.status === 'ambiguous') {
      throw new InternalServerErrorException(
        `Business ${businessId} has ${resolved.count} primary BusinessLocation rows`,
      );
    }
    return resolved.location;
  }

  /** Creates exactly one primary location from the Business row (same transaction as Business create). */
  async createInitialPrimary(
    tx: Prisma.TransactionClient,
    business: BusinessPhysicalSnapshot,
  ): Promise<BusinessLocation> {
    const existing = await this.resolvePrimaryLocation(tx, business.id);
    if (existing.status === 'ok') {
      throw new InternalServerErrorException(
        `Business ${business.id} already has a primary BusinessLocation`,
      );
    }
    if (existing.status === 'ambiguous') {
      throw new InternalServerErrorException(
        `Business ${business.id} has multiple primary BusinessLocation rows`,
      );
    }
    return tx.businessLocation.create({
      data: primaryLocationCreateDataFromBusiness(business),
    });
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
}
