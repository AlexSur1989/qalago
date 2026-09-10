import { MonetizationProductType } from '@prisma/client';
import { PRODUCT_PLACEMENT_MAP } from '../constants/monetization.constants';
import { PACKAGE_SNAPSHOT_SCHEMA_VERSION } from '../types/package-snapshot.types';
import { PackageSnapshotService } from '../package-snapshot.service';
import { InventoryReservationService } from '../inventory-reservation.service';

export function createMockPackageSnapshotService(): PackageSnapshotService {
  return {
    buildPackageSnapshot: jest.fn().mockImplementation(async (_db, input) => {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      const items = input.pkg.items.map(
        (row: {
          product: { id: string; code: string; type: MonetizationProductType };
          durationDays: number | null;
          durationHours: number | null;
        }) => ({
          productId: row.product.id,
          productCode: row.product.code,
          productType: row.product.type,
          placementCode: PRODUCT_PLACEMENT_MAP[row.product.type] ?? 'UNKNOWN',
          durationDays: row.durationDays,
          durationHours: row.durationHours,
          requestedStartAt: now.toISOString(),
          projectedStartAt: now.toISOString(),
          projectedEndAt: end.toISOString(),
          conflictResolvedBy: 'NONE' as const,
          promotionId:
            row.product.type === MonetizationProductType.PROMOTED_PROMOTION
              ? input.promotionId
              : undefined,
          categoryId: input.categoryId,
          requiresCreative: row.product.type === MonetizationProductType.VIP_BANNER,
        }),
      );
      return {
        schemaVersion: PACKAGE_SNAPSHOT_SCHEMA_VERSION,
        packageCode: input.pkg.code,
        packageName: input.pkg.name ?? input.pkg.code,
        packageCatalogUpdatedAt: now.toISOString(),
        cityId: input.cityId,
        categoryId: input.categoryId,
        promotionId: input.promotionId,
        creativeId: input.creativeId,
        currency: input.currency,
        packageBasePrice: input.packageBasePrice,
        packageDiscountPercent: input.packageDiscountPercent,
        packageDiscountAmount: input.packageDiscountAmount,
        packageFinalPrice: input.packageFinalPrice,
        capturedAt: now.toISOString(),
        items,
      };
    }),
    buildProductLineSnapshot: jest.fn().mockImplementation(async (_db, input) => {
      const start = input.projectedStartAt ?? new Date();
      const end = input.projectedEndAt ?? new Date();
      return {
        schemaVersion: PACKAGE_SNAPSHOT_SCHEMA_VERSION,
        productCode: input.productCode,
        productType: input.productType,
        placementCode: input.placementCode,
        requestedStartAt: start.toISOString(),
        projectedStartAt: start.toISOString(),
        projectedEndAt: end.toISOString(),
        conflictResolvedBy: 'NONE' as const,
        durationHours: input.durationHours,
        durationDays: input.durationDays,
        promotionId: input.promotionId,
        categoryId: input.categoryId,
        creativeId: input.creativeId,
      };
    }),
  } as unknown as PackageSnapshotService;
}

export function createMockInventoryReservationService(): InventoryReservationService {
  return {
    expireStaleHeldInTransaction: jest.fn().mockResolvedValue(undefined),
    convertHeldForOrder: jest.fn().mockResolvedValue(undefined),
    syncReservationsForOrderItem: jest.fn().mockResolvedValue(undefined),
    refreshOrderReservations: jest.fn().mockResolvedValue(undefined),
    reservationExpiresAt: jest
      .fn()
      .mockReturnValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  } as unknown as InventoryReservationService;
}
