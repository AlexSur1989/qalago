import { Injectable } from '@nestjs/common';
import {
  AdCampaignStatus,
  MonetizationProductType,
  Prisma,
} from '@prisma/client';
import {
  CAPACITY_CAMPAIGN_STATUSES,
  PRODUCT_PLACEMENT_MAP,
  VIP_CAPACITY_CAMPAIGN_STATUSES,
  VIP_CAPACITY_PLACEMENT_CODE,
} from './constants/monetization.constants';

export type PurchaseScope = {
  businessId: string;
  cityId: string;
  placementCode: string;
  categoryId?: string | null;
  promotionId?: string | null;
};

type DbClient = Prisma.TransactionClient | { adCampaign: Prisma.TransactionClient['adCampaign'] };

/** Statuses that represent an active paid/reserved ad effect for same-business overlap (6.7B). */
export function resolveScopeConflictStatuses(
  productType: MonetizationProductType,
): AdCampaignStatus[] {
  const base = [...CAPACITY_CAMPAIGN_STATUSES] as AdCampaignStatus[];
  if (productType === MonetizationProductType.VIP_BANNER) {
    return [...VIP_CAPACITY_CAMPAIGN_STATUSES] as AdCampaignStatus[];
  }
  return base;
}

@Injectable()
export class PurchaseScopeService {
  resolveScope(input: {
    productType: MonetizationProductType;
    businessId: string;
    cityId: string;
    categoryId?: string | null;
    promotionId?: string | null;
  }): PurchaseScope | null {
    const placementCode = PRODUCT_PLACEMENT_MAP[input.productType];
    if (!placementCode) return null;

    const scope: PurchaseScope = {
      businessId: input.businessId,
      cityId: input.cityId,
      placementCode,
    };

    switch (input.productType) {
      case MonetizationProductType.TOP_CATEGORY:
      case MonetizationProductType.BOOST:
        scope.categoryId = input.categoryId ?? null;
        break;
      case MonetizationProductType.PROMOTED_PROMOTION:
        scope.promotionId = input.promotionId ?? null;
        break;
      default:
        break;
    }

    return scope;
  }

  async findOverlappingScopedCampaign(
    db: DbClient,
    input: {
      productType: MonetizationProductType;
      scope: PurchaseScope;
      desiredStartAt: Date;
      desiredEndAt: Date;
      placementId: string;
    },
  ) {
    const statuses = resolveScopeConflictStatuses(input.productType);
    const where: Prisma.AdCampaignWhereInput = {
      businessId: input.scope.businessId,
      cityId: input.scope.cityId,
      status: { in: statuses },
      startAt: { lt: input.desiredEndAt },
      endAt: { gt: input.desiredStartAt },
      campaignPlacements: { some: { placementId: input.placementId } },
    };

    if (
      input.productType === MonetizationProductType.TOP_CATEGORY ||
      input.productType === MonetizationProductType.BOOST
    ) {
      where.categoryId = input.scope.categoryId ?? undefined;
    }

    if (input.productType === MonetizationProductType.PROMOTED_PROMOTION) {
      if (!input.scope.promotionId) return null;
      where.product = { type: MonetizationProductType.PROMOTED_PROMOTION };
      where.orderItem = {
        metadata: {
          path: ['promotionId'],
          equals: input.scope.promotionId,
        },
      };
    }

    return db.adCampaign.findFirst({
      where,
      orderBy: { endAt: 'desc' },
      select: {
        id: true,
        status: true,
        startAt: true,
        endAt: true,
      },
    });
  }

  placementUsesVipCapacity(placementCode: string): boolean {
    return placementCode === VIP_CAPACITY_PLACEMENT_CODE;
  }
}
