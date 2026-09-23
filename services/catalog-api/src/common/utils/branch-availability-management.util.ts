import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  BranchAvailabilityDto,
  BranchAvailabilityMode,
} from '../dto/branch-availability.dto';

export type BranchAvailabilityResponse = {
  mode: BranchAvailabilityMode;
  locationIds: string[];
};

export function normalizeBranchLocationIds(locationIds: string[]): string[] {
  return [...new Set(locationIds.map((id) => id.trim()).filter(Boolean))].sort();
}

export function validateBranchAvailabilityDto(dto: BranchAvailabilityDto): void {
  const ids = normalizeBranchLocationIds(dto.locationIds ?? []);
  if (dto.mode === BranchAvailabilityMode.ALL) {
    if (ids.length > 0) {
      throw new BadRequestException(
        'branchAvailability.locationIds must be empty when mode is ALL',
      );
    }
    return;
  }
  if (ids.length === 0) {
    throw new BadRequestException(
      'branchAvailability.locationIds must contain at least one location when mode is SELECTED',
    );
  }
}

export function encodeBranchAvailabilityFromLocationIds(
  locationIds: string[],
): BranchAvailabilityResponse {
  const normalized = normalizeBranchLocationIds(locationIds);
  if (normalized.length === 0) {
    return { mode: BranchAvailabilityMode.ALL, locationIds: [] };
  }
  return { mode: BranchAvailabilityMode.SELECTED, locationIds: normalized };
}

export async function assertBranchLocationsForBusiness(
  tx: Prisma.TransactionClient,
  businessId: string,
  locationIds: string[],
): Promise<string[]> {
  const normalized = normalizeBranchLocationIds(locationIds);
  for (const locationId of normalized) {
    const scoped = await tx.businessLocation.findFirst({
      where: { id: locationId, businessId },
      select: { id: true },
    });
    if (scoped) continue;
    const foreign = await tx.businessLocation.findUnique({
      where: { id: locationId },
      select: { id: true },
    });
    if (!foreign) {
      throw new NotFoundException('Location not found');
    }
    throw new BadRequestException('Location does not belong to this business');
  }
  return normalized;
}

export async function replaceServiceItemBranchAssignments(
  tx: Prisma.TransactionClient,
  businessId: string,
  serviceItemId: string,
  dto: BranchAvailabilityDto,
): Promise<void> {
  validateBranchAvailabilityDto(dto);
  await tx.serviceItemBranchAvailability.deleteMany({ where: { serviceItemId } });
  if (dto.mode === BranchAvailabilityMode.ALL) {
    return;
  }
  const locationIds = await assertBranchLocationsForBusiness(tx, businessId, dto.locationIds);
  if (locationIds.length === 0) {
    throw new BadRequestException(
      'branchAvailability.locationIds must contain at least one location when mode is SELECTED',
    );
  }
  await tx.serviceItemBranchAvailability.createMany({
    data: locationIds.map((locationId) => ({
      businessId,
      serviceItemId,
      locationId,
    })),
  });
}

export async function replacePromotionBranchAssignments(
  tx: Prisma.TransactionClient,
  businessId: string,
  promotionId: string,
  dto: BranchAvailabilityDto,
): Promise<void> {
  validateBranchAvailabilityDto(dto);
  await tx.promotionBranchAvailability.deleteMany({ where: { promotionId } });
  if (dto.mode === BranchAvailabilityMode.ALL) {
    return;
  }
  const locationIds = await assertBranchLocationsForBusiness(tx, businessId, dto.locationIds);
  if (locationIds.length === 0) {
    throw new BadRequestException(
      'branchAvailability.locationIds must contain at least one location when mode is SELECTED',
    );
  }
  await tx.promotionBranchAvailability.createMany({
    data: locationIds.map((locationId) => ({
      businessId,
      promotionId,
      locationId,
    })),
  });
}

export function isPrismaForeignKeyViolation(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2003' || error.code === 'P2014')
  ) {
    return true;
  }
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    const message = error.message;
    return /23001|RESTRICT|foreign key|нарушает ограничение RESTRICT/i.test(message);
  }
  return false;
}

export const BusinessLocationDeleteBlockedCode = 'BUSINESS_LOCATION_DELETE_BLOCKED' as const;

export function rethrowLocationDeleteConflict(error: unknown): never {
  if (isPrismaForeignKeyViolation(error)) {
    throw new ConflictException({
      code: BusinessLocationDeleteBlockedCode,
      message:
        'This branch cannot be deleted while catalog items, promotions, ad campaigns, or other branch-scoped data still reference it. Update or remove those references first.',
    });
  }
  throw error;
}
