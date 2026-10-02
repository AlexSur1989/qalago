/**
 * 6.13M.3 — Admin ProductPrice management + historical order safety.
 */
import { BusinessPlanTier, OrderStatus } from '@prisma/client';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MonetizationAccessService } from './monetization-access.service';
import { PricingService } from './pricing.service';
import { ProductPriceAdminService } from './product-price-admin.service';

describe('6.13M.3 — advertising pricing admin', () => {
  const now = new Date('2026-10-01T12:00:00.000Z');

  describe('ProductPriceAdminService', () => {
    const prisma = {
      productPrice: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      monetizationProduct: { findUnique: jest.fn(), findMany: jest.fn() },
      city: { findUnique: jest.fn() },
    } as unknown as PrismaService;

    const access = {
      resolveAdminCityFilter: jest.fn().mockResolvedValue('city-uralsk'),
    } as unknown as MonetizationAccessService;

    const cityScope = {
      assertCityInAdminScope: jest.fn().mockResolvedValue(undefined),
    } as unknown as CityScopeService;

    const service = new ProductPriceAdminService(prisma, access, cityScope);
    const adminUser = { id: 'u1', role: 'ADMIN' } as never;

    beforeEach(() => jest.clearAllMocks());

    it('lists prices for admin city filter', async () => {
      prisma.productPrice.findMany = jest.fn().mockResolvedValue([
        {
          id: 'pp-1',
          productId: 'prod-top',
          cityId: 'city-uralsk',
          categoryId: null,
          placementId: null,
          durationHours: null,
          durationDays: 7,
          price: 10_000,
          currency: 'KZT',
          isActive: true,
          validFrom: null,
          validUntil: null,
          createdAt: now,
          updatedAt: now,
          product: {
            code: 'TOP_CATEGORY',
            name: 'TOP',
            type: 'TOP_CATEGORY',
          },
          city: { slug: 'uralsk', nameRu: 'Уральск' },
          placement: null,
        },
      ]);

      const rows = await service.listProductPrices(adminUser, { citySlug: 'uralsk' });
      expect(access.resolveAdminCityFilter).toHaveBeenCalledWith(adminUser, 'uralsk');
      expect(rows).toHaveLength(1);
      expect(rows[0].price).toBe(10_000);
      expect(rows[0].placementCode).toBe('CATEGORY_TOP');
    });

    it('updates price amount only', async () => {
      prisma.productPrice.findUnique = jest.fn().mockResolvedValue({
        id: 'pp-1',
        cityId: 'city-uralsk',
        productId: 'prod-top',
        categoryId: null,
        placementId: null,
        durationHours: null,
        durationDays: 7,
        price: 10_000,
        currency: 'KZT',
        isActive: true,
        validFrom: null,
        validUntil: null,
        createdAt: now,
        updatedAt: now,
        product: { code: 'TOP_CATEGORY', name: 'TOP', type: 'TOP_CATEGORY' },
        city: { slug: 'uralsk', nameRu: 'Уральск' },
        placement: null,
      });
      prisma.productPrice.update = jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'pp-1',
          productId: 'prod-top',
          cityId: 'city-uralsk',
          categoryId: null,
          placementId: null,
          durationHours: null,
          durationDays: 7,
          price: data.price,
          currency: 'KZT',
          isActive: true,
          validFrom: null,
          validUntil: null,
          createdAt: now,
          updatedAt: now,
          product: { code: 'TOP_CATEGORY', name: 'TOP', type: 'TOP_CATEGORY' },
          city: { slug: 'uralsk', nameRu: 'Уральск' },
          placement: null,
        }),
      );

      const row = await service.updateProductPrice(adminUser, 'pp-1', { price: 12_000 });
      expect(row.price).toBe(12_000);
      expect(prisma.productPrice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pp-1' },
          data: { price: 12_000 },
        }),
      );
    });

    it('rejects duplicate create for same identity', async () => {
      prisma.monetizationProduct.findUnique = jest.fn().mockResolvedValue({
        id: 'prod-top',
        isActive: true,
        code: 'TOP_CATEGORY',
      });
      prisma.city.findUnique = jest.fn().mockResolvedValue({ id: 'city-uralsk' });
      prisma.productPrice.findFirst = jest.fn().mockResolvedValue({ id: 'existing' });

      await expect(
        service.createProductPrice(adminUser, {
          productId: 'prod-top',
          cityId: 'city-uralsk',
          durationDays: 7,
          price: 12_000,
        }),
      ).rejects.toMatchObject({
        response: { code: 'PRICE_DUPLICATE' },
      });
    });

    it('rejects invalid amount', async () => {
      prisma.productPrice.findUnique = jest.fn().mockResolvedValue({
        id: 'pp-1',
        cityId: 'city-uralsk',
        product: { code: 'TOP_CATEGORY', name: 'TOP', type: 'TOP_CATEGORY' },
        city: { slug: 'uralsk', nameRu: 'Уральск' },
        placement: null,
      });
      await expect(
        service.updateProductPrice(adminUser, 'pp-1', { price: 0 }),
      ).rejects.toMatchObject({
        response: { code: 'INVALID_PRICE' },
      });
    });
  });

  describe('Historical order safety (pricing engine)', () => {
    const prisma = {
      productPrice: { findMany: jest.fn() },
      orderItem: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'oi-historical',
          basePrice: 10_000,
          discountPercent: 10,
          discountAmount: 1_000,
          finalPrice: 9_000,
          order: { status: OrderStatus.PAID },
        }),
      },
    } as unknown as PrismaService;

    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        effectiveTier: BusinessPlanTier.PREMIUM,
      }),
      getAdvertisingDiscountPercent: jest.fn().mockReturnValue(10),
    } as unknown as PlanLimitsService;

    const pricing = new PricingService(prisma, planLimits);

    it('new quote uses updated ProductPrice; OrderItem snapshot unchanged', async () => {
      prisma.productPrice.findMany = jest.fn().mockResolvedValue([
        {
          id: 'pp-1',
          productId: 'prod-top',
          cityId: 'city-uralsk',
          categoryId: null,
          placementId: null,
          durationHours: null,
          durationDays: 7,
          price: 12_000,
          currency: 'KZT',
          isActive: true,
          validFrom: null,
          validUntil: null,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const line = await pricing.priceProductLine('biz-1', {
        productId: 'prod-top',
        cityId: 'city-uralsk',
        durationDays: 7,
      });

      expect(line.basePrice).toBe(12_000);
      expect(line.finalPrice).toBe(10_800);

      const historical = await prisma.orderItem.findUnique({ where: { id: 'oi-historical' } });
      expect(historical!.basePrice).toBe(10_000);
      expect(historical!.finalPrice).toBe(9_000);
    });

    it('inactive ProductPrice excluded from new quote', async () => {
      prisma.productPrice.findMany = jest.fn().mockResolvedValue([
        {
          id: 'pp-off',
          productId: 'prod-top',
          cityId: 'city-uralsk',
          categoryId: null,
          placementId: null,
          durationHours: null,
          durationDays: 7,
          price: 12_000,
          currency: 'KZT',
          isActive: false,
          validFrom: null,
          validUntil: null,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await expect(
        pricing.findProductPrice({
          productId: 'prod-top',
          cityId: 'city-uralsk',
          durationDays: 7,
        }),
      ).rejects.toMatchObject({
        response: { code: 'PRICE_NOT_FOUND' },
      });
    });
  });
});
