import {
  AdCampaignStatus,
  MonetizationProductType,
  OrderStatus,
  PromotionStatus,
  UserRole,
} from '@prisma/client';
import { PurchaseSchedulingService } from './purchase-scheduling.service';
import { PurchaseScopeService } from './purchase-scope.service';
import { PlacementCapacityService } from './placement-capacity.service';
import { PurchaseIntegrityService } from './purchase-integrity.service';
import { OrderService } from './order.service';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MonetizationAccessService } from './monetization-access.service';
import { PricingService } from './pricing.service';
import { CampaignProvisioningService } from './campaign-provisioning.service';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import {
  createMockInventoryReservationService,
  createMockPackageSnapshotService,
} from './test-utils/mock-order-deps-6-7c';
import { MonetizationErrorCode } from './errors/monetization.errors';
import { CreateOrderDto } from './dto/monetization.dto';

describe('Stage 6.7QA — purchase adversarial', () => {
  describe('§12 half-open schedule boundaries', () => {
    const purchaseScope = new PurchaseScopeService();
    const availability = {
      addDuration: (start: Date, _h?: number | null, days?: number | null) => {
        const end = new Date(start);
        if (days) end.setUTCDate(end.getUTCDate() + days);
        return end;
      },
    } as unknown as AvailabilityService;

    function harness() {
      const prisma = {
        adPlacement: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'pl-boost',
            code: 'CATEGORY_BOOST',
            isActive: true,
            maxActiveCampaigns: 99,
          }),
        },
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

    it('new period starting exactly at existing.end does not overlap', async () => {
      const { prisma, scheduling } = harness();
      prisma.adCampaign.findFirst = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const period = await scheduling.resolveProjectedPeriod(
        prisma,
        {
          productType: MonetizationProductType.BOOST,
          businessId: 'biz-1',
          cityId: 'city-1',
          categoryId: 'cat-1',
          durationDays: 10,
          desiredStartAt: new Date('2026-09-20T00:00:00.000Z'),
        },
        new Date('2026-09-01T00:00:00.000Z'),
      );

      expect(period!.projectedStartAt.toISOString()).toBe('2026-09-20T00:00:00.000Z');
      expect(period!.projectedEndAt.toISOString()).toBe('2026-09-30T00:00:00.000Z');
      expect(period!.conflictResolvedBy).toBe('NONE');
    });

    it('§13 renewal chain appends after latest end (24 → 31)', async () => {
      const { prisma, scheduling } = harness();
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
      expect(period!.projectedEndAt.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    });
  });

  describe('§5 idempotency semantics', () => {
    it('same idempotencyKey returns stored order even if line items differ (key-scoped replay)', async () => {
      const purchaseIntegrity = {
        findReusablePendingOrder: jest.fn().mockResolvedValue(null),
        findOrderByIdempotencyKey: jest.fn(),
        acquirePurchaseIntentLock: jest.fn(),
        assertCategoryEligibleForBusiness: jest.fn(),
        assertPromotionEligible: jest.fn(),
        assertProductPurchaseAllowed: jest.fn(),
        resolveProductSchedule: jest.fn(),
        acquirePlacementScopeLock: jest.fn(),
      } as unknown as PurchaseIntegrityService;

      const prisma = {
        monetizationProduct: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'p1',
            code: 'TOP_CATEGORY',
            type: MonetizationProductType.TOP_CATEGORY,
            isActive: true,
          }),
        },
        $transaction: jest.fn(),
      } as unknown as PrismaService;

      const access = {
        assertCanManageBusiness: jest.fn().mockResolvedValue({
          cityId: 'city-1',
          categoryId: 'cat-1',
        }),
      } as unknown as MonetizationAccessService;

      const service = new OrderService(
        prisma,
        access,
        {
          priceProductLine: jest.fn().mockResolvedValue({
            basePrice: 4900,
            discountPercent: 0,
            discountAmount: 0,
            finalPrice: 4900,
            currency: 'KZT',
            productPriceId: 'p1',
          }),
        } as unknown as PricingService,
        {
          addDuration: jest.fn((start: Date) => new Date(start.getTime() + 86400000 * 7)),
        } as unknown as AvailabilityService,
        {} as CampaignProvisioningService,
        asAuditLogService(createMockAuditLog()),
        purchaseIntegrity,
        createMockPackageSnapshotService(),
        createMockInventoryReservationService(),
      );

      const replayOrder = {
        id: 'ord-replay',
        orderNumber: 'QLG-REPLAY',
        status: OrderStatus.AWAITING_PAYMENT,
        subtotal: 4900,
        discountAmount: 0,
        totalAmount: 4900,
        currency: 'KZT',
        createdAt: new Date(),
        paidAt: null,
        items: [{ product: { code: 'TOP_CATEGORY' } }],
        payments: [],
      };

      prisma.$transaction = jest.fn().mockImplementation(async (fn) => {
        purchaseIntegrity.findOrderByIdempotencyKey = jest.fn().mockResolvedValue({
          order: replayOrder,
        });
        return fn({});
      });

      const user = { id: 'u1', role: UserRole.BUSINESS, phone: '+7', sub: 'u1' };
      const result = await service.createOrder(user, {
        businessId: 'biz-1',
        idempotencyKey: 'idem-qa-key-12345678',
        items: [{ productCode: 'BOOST', durationDays: 7 }],
      });

      expect(result.idempotentReplay).toBe(true);
      expect(result.id).toBe('ord-replay');
    });
  });

  describe('§16–17 cross-business and category attacks', () => {
    const prisma = {
      promotion: { findFirst: jest.fn() },
    } as unknown as PrismaService;
    const scheduling = {} as PurchaseSchedulingService;
    const capacity = {} as import('./placement-capacity.service').PlacementCapacityService;
    const integrity = new PurchaseIntegrityService(prisma, scheduling, capacity);

    it('rejects promotionId owned by another business', async () => {
      prisma.promotion.findFirst = jest.fn().mockResolvedValue(null);
      await expect(
        integrity.assertPromotionEligible('biz-a', 'promo-owned-by-b'),
      ).rejects.toMatchObject({
        response: { code: MonetizationErrorCode.PROMOTION_NOT_OWNED },
      });
    });

    it('rejects inactive promotion', async () => {
      prisma.promotion.findFirst = jest.fn().mockResolvedValue({
        id: 'promo-1',
        status: PromotionStatus.DRAFT,
      });
      await expect(
        integrity.assertPromotionEligible('biz-a', 'promo-1'),
      ).rejects.toMatchObject({
        response: { code: MonetizationErrorCode.PROMOTION_NOT_ELIGIBLE },
      });
    });
  });

  describe('§8 category capacity scope (CATEGORY_TOP)', () => {
    it('inventory count filters by categoryId for CATEGORY_TOP', async () => {
      const prisma = {
        adPlacementCityConfig: { findUnique: jest.fn().mockResolvedValue(null) },
        adPlacement: { findUnique: jest.fn().mockResolvedValue({ maxActiveCampaigns: 2 }) },
        adCampaign: {
          count: jest.fn().mockImplementation(({ where }) => {
            expect(where.categoryId).toBe('cat-food');
            expect(where.cityId).toBe('city-1');
            return Promise.resolve(2);
          }),
        },
        adInventoryReservation: { count: jest.fn().mockResolvedValue(0) },
      } as unknown as PrismaService;
      const service = new PlacementCapacityService(prisma);
      await service.countInventoryUsage(
        prisma,
        {
          placementId: 'pl-top',
          placementCode: 'CATEGORY_TOP',
          cityId: 'city-1',
          categoryId: 'cat-food',
        },
        new Date('2026-09-01'),
        new Date('2026-09-08'),
      );
    });
  });

  describe('§25 generic city (no Uralsk hardcode)', () => {
    it('resolves capacity for arbitrary city id', async () => {
      const prisma = {
        adPlacementCityConfig: {
          findUnique: jest.fn().mockResolvedValue({ maxActiveCampaigns: 5 }),
        },
        adPlacement: { findUnique: jest.fn() },
      } as unknown as PrismaService;
      const service = new PlacementCapacityService(prisma);
      const max = await service.resolveMaxActiveCampaigns(prisma, {
        placementId: 'pl-1',
        placementCode: 'HOME_VIP_BANNER',
        cityId: 'city-qa-generic-001',
      });
      expect(max).toBe(5);
    });
  });

  describe('§19 client snapshot tampering surface', () => {
    it('CreateOrderDto has no packageSnapshot or lineSnapshot fields', () => {
      const dto = new CreateOrderDto();
      expect(Object.prototype.hasOwnProperty.call(dto, 'packageSnapshot')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(dto, 'lineSnapshot')).toBe(false);
    });
  });

  describe('§3 purchase matrix scope coverage', () => {
    const scope = new PurchaseScopeService();
    const placements: Array<{
      type: MonetizationProductType;
      code: string;
      category?: boolean;
      promotion?: boolean;
    }> = [
      { type: MonetizationProductType.VIP_BANNER, code: 'HOME_VIP_BANNER' },
      { type: MonetizationProductType.TOP_CATEGORY, code: 'CATEGORY_TOP', category: true },
      { type: MonetizationProductType.BOOST, code: 'CATEGORY_BOOST', category: true },
      { type: MonetizationProductType.FEATURED_BUSINESS, code: 'HOME_FEATURED' },
      {
        type: MonetizationProductType.PROMOTED_PROMOTION,
        code: 'HOME_PROMOTIONS',
        promotion: true,
      },
    ];

    it.each(placements)('$code resolves deterministic purchase scope', (row) => {
      const resolved = scope.resolveScope({
        productType: row.type,
        businessId: 'biz-1',
        cityId: 'city-1',
        categoryId: row.category ? 'cat-1' : undefined,
        promotionId: row.promotion ? 'promo-1' : undefined,
      });
      expect(resolved?.placementCode).toBe(row.code);
      expect(resolved?.cityId).toBe('city-1');
    });
  });
});
