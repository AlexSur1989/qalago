import { ConflictException, NotFoundException } from '@nestjs/common';
import type { BusinessLocation, Prisma } from '@prisma/client';

export const BusinessLocationLastDeleteBlockedCode =
  'BUSINESS_LOCATION_LAST_DELETE_BLOCKED' as const;

export const BusinessLocationPrimaryDeleteBlockedCode =
  'BUSINESS_LOCATION_PRIMARY_DELETE_BLOCKED' as const;

export const BusinessLocationPrimaryInvariantBrokenCode =
  'BUSINESS_LOCATION_PRIMARY_INVARIANT_BROKEN' as const;

export function throwBusinessLocationLastDeleteBlocked(): never {
  throw new ConflictException({
    code: BusinessLocationLastDeleteBlockedCode,
    message:
      'The last branch cannot be deleted while the business still exists. Delete the business or add another branch first.',
  });
}

export function throwBusinessLocationPrimaryDeleteBlocked(): never {
  throw new ConflictException({
    code: BusinessLocationPrimaryDeleteBlockedCode,
    message:
      'The primary branch cannot be deleted. Set another branch as primary, then delete this branch as a secondary location.',
  });
}

export function throwBusinessLocationPrimaryInvariantBroken(detail?: string): never {
  throw new ConflictException({
    code: BusinessLocationPrimaryInvariantBrokenCode,
    message:
      detail ??
      'Business branch primary invariant is broken. Run the BusinessLocation integrity repair tooling before mutating branches.',
  });
}

/** Serializes invariant-changing mutations for one Business (Stage 6.12A.9.4.2B). */
export async function lockBusinessAggregateForUpdate(
  tx: Prisma.TransactionClient,
  businessId: string,
): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Business" WHERE id = ${businessId} FOR UPDATE`;
  if (!rows.length) {
    throw new NotFoundException('Business not found');
  }
}

export type LocationPrimaryCounts = {
  locationCount: number;
  primaryCount: number;
};

export async function countBusinessLocationPrimaryState(
  tx: Prisma.TransactionClient,
  businessId: string,
): Promise<LocationPrimaryCounts> {
  const locations = await tx.businessLocation.findMany({
    where: { businessId },
    select: { isPrimary: true },
  });
  return {
    locationCount: locations.length,
    primaryCount: locations.filter((row) => row.isPrimary).length,
  };
}

export function assertPrimaryInvariantForSecondaryMutation(
  counts: LocationPrimaryCounts,
): void {
  if (counts.locationCount === 0) {
    return;
  }
  if (counts.primaryCount !== 1) {
    throwBusinessLocationPrimaryInvariantBroken(
      counts.primaryCount === 0
        ? 'Business has branches but no primary location. Run integrity repair before adding or removing branches.'
        : 'Business has multiple primary locations. Run integrity repair before mutating branches.',
    );
  }
}

export function assertDeleteLocationAllowed(
  counts: LocationPrimaryCounts,
  target: Pick<BusinessLocation, 'isPrimary'>,
): void {
  if (counts.locationCount <= 1) {
    throwBusinessLocationLastDeleteBlocked();
  }
  if (target.isPrimary) {
    throwBusinessLocationPrimaryDeleteBlocked();
  }
}
