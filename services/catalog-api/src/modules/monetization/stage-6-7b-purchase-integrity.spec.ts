import {
  AdCampaignStatus,
  MonetizationProductType,
  OrderStatus,
  PromotionStatus,
  UserRole,
} from '@prisma/client';
import { ConflictException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { OrderService } from './order.service';
import { PurchaseIntegrityService } from './purchase-integrity.service';
import { PurchaseScopeService } from './purchase-scope.service';
import { MonetizationAccessService } from './monetization-access.service';
import { PricingService } from './pricing.service';
import { CampaignProvisioningService } from './campaign-provisioning.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import {
  buildProductPurchaseIntent,
  orderMatchesPurchaseIntent,
} from './utils/purchase-intent.util';
import { MonetizationErrorCode } from './errors/monetization.errors';

describe('Stage 6.7B — purchase integrity core', () => {
  describe('PurchaseScopeService', () => {
    const service = new PurchaseScopeService();

    it('HOME_VIP_BANNER scope is business + city + placement', () => {
      const scope = service.resolveScope({
        productType: MonetizationProductType.VIP_BANNER,
        businessId: 'biz-1',
        cityId: 'city-1',
      });
      expect(scope?.placementCode).toBe('HOME_VIP_BANNER');
      expect(scope?.categoryId).toBeUndefined();
    });

    it('CATEGORY_TOP scope includes categoryId', () => {
      const scope = service.resolveScope({
        productType: MonetizationProductType.TOP_CATEGORY,
        businessId: 'biz-1',
        cityId: 'city-1',
        categoryId: 'cat-1',
      });
      expect(scope?.categoryId).toBe('cat-1');
    });

    it('HOME_PROMOTIONS scope includes promotionId', () => {
      const scope = service.resolveScope({
        productType: MonetizationProductType.PROMOTED_PROMOTION,
        businessId: 'biz-1',
        cityId: 'city-1',
        promotionId: 'promo-1',
      });
      expect(scope?.promotionId).toBe('promo-1');
    });
  });

  describe('purchase intent dedupe identity', () => {
    it('distinguishes promotionId for HOME_PROMOTIONS pending match', () => {
      const intentA = buildProductPurchaseIntent({
        businessId: 'biz-1',
        productCode: 'PROMOTED_PROMOTION',
        durationDays: 7,
        promotionId: 'promo-a',
      });
      const intentB = buildProductPurchaseIntent({
        businessId: 'biz-1',
        productCode: 'PROMOTED_PROMOTION',
        durationDays: 7,
        promotionId: 'promo-b',
      });
      const order = {
        businessId: 'biz-1',
        items: [
          {
            durationHours: null,
            durationDays: 7,
            metadata: { promotionId: 'promo-a' },
            product: { code: 'PROMOTED_PROMOTION', type: MonetizationProductType.PROMOTED_PROMOTION },
          },
        ],
      };
      expect(orderMatchesPurchaseIntent(order, intentA)).toBe(true);
      expect(orderMatchesPurchaseIntent(order, intentB)).toBe(false);
    });
  });

  describe('PurchaseIntegrityService scope conflicts', () => {
    const prisma = {
      adPlacement: { findUnique: jest.fn() },
      adCampaign: { findFirst: jest.fn(), count: jest.fn() },
      category: { findUnique: jest.fn() },
      promotion: { findFirst: jest.fn() },
    } as unknown as PrismaService;

    const availability = {
      checkAvailability: jest.fn().mockResolvedValue({ available: true }),
    } as unknown as AvailabilityService;

    const purchaseScope = new PurchaseScopeService();
    const service = new PurchaseIntegrityService(prisma, availability, purchaseScope);

    beforeEach(() => jest.clearAllMocks());

    it('blocks overlapping HOME_VIP_BANNER for same business+city', async () => {
      prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
        id: 'pl-vip',
        code: 'HOME_VIP_BANNER',
      });
      prisma.adCampaign.findFirst = jest.fn().mockResolvedValue({
        id: 'camp-1',
        status: AdCampaignStatus.ACTIVE,
        endAt: new Date('2026-09-20'),
      });

      await expect(
        service.assertNoScopeOverlap(prisma, {
          productType: MonetizationProductType.VIP_BANNER,
          businessId: 'biz-1',
          cityId: 'city-1',
          desiredStartAt: new Date('2026-09-12'),
          desiredEndAt: new Date('2026-09-19'),
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('category mismatch rejected on create path helper', async () => {
      await expect(
        service.assertCategoryEligibleForBusiness(
          { id: 'biz-1', categoryId: 'cat-primary' },
          'cat-other',
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('promotion must be ACTIVE', async () => {
      prisma.promotion.findFirst = jest.fn().mockResolvedValue({
        id: 'promo-1',
        status: PromotionStatus.DRAFT,
      });

      await expect(
        service.assertPromotionEligible('biz-1', 'promo-1'),
      ).rejects.toMatchObject({
        response: { code: MonetizationErrorCode.PROMOTION_NOT_ELIGIBLE },
      });
    });
  });

  describe('OrderService pending dedupe + idempotency', () => {
    const prisma = {
      $transaction: jest.fn(),
      business: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
      monetizationProduct: { findUnique: jest.fn() },
      promotion: { findFirst: jest.fn() },
      adCreative: { findFirst: jest.fn() },
    } as unknown as PrismaService;

    const access = {
      assertCanManageBusiness: jest.fn(),
    } as unknown as MonetizationAccessService;

    const pricing = {
      priceProductLine: jest.fn().mockResolvedValue({
        basePrice: 4900,
        discountPercent: 0,
        discountAmount: 0,
        finalPrice: 4900,
        currency: 'KZT',
        productPriceId: 'p1',
      }),
    } as unknown as PricingService;

    const availability = {
      addDuration: jest.fn((start: Date, _h?: number | null, days?: number | null) => {
        const end = new Date(start);
        if (days) end.setDate(end.getDate() + days);
        return end;
      }),
    } as unknown as AvailabilityService;

    const provisioning = {} as CampaignProvisioningService;

    const purchaseIntegrity = {
      assertCategoryEligibleForBusiness: jest.fn().mockResolvedValue(undefined),
      assertPromotionEligible: jest.fn().mockResolvedValue(undefined),
      assertProductPurchaseAllowed: jest.fn().mockResolvedValue(undefined),
      acquirePurchaseIntentLock: jest.fn().mockResolvedValue(undefined),
      findReusablePendingOrder: jest.fn(),
      findOrderByIdempotencyKey: jest.fn(),
    } as unknown as PurchaseIntegrityService;

    const service = new OrderService(
      prisma,
      access,
      pricing,
      availability,
      provisioning,
      asAuditLogService(createMockAuditLog()),
      purchaseIntegrity,
    );

    const user = { id: 'user-1', role: UserRole.BUSINESS, phone: '+7700', sub: 'user-1' };
    const business = { cityId: 'city-1', categoryId: 'cat-1', ownerId: 'user-1' };

    beforeEach(() => {
      jest.clearAllMocks();
      access.assertCanManageBusiness = jest.fn().mockResolvedValue(business);
      purchaseIntegrity.findReusablePendingOrder = jest.fn().mockResolvedValue(null);
      purchaseIntegrity.findOrderByIdempotencyKey = jest.fn().mockResolvedValue(null);
    });

    it('reuses existing AWAITING_PAYMENT order for same intent', async () => {
      prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
        id: 'prod-1',
        code: 'TOP_CATEGORY',
        type: MonetizationProductType.TOP_CATEGORY,
        isActive: true,
      });

      const pendingOrder = {
        id: 'ord-existing',
        orderNumber: 'QLG-EXIST',
        status: OrderStatus.AWAITING_PAYMENT,
        subtotal: 4900,
        discountAmount: 0,
        totalAmount: 4900,
        currency: 'KZT',
        createdAt: new Date(),
        paidAt: null,
        items: [],
        payments: [{ id: 'pay-1', status: 'PENDING', provider: 'MANUAL', amount: 4900, paidAt: null }],
      };

      prisma.$transaction = jest.fn().mockImplementation(async (fn) => {
        const tx = {
          business: { findUniqueOrThrow: jest.fn().mockResolvedValue({ cityId: 'city-1', categoryId: 'cat-1' }) },
          order: { findUnique: jest.fn(), create: jest.fn() },
          payment: { create: jest.fn() },
        };
        purchaseIntegrity.findReusablePendingOrder = jest.fn().mockResolvedValue(pendingOrder);
        return fn(tx);
      });

      const result = await service.createOrder(user, {
        businessId: 'biz-1',
        items: [{ productCode: 'TOP_CATEGORY', durationDays: 7 }],
      });

      expect(result.reusedPendingOrder).toBe(true);
      expect(result.existingOrderId).toBe('ord-existing');
    });

    it('idempotencyKey replay returns same order', async () => {
      prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
        id: 'prod-1',
        code: 'TOP_CATEGORY',
        type: MonetizationProductType.TOP_CATEGORY,
        isActive: true,
      });

      const replayOrder = {
        id: 'ord-idem',
        orderNumber: 'QLG-IDEM',
        status: OrderStatus.AWAITING_PAYMENT,
        subtotal: 4900,
        discountAmount: 0,
        totalAmount: 4900,
        currency: 'KZT',
        createdAt: new Date(),
        paidAt: null,
        items: [],
        payments: [],
      };

      prisma.$transaction = jest.fn().mockImplementation(async (fn) => {
        purchaseIntegrity.findOrderByIdempotencyKey = jest.fn().mockResolvedValue({
          order: replayOrder,
        });
        return fn({});
      });

      const result = await service.createOrder(user, {
        businessId: 'biz-1',
        idempotencyKey: 'idem-key-12345678',
        items: [{ productCode: 'TOP_CATEGORY', durationDays: 7 }],
      });

      expect(result.idempotentReplay).toBe(true);
      expect(result.id).toBe('ord-idem');
    });
  });
});
