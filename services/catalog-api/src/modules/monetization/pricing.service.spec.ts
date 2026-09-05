import { BusinessPlanTier } from '@prisma/client';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
  const prisma = {
    productPrice: { findMany: jest.fn() },
  } as unknown as PrismaService;

  const planLimits = {
    getBusinessPlanContext: jest.fn(),
    resolveEffectiveTier: jest.fn(),
  } as unknown as PlanLimitsService;

  const service = new PricingService(prisma, planLimits);

  const now = new Date('2026-09-05T12:00:00Z');
  const activePrice = (overrides: Record<string, unknown> = {}) => ({
    id: 'price-1',
    productId: 'prod-1',
    cityId: 'city-1',
    categoryId: null,
    placementId: null,
    durationHours: null,
    durationDays: 7,
    price: 4900,
    currency: 'KZT',
    isActive: true,
    validFrom: null,
    validUntil: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  beforeEach(() => jest.clearAllMocks());

  it('1. exact city/category/placement price precedence', async () => {
    prisma.productPrice.findMany = jest
      .fn()
      .mockImplementation(({ where }) => {
        if (where.placementId === 'pl-1') {
          return Promise.resolve([activePrice({ price: 1000, placementId: 'pl-1' })]);
        }
        if (where.cityId === 'city-1' && where.categoryId === 'cat-1' && !where.placementId) {
          return Promise.resolve([activePrice({ price: 2000, categoryId: 'cat-1' })]);
        }
        return Promise.resolve([]);
      });

    const result = await service.findProductPrice({
      productId: 'prod-1',
      cityId: 'city-1',
      categoryId: 'cat-1',
      placementId: 'pl-1',
      durationDays: 7,
    });

    expect(result.price).toBe(1000);
  });

  it('2. city fallback when category-specific missing', async () => {
    prisma.productPrice.findMany = jest
      .fn()
      .mockImplementation(({ where }) => {
        if (where.cityId === 'city-1' && !where.categoryId && !where.placementId) {
          return Promise.resolve([activePrice({ price: 2900 })]);
        }
        return Promise.resolve([]);
      });

    const result = await service.findProductPrice({
      productId: 'prod-1',
      cityId: 'city-1',
      categoryId: 'cat-1',
      durationDays: 7,
    });

    expect(result.price).toBe(2900);
  });

  it('3. global fallback', async () => {
    prisma.productPrice.findMany = jest
      .fn()
      .mockImplementation(({ where }) => {
        if (where.cityId === null && where.categoryId === null) {
          return Promise.resolve([activePrice({ price: 1500, cityId: null })]);
        }
        return Promise.resolve([]);
      });

    const result = await service.findProductPrice({
      productId: 'prod-1',
      durationDays: 7,
    });

    expect(result.price).toBe(1500);
  });

  it('4. inactive price rejected', async () => {
    prisma.productPrice.findMany = jest.fn().mockResolvedValue([
      activePrice({ isActive: false }),
    ]);

    await expect(
      service.findProductPrice({ productId: 'prod-1', cityId: 'city-1', durationDays: 7 }),
    ).rejects.toMatchObject({
      response: { code: 'PRICE_NOT_FOUND' },
    });
  });

  it('5. expired price rejected', async () => {
    prisma.productPrice.findMany = jest.fn().mockResolvedValue([
      activePrice({ validUntil: new Date('2020-01-01') }),
    ]);

    await expect(
      service.findProductPrice({ productId: 'prod-1', cityId: 'city-1', durationDays: 7 }),
    ).rejects.toMatchObject({
      response: { code: 'PRICE_NOT_FOUND' },
    });
  });

  it('6. BASIC discount = 0%', async () => {
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      effectiveTier: BusinessPlanTier.BASIC,
    });
    expect(await service.resolvePlanDiscountPercent('biz-1')).toBe(0);
  });

  it('7. PRO discount = 10%', async () => {
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      effectiveTier: BusinessPlanTier.PRO,
    });
    expect(await service.resolvePlanDiscountPercent('biz-1')).toBe(10);
  });

  it('8. TOP_CITY discount = 15%', async () => {
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      effectiveTier: BusinessPlanTier.TOP_CITY,
    });
    expect(await service.resolvePlanDiscountPercent('biz-1')).toBe(15);
  });

  it('10. package discount = 0', () => {
    expect(service.packageDiscountPercent()).toBe(0);
  });
});
