import { Injectable } from '@nestjs/common';
import { MonetizationProductType, Prisma } from '@prisma/client';
import { AvailabilityService } from './availability.service';
import { PlacementCapacityService } from './placement-capacity.service';
import { PurchaseScopeService, resolveScopeConflictStatuses } from './purchase-scope.service';
import { ScheduleConflictResolution } from './types/package-snapshot.types';

export type ProjectedPeriodInput = {
  productType: MonetizationProductType;
  businessId: string;
  cityId: string;
  categoryId?: string | null;
  promotionId?: string | null;
  desiredStartAt?: Date | null;
  durationHours?: number | null;
  durationDays?: number | null;
  excludeOrderId?: string;
};

export type ProjectedPeriodResult = {
  requestedStartAt: Date;
  projectedStartAt: Date;
  projectedEndAt: Date;
  conflictResolvedBy: ScheduleConflictResolution;
};

type DbLike = Pick<
  Prisma.TransactionClient,
  'adCampaign' | 'adPlacement' | 'adPlacementCityConfig' | 'adInventoryReservation'
>;

@Injectable()
export class PurchaseSchedulingService {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly purchaseScope: PurchaseScopeService,
    private readonly capacity: PlacementCapacityService,
  ) {}

  private scopeWhere(
    input: ProjectedPeriodInput,
    placementId: string,
    statuses: ReturnType<typeof resolveScopeConflictStatuses>,
  ): Prisma.AdCampaignWhereInput {
    const where: Prisma.AdCampaignWhereInput = {
      businessId: input.businessId,
      cityId: input.cityId,
      status: { in: statuses },
      campaignPlacements: { some: { placementId } },
    };
    if (
      input.productType === MonetizationProductType.TOP_CATEGORY ||
      input.productType === MonetizationProductType.BOOST
    ) {
      where.categoryId = input.categoryId ?? undefined;
    }
    if (input.productType === MonetizationProductType.PROMOTED_PROMOTION) {
      where.promotionId = input.promotionId ?? undefined;
    }
    return where;
  }

  private async resolveBusinessScopeStart(
    db: DbLike,
    input: ProjectedPeriodInput,
    placementId: string,
    requestedStart: Date,
    tentativeEnd: Date,
  ): Promise<{ start: Date; resolution: ScheduleConflictResolution }> {
    const statuses = resolveScopeConflictStatuses(input.productType);
    let start = requestedStart;
    let resolution: ScheduleConflictResolution = 'NONE';
    let guard = 0;

    while (guard < 32) {
      guard += 1;
      const end = this.availability.addDuration(
        start,
        input.durationHours,
        input.durationDays,
      );
      const overlap = await db.adCampaign.findFirst({
        where: {
          ...this.scopeWhere(input, placementId, statuses),
          startAt: { lt: end },
          endAt: { gt: start },
        },
        orderBy: { endAt: 'desc' },
        select: { endAt: true },
      });
      if (!overlap) break;
      start = overlap.endAt;
      resolution = 'SCHEDULE_AFTER_EXISTING';
    }

    return { start, resolution };
  }

  private async resolveCapacityStart(
    db: DbLike,
    input: ProjectedPeriodInput,
    placementId: string,
    placementCode: string,
    start: Date,
    resolution: ScheduleConflictResolution,
    now: Date,
  ): Promise<{ start: Date; resolution: ScheduleConflictResolution }> {
    if (!this.capacity.usesSharedCapacity(placementCode)) {
      return { start, resolution };
    }

    let projected = start;
    let resolved = resolution;
    let guard = 0;
    const scope = {
      placementId,
      placementCode,
      cityId: input.cityId,
      categoryId: input.categoryId,
    };

    while (guard < 64) {
      guard += 1;
      const end = this.availability.addDuration(
        projected,
        input.durationHours,
        input.durationDays,
      );
      const ok = await this.capacity.isWindowAvailable(
        db,
        scope,
        projected,
        end,
        now,
        input.excludeOrderId,
      );
      if (ok) {
        return { start: projected, resolution: resolved };
      }
      const releaseAt = await this.capacity.findEarliestOverlappingRelease(
        db,
        scope,
        projected,
        end,
        now,
        input.excludeOrderId,
      );
      if (!releaseAt) break;
      projected = releaseAt;
      resolved = 'SCHEDULE_AFTER_CAPACITY';
    }

    return { start: projected, resolution: resolved };
  }

  async resolveProjectedPeriod(
    db: DbLike,
    input: ProjectedPeriodInput,
    now = new Date(),
  ): Promise<ProjectedPeriodResult | null> {
    const scope = this.purchaseScope.resolveScope({
      productType: input.productType,
      businessId: input.businessId,
      cityId: input.cityId,
      categoryId: input.categoryId,
      promotionId: input.promotionId,
    });
    if (!scope) {
      const requestedStartAt = input.desiredStartAt ?? now;
      const projectedEndAt = this.availability.addDuration(
        requestedStartAt,
        input.durationHours,
        input.durationDays,
      );
      return {
        requestedStartAt,
        projectedStartAt: requestedStartAt,
        projectedEndAt,
        conflictResolvedBy: 'NONE',
      };
    }

    const placement = await db.adPlacement.findUnique({
      where: { code: scope.placementCode },
    });
    if (!placement?.isActive) {
      return null;
    }

    const requestedStartAt = input.desiredStartAt ?? now;
    const tentativeEnd = this.availability.addDuration(
      requestedStartAt,
      input.durationHours,
      input.durationDays,
    );

    const businessScoped = await this.resolveBusinessScopeStart(
      db,
      input,
      placement.id,
      requestedStartAt,
      tentativeEnd,
    );

    const capacityScoped = await this.resolveCapacityStart(
      db,
      input,
      placement.id,
      scope.placementCode,
      businessScoped.start,
      businessScoped.resolution,
      now,
    );

    const projectedEndAt = this.availability.addDuration(
      capacityScoped.start,
      input.durationHours,
      input.durationDays,
    );

    return {
      requestedStartAt,
      projectedStartAt: capacityScoped.start,
      projectedEndAt,
      conflictResolvedBy: capacityScoped.resolution,
    };
  }
}
