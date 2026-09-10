import { Injectable } from '@nestjs/common';
import {
  AdCampaignStatus,
  AdInventoryReservationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CAPACITY_CAMPAIGN_STATUSES,
  SCOPED_AVAILABILITY_PLACEMENTS,
  VIP_CAPACITY_CAMPAIGN_STATUSES,
  VIP_CAPACITY_PLACEMENT_CODE,
} from './constants/monetization.constants';

type DbLike = Pick<
  PrismaService,
  'adPlacement' | 'adPlacementCityConfig' | 'adCampaign' | 'adInventoryReservation'
>;

export type CapacityScope = {
  placementId: string;
  placementCode: string;
  cityId: string;
  categoryId?: string | null;
};

@Injectable()
export class PlacementCapacityService {
  constructor(private readonly prisma: PrismaService) {}

  resolveCapacityStatuses(placementCode: string): readonly AdCampaignStatus[] {
    if (placementCode === VIP_CAPACITY_PLACEMENT_CODE) {
      return VIP_CAPACITY_CAMPAIGN_STATUSES;
    }
    return CAPACITY_CAMPAIGN_STATUSES;
  }

  usesSharedCapacity(placementCode: string): boolean {
    return SCOPED_AVAILABILITY_PLACEMENTS.has(placementCode);
  }

  async resolveMaxActiveCampaigns(
    db: DbLike,
    scope: CapacityScope,
  ): Promise<number> {
    const cityConfig = await db.adPlacementCityConfig.findUnique({
      where: {
        placementId_cityId: {
          placementId: scope.placementId,
          cityId: scope.cityId,
        },
      },
    });
    if (cityConfig?.maxActiveCampaigns != null) {
      return cityConfig.maxActiveCampaigns;
    }
    const placement = await db.adPlacement.findUnique({
      where: { id: scope.placementId },
      select: { maxActiveCampaigns: true },
    });
    return placement?.maxActiveCampaigns ?? 0;
  }

  private buildInventoryWhere(
    scope: CapacityScope,
    windowStart: Date,
    windowEnd: Date,
    statuses: readonly AdCampaignStatus[],
    now: Date,
  ): Prisma.AdCampaignWhereInput {
    const where: Prisma.AdCampaignWhereInput = {
      status: { in: [...statuses] },
      cityId: scope.cityId,
      startAt: { lt: windowEnd },
      endAt: { gt: windowStart },
      campaignPlacements: { some: { placementId: scope.placementId } },
    };
    if (scope.placementCode === 'CATEGORY_TOP') {
      where.categoryId = scope.categoryId ?? undefined;
    }
    return where;
  }

  private buildReservationWhere(
    scope: CapacityScope,
    windowStart: Date,
    windowEnd: Date,
    now: Date,
    excludeOrderId?: string,
  ): Prisma.AdInventoryReservationWhereInput {
    return {
      placementId: scope.placementId,
      cityId: scope.cityId,
      status: AdInventoryReservationStatus.HELD,
      expiresAt: { gt: now },
      startAt: { lt: windowEnd },
      endAt: { gt: windowStart },
      ...(scope.placementCode === 'CATEGORY_TOP'
        ? { categoryId: scope.categoryId ?? undefined }
        : {}),
      ...(excludeOrderId ? { orderId: { not: excludeOrderId } } : {}),
    };
  }

  async countInventoryUsage(
    db: DbLike,
    scope: CapacityScope,
    windowStart: Date,
    windowEnd: Date,
    now = new Date(),
    excludeOrderId?: string,
  ): Promise<number> {
    if (!this.usesSharedCapacity(scope.placementCode)) {
      return 0;
    }

    const statuses = this.resolveCapacityStatuses(scope.placementCode);
    const [campaignCount, reservationCount] = await Promise.all([
      db.adCampaign.count({
        where: this.buildInventoryWhere(scope, windowStart, windowEnd, statuses, now),
      }),
      db.adInventoryReservation.count({
        where: this.buildReservationWhere(
          scope,
          windowStart,
          windowEnd,
          now,
          excludeOrderId,
        ),
      }),
    ]);
    return campaignCount + reservationCount;
  }

  async isWindowAvailable(
    db: DbLike,
    scope: CapacityScope,
    windowStart: Date,
    windowEnd: Date,
    now = new Date(),
    excludeOrderId?: string,
  ): Promise<boolean> {
    if (!this.usesSharedCapacity(scope.placementCode)) {
      return true;
    }
    const max = await this.resolveMaxActiveCampaigns(db, scope);
    const used = await this.countInventoryUsage(
      db,
      scope,
      windowStart,
      windowEnd,
      now,
      excludeOrderId,
    );
    return used < max;
  }

  /** Earliest end among overlapping inventory consumers (for bumping start). */
  async findEarliestOverlappingRelease(
    db: DbLike,
    scope: CapacityScope,
    windowStart: Date,
    windowEnd: Date,
    now = new Date(),
    excludeOrderId?: string,
  ): Promise<Date | null> {
    if (!this.usesSharedCapacity(scope.placementCode)) {
      return null;
    }
    const statuses = this.resolveCapacityStatuses(scope.placementCode);
    const [campaign, reservation] = await Promise.all([
      db.adCampaign.findFirst({
        where: this.buildInventoryWhere(scope, windowStart, windowEnd, statuses, now),
        orderBy: { endAt: 'asc' },
        select: { endAt: true },
      }),
      db.adInventoryReservation.findFirst({
        where: this.buildReservationWhere(
          scope,
          windowStart,
          windowEnd,
          now,
          excludeOrderId,
        ),
        orderBy: { endAt: 'asc' },
        select: { endAt: true },
      }),
    ]);
    const dates = [campaign?.endAt, reservation?.endAt].filter(Boolean) as Date[];
    if (!dates.length) return null;
    return dates.reduce((min, d) => (d < min ? d : min));
  }
}
