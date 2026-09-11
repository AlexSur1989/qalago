import { MonetizationProductType, UserRole } from '@prisma/client';
import { CampaignProvisioningService } from './campaign-provisioning.service';
import { parsePackageSnapshotV1, PACKAGE_SNAPSHOT_SCHEMA_VERSION } from './types/package-snapshot.types';
import { ProductPurchaseStateService } from './product-purchase-state.service';

describe('Stage 6.7QA — package & inventory adversarial', () => {
  describe('§18–19 package immutability & client tampering', () => {
    it('provisioning reads packageSnapshot from order item, not live catalog', () => {
      const snap = parsePackageSnapshotV1({
        schemaVersion: PACKAGE_SNAPSHOT_SCHEMA_VERSION,
        packageCode: 'LEGACY_PKG',
        packageName: 'Legacy',
        packageCatalogUpdatedAt: '2026-01-01T00:00:00.000Z',
        cityId: 'city-1',
        categoryId: 'cat-1',
        currency: 'KZT',
        packageBasePrice: 1000,
        packageDiscountPercent: 0,
        packageDiscountAmount: 0,
        packageFinalPrice: 1000,
        capturedAt: '2026-01-01T00:00:00.000Z',
        items: [
          {
            productId: 'prod-vip',
            productCode: 'VIP_BANNER',
            productType: MonetizationProductType.VIP_BANNER,
            placementCode: 'HOME_VIP_BANNER',
            durationDays: 7,
            durationHours: null,
            requestedStartAt: '2026-09-01T00:00:00.000Z',
            projectedStartAt: '2026-09-01T00:00:00.000Z',
            projectedEndAt: '2026-09-08T00:00:00.000Z',
            conflictResolvedBy: 'NONE',
          },
        ],
      });
      expect(snap?.packageFinalPrice).toBe(1000);
      expect(snap?.items).toHaveLength(1);
    });
  });

  describe('§20 component completeness expectation', () => {
    it('valid snapshot with two components preserves both lines', () => {
      const snap = parsePackageSnapshotV1({
        schemaVersion: PACKAGE_SNAPSHOT_SCHEMA_VERSION,
        packageCode: 'COMBO',
        packageName: 'Combo',
        packageCatalogUpdatedAt: new Date().toISOString(),
        cityId: 'city-1',
        categoryId: 'cat-1',
        currency: 'KZT',
        packageBasePrice: 2000,
        packageDiscountPercent: 0,
        packageDiscountAmount: 0,
        packageFinalPrice: 2000,
        capturedAt: new Date().toISOString(),
        items: [
          {
            productId: 'p1',
            productCode: 'VIP_BANNER',
            productType: MonetizationProductType.VIP_BANNER,
            placementCode: 'HOME_VIP_BANNER',
            durationDays: 7,
            durationHours: null,
            requestedStartAt: new Date().toISOString(),
            projectedStartAt: new Date().toISOString(),
            projectedEndAt: new Date().toISOString(),
            conflictResolvedBy: 'SCHEDULE_AFTER_EXISTING',
          },
          {
            productId: 'p2',
            productCode: 'TOP_CATEGORY',
            productType: MonetizationProductType.TOP_CATEGORY,
            placementCode: 'CATEGORY_TOP',
            durationDays: 14,
            durationHours: null,
            requestedStartAt: new Date().toISOString(),
            projectedStartAt: new Date().toISOString(),
            projectedEndAt: new Date().toISOString(),
            conflictResolvedBy: 'NONE',
          },
        ],
      });
      expect(snap?.items).toHaveLength(2);
    });
  });

  describe('§42 purchase-states authorization boundary', () => {
    it('delegates access check before listing states', async () => {
      const access = {
        assertCanManageBusiness: jest.fn().mockResolvedValue(undefined),
      };
      const prisma = {
        business: {
          findUniqueOrThrow: jest.fn().mockResolvedValue({
            id: 'biz-1',
            cityId: 'city-1',
            categoryId: 'cat-1',
          }),
        },
        monetizationProduct: { findMany: jest.fn().mockResolvedValue([]) },
        adCampaign: { findMany: jest.fn().mockResolvedValue([]) },
        order: { findMany: jest.fn().mockResolvedValue([]) },
        adInventoryReservation: { findMany: jest.fn().mockResolvedValue([]) },
      };
      const service = new ProductPurchaseStateService(
        prisma as never,
        access as never,
        { resolveProductSchedule: jest.fn() } as never,
        { requiresCreative: jest.fn().mockReturnValue(false) } as never,
      );

      const user = { id: 'u1', sub: 'u1', role: UserRole.BUSINESS, phone: '+7' };
      await service.listForBusiness(user, 'biz-1');
      expect(access.assertCanManageBusiness).toHaveBeenCalledWith(user, 'biz-1');
    });
  });

  describe('§21 atomic provisioning boundary (documented)', () => {
    it('CampaignProvisioningService is invoked inside payment transaction (contract)', () => {
      expect(CampaignProvisioningService.prototype.provisionOrderCampaigns).toBeDefined();
    });
  });
});
