import {
  AdCampaignStatus,
  AdModerationStatus,
  MonetizationProductType,
  OrderStatus,
  UserRole,
} from '@prisma/client';
import { AvailabilityService } from './availability.service';
import { CampaignProvisioningService } from './campaign-provisioning.service';
import { CampaignStatusService } from './campaign-status.service';
import { OrderService } from './order.service';
import { MonetizationAccessService } from './monetization-access.service';
import { PricingService } from './pricing.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('Stage 4B.2 — VIP inventory reservation + order validation', () => {
  describe('AvailabilityService VIP capacity', () => {
    const prisma = {
      adPlacement: { findUnique: jest.fn() },
      adCampaign: { count: jest.fn(), findFirst: jest.fn() },
    } as unknown as PrismaService;

    const service = new AvailabilityService(prisma);

    beforeEach(() => jest.clearAllMocks());

    it('HOME_VIP_BANNER counts PENDING_MODERATION toward capacity', async () => {
      prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
        id: 'pl-vip',
        code: 'HOME_VIP_BANNER',
        isActive: true,
        maxActiveCampaigns: 2,
      });
      prisma.adCampaign.count = jest.fn().mockImplementation(({ where }) => {
        expect(where.status.in).toEqual([
          AdCampaignStatus.ACTIVE,
          AdCampaignStatus.SCHEDULED,
          AdCampaignStatus.PENDING_MODERATION,
        ]);
        return Promise.resolve(2);
      });

      const result = await service.checkAvailability({
        productType: MonetizationProductType.VIP_BANNER,
        cityId: 'city-1',
        desiredStartAt: new Date('2026-09-05'),
        desiredEndAt: new Date('2026-09-12'),
      });

      expect(result.available).toBe(false);
      expect(result.activeCount).toBe(2);
    });

    it('CATEGORY_TOP does not count PENDING_MODERATION', async () => {
      prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
        id: 'pl-top',
        code: 'CATEGORY_TOP',
        isActive: true,
        maxActiveCampaigns: 2,
      });
      prisma.adCampaign.count = jest.fn().mockImplementation(({ where }) => {
        expect(where.status.in).toEqual([
          AdCampaignStatus.ACTIVE,
          AdCampaignStatus.SCHEDULED,
        ]);
        return Promise.resolve(0);
      });

      await service.checkAvailability({
        productType: MonetizationProductType.TOP_CATEGORY,
        cityId: 'city-1',
        categoryId: 'cat-1',
        desiredStartAt: new Date('2026-09-05'),
        desiredEndAt: new Date('2026-09-12'),
      });
    });

    it('approval PENDING_MODERATION → ACTIVE keeps single slot (same campaign id)', async () => {
      prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
        id: 'pl-vip',
        code: 'HOME_VIP_BANNER',
        isActive: true,
        maxActiveCampaigns: 2,
      });

      const campaignIds = new Set<string>();
      prisma.adCampaign.count = jest.fn().mockImplementation(() => {
        return Promise.resolve(campaignIds.size);
      });

      campaignIds.add('camp-a');
      const pending = await service.checkAvailability({
        productType: MonetizationProductType.VIP_BANNER,
        cityId: 'city-1',
        desiredStartAt: new Date('2026-09-05'),
        desiredEndAt: new Date('2026-09-12'),
      });
      expect(pending.activeCount).toBe(1);

      // Same campaign transitions to ACTIVE — still one row in DB
      const active = await service.checkAvailability({
        productType: MonetizationProductType.VIP_BANNER,
        cityId: 'city-1',
        desiredStartAt: new Date('2026-09-05'),
        desiredEndAt: new Date('2026-09-12'),
      });
      expect(active.activeCount).toBe(1);
    });

    it('REJECTED status not in VIP capacity filter (releases slot)', () => {
      const statuses = service.resolveCapacityStatuses('HOME_VIP_BANNER');
      expect(statuses).not.toContain(AdCampaignStatus.REJECTED);
      expect(statuses).not.toContain(AdCampaignStatus.CANCELLED);
      expect(statuses).not.toContain(AdCampaignStatus.COMPLETED);
    });

    it('SCHEDULED VIP counts toward HOME_VIP_BANNER capacity', async () => {
      prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
        id: 'pl-vip',
        code: 'HOME_VIP_BANNER',
        isActive: true,
        maxActiveCampaigns: 1,
      });
      prisma.adCampaign.count = jest.fn().mockImplementation(({ where }) => {
        expect(where.status.in).toContain(AdCampaignStatus.SCHEDULED);
        return Promise.resolve(1);
      });

      const result = await service.checkAvailability({
        productType: MonetizationProductType.VIP_BANNER,
        cityId: 'city-1',
        desiredStartAt: new Date('2026-09-05'),
        desiredEndAt: new Date('2026-09-12'),
      });
      expect(result.available).toBe(false);
    });
  });

  describe('OrderService creative validation', () => {
    const prisma = {
      $transaction: jest.fn(),
      business: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
      monetizationProduct: { findUnique: jest.fn() },
      promotionPackage: { findUnique: jest.fn() },
      promotion: { findFirst: jest.fn() },
      adCreative: { findFirst: jest.fn() },
      order: { findMany: jest.fn(), findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
      payment: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), create: jest.fn() },
    } as unknown as PrismaService;

    const access = {
      assertCanManageBusiness: jest.fn(),
    } as unknown as MonetizationAccessService;

    const pricing = {
      priceProductLine: jest.fn(),
      packageDiscountPercent: jest.fn().mockReturnValue(0),
    } as unknown as PricingService;

    const availability = {
      addDuration: jest.fn((start: Date, _h?: number | null, days?: number | null) => {
        const end = new Date(start);
        if (days) end.setDate(end.getDate() + days);
        return end;
      }),
      checkAvailability: jest.fn().mockResolvedValue({ available: true }),
      assertAvailableInTransaction: jest.fn().mockResolvedValue(undefined),
    } as unknown as AvailabilityService;

    const provisioning = {
      provisionOrderCampaigns: jest.fn(),
    } as unknown as CampaignProvisioningService;

    const service = new OrderService(
      prisma,
      access,
      pricing,
      availability,
      provisioning,
    );

    const user = { id: 'user-1', role: UserRole.BUSINESS, phone: '+7700', sub: 'user-1' };
    const business = { cityId: 'city-1', categoryId: 'cat-1', ownerId: 'user-1' };

    beforeEach(() => {
      jest.clearAllMocks();
      access.assertCanManageBusiness = jest.fn().mockResolvedValue(business);
      availability.checkAvailability = jest.fn().mockResolvedValue({ available: true });
    });

    it('direct VIP missing creative rejected', async () => {
      prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
        id: 'vip-prod',
        code: 'VIP_BANNER',
        type: MonetizationProductType.VIP_BANNER,
        isActive: true,
      });
      pricing.priceProductLine = jest.fn().mockResolvedValue({
        basePrice: 12900,
        discountPercent: 0,
        discountAmount: 0,
        finalPrice: 12900,
        currency: 'KZT',
        productPriceId: 'price-1',
      });

      await expect(
        service.createOrder(user, {
          businessId: 'biz-1',
          items: [{ productCode: 'VIP_BANNER', durationDays: 7 }],
        }),
      ).rejects.toMatchObject({ response: { code: 'CREATIVE_REQUIRED' } });
    });

    it('NEW_PLACE package missing creative rejected', async () => {
      prisma.promotionPackage.findUnique = jest.fn().mockResolvedValue({
        code: 'NEW_PLACE',
        isActive: true,
        price: 24900,
        durationDays: 14,
        items: [
          {
            product: { id: 'p1', code: 'VIP_BANNER', type: MonetizationProductType.VIP_BANNER },
            durationDays: 14,
          },
        ],
      });
      prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
        id: 'pkg-prod',
        code: 'PACKAGE',
        type: MonetizationProductType.PACKAGE,
        isActive: true,
      });

      await expect(
        service.createOrder(user, {
          businessId: 'biz-1',
          packageCode: 'NEW_PLACE',
        }),
      ).rejects.toMatchObject({ response: { code: 'CREATIVE_REQUIRED' } });
    });

    it('MAX package missing creative rejected', async () => {
      prisma.promotionPackage.findUnique = jest.fn().mockResolvedValue({
        code: 'MAX',
        isActive: true,
        price: 19900,
        durationDays: 7,
        items: [
          {
            product: { id: 'p1', code: 'VIP_BANNER', type: MonetizationProductType.VIP_BANNER },
            durationDays: 7,
          },
          {
            product: {
              id: 'p2',
              code: 'TOP_CATEGORY',
              type: MonetizationProductType.TOP_CATEGORY,
            },
            durationDays: 7,
          },
        ],
      });
      prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
        id: 'pkg-prod',
        code: 'PACKAGE',
        type: MonetizationProductType.PACKAGE,
        isActive: true,
      });
      prisma.promotion.findFirst = jest.fn().mockResolvedValue({ id: 'promo-1' });

      await expect(
        service.createOrder(user, {
          businessId: 'biz-1',
          packageCode: 'MAX',
          promotionId: 'promo-1',
        }),
      ).rejects.toMatchObject({ response: { code: 'CREATIVE_REQUIRED' } });
    });

    it('BUSINESS package works without creative', async () => {
      prisma.promotionPackage.findUnique = jest.fn().mockResolvedValue({
        code: 'BUSINESS',
        isActive: true,
        price: 9900,
        durationDays: 7,
        items: [
          {
            product: {
              id: 'p1',
              code: 'FEATURED_BUSINESS',
              type: MonetizationProductType.FEATURED_BUSINESS,
            },
            durationDays: 7,
          },
        ],
      });
      prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
        id: 'pkg-prod',
        code: 'PACKAGE',
        type: MonetizationProductType.PACKAGE,
        isActive: true,
      });
      prisma.$transaction = jest.fn().mockImplementation(async (fn) => {
        const tx = {
          business: { findUniqueOrThrow: jest.fn().mockResolvedValue({ cityId: 'city-1' }) },
          order: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'ord-biz',
              orderNumber: 'QLG-20260905-BIZ001',
              status: OrderStatus.AWAITING_PAYMENT,
              subtotal: 9900,
              discountAmount: 0,
              totalAmount: 9900,
              currency: 'KZT',
              createdAt: new Date(),
              paidAt: null,
              items: [],
              payments: [],
            }),
          },
          payment: {
            create: jest.fn().mockResolvedValue({
              id: 'pay-biz',
              status: 'PENDING',
              provider: 'MANUAL',
              amount: 9900,
              paidAt: null,
            }),
          },
        };
        return fn(tx);
      });

      const result = await service.createOrder(user, {
        businessId: 'biz-1',
        packageCode: 'BUSINESS',
      });
      expect(result.id).toBe('ord-biz');
    });

    it('START package works without creative', async () => {
      prisma.promotionPackage.findUnique = jest.fn().mockResolvedValue({
        code: 'START',
        isActive: true,
        price: 6900,
        durationDays: 7,
        items: [
          {
            product: {
              id: 'p1',
              code: 'TOP_CATEGORY',
              type: MonetizationProductType.TOP_CATEGORY,
            },
            durationDays: 7,
          },
        ],
      });
      prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
        id: 'pkg-prod',
        code: 'PACKAGE',
        type: MonetizationProductType.PACKAGE,
        isActive: true,
      });
      prisma.$transaction = jest.fn().mockImplementation(async (fn) => {
        const tx = {
          business: { findUniqueOrThrow: jest.fn().mockResolvedValue({ cityId: 'city-1' }) },
          order: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'ord-1',
              orderNumber: 'QLG-20260905-ABC123',
              status: OrderStatus.AWAITING_PAYMENT,
              subtotal: 6900,
              discountAmount: 0,
              totalAmount: 6900,
              currency: 'KZT',
              createdAt: new Date(),
              paidAt: null,
              items: [],
              payments: [],
            }),
          },
          payment: {
            create: jest.fn().mockResolvedValue({
              id: 'pay-1',
              status: 'PENDING',
              provider: 'MANUAL',
              amount: 6900,
              paidAt: null,
            }),
          },
        };
        return fn(tx);
      });

      const result = await service.createOrder(user, {
        businessId: 'biz-1',
        packageCode: 'START',
      });
      expect(result.id).toBe('ord-1');
    });

    it('wrong-business creative rejected', async () => {
      prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
        id: 'vip-prod',
        code: 'VIP_BANNER',
        type: MonetizationProductType.VIP_BANNER,
        isActive: true,
      });
      pricing.priceProductLine = jest.fn().mockResolvedValue({
        basePrice: 12900,
        discountPercent: 0,
        discountAmount: 0,
        finalPrice: 12900,
        currency: 'KZT',
        productPriceId: 'price-1',
      });
      prisma.adCreative.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        service.createOrder(user, {
          businessId: 'biz-1',
          items: [
            { productCode: 'VIP_BANNER', durationDays: 7, creativeId: 'cr-other-biz' },
          ],
        }),
      ).rejects.toMatchObject({ response: { code: 'CREATIVE_NOT_OWNED' } });
    });
  });

  describe('CampaignProvisioningService reject releases capacity', () => {
    const prisma = {
      adCampaign: { updateMany: jest.fn() },
    } as unknown as PrismaService;

    const availability = {
      addDuration: jest.fn(),
      assertAvailableInTransaction: jest.fn(),
      resolveCapacityStatuses: jest.fn(),
    } as unknown as AvailabilityService;

    const campaignStatus = new CampaignStatusService(availability);
    const service = new CampaignProvisioningService(
      prisma,
      availability,
      campaignStatus,
    );

    it('rejectCampaignsForCreative sets REJECTED (not capacity-consuming)', async () => {
      prisma.adCampaign.updateMany = jest.fn().mockResolvedValue({ count: 1 });
      await service.rejectCampaignsForCreative('cr-1');
      expect(prisma.adCampaign.updateMany).toHaveBeenCalledWith({
        where: {
          creativeId: 'cr-1',
          status: AdCampaignStatus.PENDING_MODERATION,
        },
        data: { status: AdCampaignStatus.REJECTED },
      });
    });
  });
});
