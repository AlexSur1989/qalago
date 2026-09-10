import { Injectable } from '@nestjs/common';
import { MonetizationProductType, PromotionPackage } from '@prisma/client';
import { PRODUCT_PLACEMENT_MAP } from './constants/monetization.constants';
import { CampaignStatusService } from './campaign-status.service';
import { PurchaseSchedulingService } from './purchase-scheduling.service';
import {
  PACKAGE_SNAPSHOT_SCHEMA_VERSION,
  PackageSnapshotV1,
  ProductLineSnapshotV1,
} from './types/package-snapshot.types';

type PackageWithItems = PromotionPackage & {
  items: Array<{
    productId: string;
    durationHours: number | null;
    durationDays: number | null;
    product: { id: string; code: string; type: MonetizationProductType };
  }>;
};

@Injectable()
export class PackageSnapshotService {
  constructor(
    private readonly scheduling: PurchaseSchedulingService,
    private readonly campaignStatus: CampaignStatusService,
  ) {}

  async buildPackageSnapshot(
    db: Parameters<PurchaseSchedulingService['resolveProjectedPeriod']>[0],
    input: {
      pkg: PackageWithItems;
      businessId: string;
      cityId: string;
      categoryId: string;
      promotionId?: string | null;
      creativeId?: string | null;
      desiredStartAt?: Date | null;
      currency: string;
      packageBasePrice: number;
      packageDiscountPercent: number;
      packageDiscountAmount: number;
      packageFinalPrice: number;
      excludeOrderId?: string;
    },
  ): Promise<PackageSnapshotV1> {
    const requestedStart = input.desiredStartAt ?? new Date();
    const items = [];

    for (const row of input.pkg.items) {
      const placementCode = PRODUCT_PLACEMENT_MAP[row.product.type];
      if (!placementCode) continue;

      const period = await this.scheduling.resolveProjectedPeriod(db, {
        productType: row.product.type,
        businessId: input.businessId,
        cityId: input.cityId,
        categoryId: input.categoryId,
        promotionId:
          row.product.type === MonetizationProductType.PROMOTED_PROMOTION
            ? input.promotionId
            : undefined,
        desiredStartAt: requestedStart,
        durationHours: row.durationHours,
        durationDays: row.durationDays,
        excludeOrderId: input.excludeOrderId,
      });
      if (!period) continue;

      items.push({
        productId: row.product.id,
        productCode: row.product.code,
        productType: row.product.type,
        placementCode,
        durationHours: row.durationHours,
        durationDays: row.durationDays,
        requestedStartAt: period.requestedStartAt.toISOString(),
        projectedStartAt: period.projectedStartAt.toISOString(),
        projectedEndAt: period.projectedEndAt.toISOString(),
        conflictResolvedBy: period.conflictResolvedBy,
        promotionId:
          row.product.type === MonetizationProductType.PROMOTED_PROMOTION
            ? input.promotionId ?? null
            : null,
        categoryId:
          row.product.type === MonetizationProductType.TOP_CATEGORY ||
          row.product.type === MonetizationProductType.BOOST
            ? input.categoryId
            : null,
        requiresCreative: this.campaignStatus.requiresCreative(row.product.type),
      });
    }

    return {
      schemaVersion: PACKAGE_SNAPSHOT_SCHEMA_VERSION,
      packageCode: input.pkg.code,
      packageName: input.pkg.name,
      packageCatalogUpdatedAt: input.pkg.updatedAt.toISOString(),
      cityId: input.cityId,
      categoryId: input.categoryId,
      promotionId: input.promotionId ?? null,
      creativeId: input.creativeId ?? null,
      currency: input.currency,
      packageBasePrice: input.packageBasePrice,
      packageDiscountPercent: input.packageDiscountPercent,
      packageDiscountAmount: input.packageDiscountAmount,
      packageFinalPrice: input.packageFinalPrice,
      capturedAt: new Date().toISOString(),
      items,
    };
  }

  async buildProductLineSnapshot(
    db: Parameters<PurchaseSchedulingService['resolveProjectedPeriod']>[0],
    input: {
      productCode: string;
      productType: MonetizationProductType;
      businessId: string;
      cityId: string;
      categoryId?: string | null;
      promotionId?: string | null;
      creativeId?: string | null;
      desiredStartAt?: Date | null;
      durationHours?: number | null;
      durationDays?: number | null;
      excludeOrderId?: string;
    },
  ): Promise<ProductLineSnapshotV1 | null> {
    const placementCode = PRODUCT_PLACEMENT_MAP[input.productType];
    if (!placementCode) return null;

    const period = await this.scheduling.resolveProjectedPeriod(db, input);
    if (!period) return null;

    return {
      schemaVersion: PACKAGE_SNAPSHOT_SCHEMA_VERSION,
      productCode: input.productCode,
      productType: input.productType,
      placementCode,
      requestedStartAt: period.requestedStartAt.toISOString(),
      projectedStartAt: period.projectedStartAt.toISOString(),
      projectedEndAt: period.projectedEndAt.toISOString(),
      conflictResolvedBy: period.conflictResolvedBy,
      durationHours: input.durationHours ?? null,
      durationDays: input.durationDays ?? null,
      promotionId: input.promotionId ?? null,
      categoryId: input.categoryId ?? null,
      creativeId: input.creativeId ?? null,
    };
  }
}
