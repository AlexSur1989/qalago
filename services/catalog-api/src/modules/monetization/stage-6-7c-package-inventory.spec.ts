import {
  AdCampaignStatus,
  AdInventoryReservationStatus,
  MonetizationProductType,
} from '@prisma/client';
import { PlacementCapacityService } from './placement-capacity.service';
import { PurchaseSchedulingService } from './purchase-scheduling.service';
import { PurchaseScopeService } from './purchase-scope.service';
import {
  parsePackageSnapshotV1,
  PACKAGE_SNAPSHOT_SCHEMA_VERSION,
} from './types/package-snapshot.types';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('Stage 6.7C — package + city inventory integrity', () => {
  describe('A. package snapshot parsing', () => {
    it('rejects untrusted / invalid snapshot payloads', () => {
      expect(parsePackageSnapshotV1(null)).toBeNull();
      expect(parsePackageSnapshotV1({ schemaVersion: 99 })).toBeNull();
      expect(parsePackageSnapshotV1({ schemaVersion: PACKAGE_SNAPSHOT_SCHEMA_VERSION })).toBeNull();
    });

    it('accepts valid PackageSnapshotV1', () => {
      const snap = parsePackageSnapshotV1({
        schemaVersion: PACKAGE_SNAPSHOT_SCHEMA_VERSION,
        packageCode: 'START',
        packageName: 'Start',
        packageCatalogUpdatedAt: new Date().toISOString(),
        cityId: 'city-1',
        categoryId: 'cat-1',
        currency: 'KZT',
        packageBasePrice: 100,
        packageDiscountPercent: 0,
        packageDiscountAmount: 0,
        packageFinalPrice: 100,
        capturedAt: new Date().toISOString(),
        items: [],
      });
      expect(snap?.packageCode).toBe('START');
    });
  });

  describe('K. city-specific capacity config', () => {
    it('uses AdPlacementCityConfig when present, else placement default', async () => {
      const prisma = {
        adPlacementCityConfig: {
          findUnique: jest.fn().mockResolvedValue({ maxActiveCampaigns: 10 }),
        },
        adPlacement: { findUnique: jest.fn().mockResolvedValue({ maxActiveCampaigns: 3 }) },
      } as unknown as PrismaService;
      const service = new PlacementCapacityService(prisma);
      const max = await service.resolveMaxActiveCampaigns(prisma, {
        placementId: 'pl-1',
        placementCode: 'HOME_VIP_BANNER',
        cityId: 'city-atyrau',
      });
      expect(max).toBe(10);
    });
  });

  describe('C–H. business-scope scheduling', () => {
    const purchaseScope = new PurchaseScopeService();
    const availability = {
      addDuration: (start: Date, _h?: number | null, days?: number | null) => {
        const end = new Date(start);
        if (days) end.setUTCDate(end.getUTCDate() + days);
        return end;
      },
    } as unknown as AvailabilityService;

    function schedulingHarness() {
      const prisma = {
        adPlacement: { findUnique: jest.fn() },
        adPlacementCityConfig: { findUnique: jest.fn().mockResolvedValue(null) },
        adCampaign: { findFirst: jest.fn(), count: jest.fn().mockResolvedValue(0) },
        adInventoryReservation: {
          count: jest.fn().mockResolvedValue(0),
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as unknown as PrismaService;
      const capacity = new PlacementCapacityService(prisma);
      const scheduling = new PurchaseSchedulingService(
        availability,
        purchaseScope,
        capacity,
      );
      return { prisma, scheduling };
    }

    it('C. VIP active → package VIP component scheduled after active end', async () => {
      const { prisma, scheduling } = schedulingHarness();
      prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
        id: 'pl-vip',
        code: 'HOME_VIP_BANNER',
        isActive: true,
        maxActiveCampaigns: 3,
      });
      prisma.adCampaign.findFirst = jest
        .fn()
        .mockResolvedValueOnce({ endAt: new Date('2026-09-20T00:00:00.000Z') })
        .mockResolvedValueOnce(null);

      const period = await scheduling.resolveProjectedPeriod(
        prisma,
        {
          productType: MonetizationProductType.VIP_BANNER,
          businessId: 'biz-1',
          cityId: 'city-1',
          durationDays: 7,
          desiredStartAt: new Date('2026-09-10T00:00:00.000Z'),
        },
        new Date('2026-09-01T00:00:00.000Z'),
      );

      expect(period!.projectedStartAt.toISOString()).toBe('2026-09-20T00:00:00.000Z');
      expect(period!.conflictResolvedBy).toBe('SCHEDULE_AFTER_EXISTING');
    });

    it('D. append after latest scheduled VIP in chain', async () => {
      const { prisma, scheduling } = schedulingHarness();
      prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
        id: 'pl-vip',
        code: 'HOME_VIP_BANNER',
        isActive: true,
        maxActiveCampaigns: 3,
      });
      prisma.adCampaign.findFirst = jest
        .fn()
        .mockResolvedValueOnce({ endAt: new Date('2026-09-24T00:00:00.000Z') })
        .mockResolvedValueOnce(null);

      const period = await scheduling.resolveProjectedPeriod(
        prisma,
        {
          productType: MonetizationProductType.VIP_BANNER,
          businessId: 'biz-1',
          cityId: 'city-1',
          durationDays: 7,
          desiredStartAt: new Date('2026-09-10T00:00:00.000Z'),
        },
        new Date('2026-09-01T00:00:00.000Z'),
      );

      expect(period!.projectedStartAt.toISOString()).toBe('2026-09-24T00:00:00.000Z');
    });

    it('H. HOME_PROMOTIONS different promotionId scopes independently', async () => {
      const scopeA = purchaseScope.resolveScope({
        productType: MonetizationProductType.PROMOTED_PROMOTION,
        businessId: 'biz-1',
        cityId: 'city-1',
        promotionId: 'promo-a',
      });
      const scopeB = purchaseScope.resolveScope({
        productType: MonetizationProductType.PROMOTED_PROMOTION,
        businessId: 'biz-1',
        cityId: 'city-1',
        promotionId: 'promo-b',
      });
      expect(scopeA?.promotionId).not.toBe(scopeB?.promotionId);
    });
  });

  describe('M. expired HELD reservations do not consume capacity', () => {
    it('counts only non-expired HELD reservations', async () => {
      const prisma = {
        adPlacementCityConfig: { findUnique: jest.fn().mockResolvedValue(null) },
        adPlacement: { findUnique: jest.fn().mockResolvedValue({ maxActiveCampaigns: 2 }) },
        adCampaign: { count: jest.fn().mockResolvedValue(1) },
        adInventoryReservation: {
          count: jest.fn().mockImplementation(({ where }) => {
            expect(where.status).toBe(AdInventoryReservationStatus.HELD);
            expect(where.expiresAt.gt).toBeInstanceOf(Date);
            return Promise.resolve(0);
          }),
        },
      } as unknown as PrismaService;
      const service = new PlacementCapacityService(prisma);
      const used = await service.countInventoryUsage(
        prisma,
        {
          placementId: 'pl-vip',
          placementCode: 'HOME_VIP_BANNER',
          cityId: 'city-1',
        },
        new Date('2026-09-05'),
        new Date('2026-09-12'),
        new Date('2026-09-06'),
      );
      expect(used).toBe(1);
    });
  });

  describe('J. cross-city capacity isolation', () => {
    it('city A full does not affect city B query filters', async () => {
      const prisma = {
        adPlacementCityConfig: { findUnique: jest.fn().mockResolvedValue(null) },
        adPlacement: { findUnique: jest.fn().mockResolvedValue({ maxActiveCampaigns: 1 }) },
        adCampaign: {
          count: jest.fn().mockImplementation(({ where }) => {
            expect(where.cityId).toBe('city-b');
            return Promise.resolve(0);
          }),
        },
        adInventoryReservation: { count: jest.fn().mockResolvedValue(0) },
      } as unknown as PrismaService;
      const service = new PlacementCapacityService(prisma);
      const ok = await service.isWindowAvailable(
        prisma,
        {
          placementId: 'pl-vip',
          placementCode: 'HOME_VIP_BANNER',
          cityId: 'city-b',
        },
        new Date('2026-09-05'),
        new Date('2026-09-12'),
      );
      expect(ok).toBe(true);
    });
  });
});
