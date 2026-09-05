import { Injectable } from '@nestjs/common';
import { AdCampaignStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CAPACITY_CAMPAIGN_STATUSES,
  PRODUCT_PLACEMENT_MAP,
  SCOPED_AVAILABILITY_PLACEMENTS,
} from './constants/monetization.constants';
import {
  MonetizationErrorCode,
  monetizationBadRequest,
} from './errors/monetization.errors';

export type AvailabilityCheckParams = {
  productType: keyof typeof PRODUCT_PLACEMENT_MAP & string;
  cityId: string;
  categoryId?: string | null;
  desiredStartAt: Date;
  desiredEndAt: Date;
};

export type AvailabilityResult = {
  available: boolean;
  nextAvailableAt?: Date | null;
  placementCode?: string;
  activeCount?: number;
  maxActiveCampaigns?: number;
};

function hashLockKey(parts: string[]): number {
  const str = parts.join(':');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  resolvePlacementCode(productType: string): string | undefined {
    return PRODUCT_PLACEMENT_MAP[productType as keyof typeof PRODUCT_PLACEMENT_MAP];
  }

  async getPlacementByCode(code: string) {
    return this.prisma.adPlacement.findUnique({ where: { code } });
  }

  overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    return aStart < bEnd && aEnd > bStart;
  }

  async checkAvailability(params: AvailabilityCheckParams): Promise<AvailabilityResult> {
    const placementCode = this.resolvePlacementCode(params.productType);
    if (!placementCode) {
      return { available: true };
    }

    if (!SCOPED_AVAILABILITY_PLACEMENTS.has(placementCode)) {
      return { available: true, placementCode };
    }

    const placement = await this.getPlacementByCode(placementCode);
    if (!placement || !placement.isActive) {
      return {
        available: false,
        placementCode,
        nextAvailableAt: null,
      };
    }

    const where: Prisma.AdCampaignWhereInput = {
      status: { in: [...CAPACITY_CAMPAIGN_STATUSES] },
      startAt: { lt: params.desiredEndAt },
      endAt: { gt: params.desiredStartAt },
      campaignPlacements: { some: { placementId: placement.id } },
    };

    if (placementCode === 'CATEGORY_TOP') {
      where.cityId = params.cityId;
      where.categoryId = params.categoryId ?? undefined;
    } else if (placementCode === 'HOME_FEATURED') {
      where.cityId = params.cityId;
    }

    const activeCount = await this.prisma.adCampaign.count({ where });
    const available = activeCount < placement.maxActiveCampaigns;

    let nextAvailableAt: Date | null | undefined;
    if (!available) {
      const earliest = await this.prisma.adCampaign.findFirst({
        where,
        orderBy: { endAt: 'asc' },
        select: { endAt: true },
      });
      nextAvailableAt = earliest?.endAt ?? null;
    }

    return {
      available,
      nextAvailableAt,
      placementCode,
      activeCount,
      maxActiveCampaigns: placement.maxActiveCampaigns,
    };
  }

  async acquirePlacementLock(
    tx: Prisma.TransactionClient,
    placementCode: string,
    cityId: string,
    categoryId?: string | null,
  ) {
    const lockKey = hashLockKey([placementCode, cityId, categoryId ?? '']);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;
  }

  async assertAvailableInTransaction(
    tx: Prisma.TransactionClient,
    params: AvailabilityCheckParams,
  ) {
    const placementCode = this.resolvePlacementCode(params.productType);
    if (!placementCode || !SCOPED_AVAILABILITY_PLACEMENTS.has(placementCode)) {
      return;
    }

    await this.acquirePlacementLock(
      tx,
      placementCode,
      params.cityId,
      params.categoryId,
    );

    const result = await this.checkAvailability(params);
    if (!result.available) {
      monetizationBadRequest(
        MonetizationErrorCode.PLACEMENT_UNAVAILABLE,
        'Placement slot unavailable for selected dates',
      );
    }
  }

  addDuration(start: Date, durationHours?: number | null, durationDays?: number | null): Date {
    const end = new Date(start);
    if (durationHours) {
      end.setHours(end.getHours() + durationHours);
      return end;
    }
    if (durationDays) {
      end.setDate(end.getDate() + durationDays);
      return end;
    }
    monetizationBadRequest(
      MonetizationErrorCode.INVALID_DURATION,
      'durationHours or durationDays required',
    );
  }

  isExpired(endAt: Date, now = new Date()): boolean {
    return endAt <= now;
  }

  resolveEffectiveStatus(
    status: AdCampaignStatus,
    startAt: Date,
    endAt: Date,
    now = new Date(),
  ): AdCampaignStatus {
    if (
      status === AdCampaignStatus.CANCELLED ||
      status === AdCampaignStatus.REJECTED ||
      status === AdCampaignStatus.PAUSED
    ) {
      return status;
    }
    if (this.isExpired(endAt, now)) {
      return AdCampaignStatus.COMPLETED;
    }
    if (
      status === AdCampaignStatus.ACTIVE ||
      status === AdCampaignStatus.SCHEDULED
    ) {
      if (startAt > now) return AdCampaignStatus.SCHEDULED;
      if (startAt <= now && endAt > now) return AdCampaignStatus.ACTIVE;
    }
    return status;
  }
}
