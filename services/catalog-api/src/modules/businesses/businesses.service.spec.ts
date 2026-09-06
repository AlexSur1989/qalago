import { BusinessPlanTier, BusinessStatus } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';

describe('BusinessesService.findAll', () => {
  const cityScope = {
    resolveCityId: jest.fn().mockResolvedValue('city-uralsk'),
  } as unknown as CityScopeService;

  const prisma = {
    business: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  } as unknown as PrismaService;

  const serviceMenuService = {} as BusinessPublicContentService;
  const planLimits = {} as PlanLimitsService;
  const publicContent = {} as BusinessPublicContentService;
  const service = new BusinessesService(prisma, cityScope, planLimits, publicContent);

  const category = { id: 'cat-1', title: 'Кафе', slug: 'cafe', icon: null };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sorts catalog by title only (plan-neutral)', async () => {
    prisma.business.findMany = jest.fn().mockResolvedValue([
      {
        id: 'free',
        title: 'Basic Cafe',
        slug: 'basic-cafe',
        cityId: 'city-uralsk',
        categoryId: 'cat-1',
        address: 'Street',
        latitude: null,
        longitude: null,
        status: BusinessStatus.ACTIVE,
        isFeatured: false,
        planTier: BusinessPlanTier.FREE,
        planExpiresAt: null,
        featuredSlot: null,
        category,
      },
      {
        id: 'premium',
        title: 'Pro Cafe',
        slug: 'pro-cafe',
        cityId: 'city-uralsk',
        categoryId: 'cat-1',
        address: 'Street',
        latitude: null,
        longitude: null,
        status: BusinessStatus.ACTIVE,
        isFeatured: true,
        planTier: BusinessPlanTier.PREMIUM,
        planExpiresAt: new Date(Date.now() + 86400000),
        featuredSlot: null,
        category,
      },
      {
        id: 'vip',
        title: 'Top Cafe',
        slug: 'top-cafe',
        cityId: 'city-uralsk',
        categoryId: 'cat-1',
        address: 'Street',
        latitude: null,
        longitude: null,
        status: BusinessStatus.ACTIVE,
        isFeatured: true,
        planTier: BusinessPlanTier.VIP,
        planExpiresAt: new Date(Date.now() + 86400000),
        featuredSlot: 1,
        category,
      },
    ]);

    const result = await service.findAll({
      citySlug: 'uralsk',
      page: 1,
      limit: 20,
    });

    expect(result.items.map((item) => item.id)).toEqual(['free', 'premium', 'vip']);
  });

  it('sorts by distance when geo is provided (no tier priority)', async () => {
    prisma.business.findMany = jest.fn().mockResolvedValue([
      {
        id: 'near-free',
        title: 'Near Basic',
        slug: 'near-basic',
        cityId: 'city-uralsk',
        categoryId: 'cat-1',
        address: 'Near street',
        latitude: 51.228,
        longitude: 51.387,
        status: BusinessStatus.ACTIVE,
        isFeatured: false,
        planTier: BusinessPlanTier.FREE,
        planExpiresAt: null,
        featuredSlot: null,
        category,
      },
      {
        id: 'far-premium',
        title: 'Far Pro',
        slug: 'far-pro',
        cityId: 'city-uralsk',
        categoryId: 'cat-1',
        address: 'Far street',
        latitude: 51.24,
        longitude: 51.39,
        status: BusinessStatus.ACTIVE,
        isFeatured: true,
        planTier: BusinessPlanTier.PREMIUM,
        planExpiresAt: new Date(Date.now() + 86400000),
        featuredSlot: null,
        category,
      },
    ]);

    const result = await service.findAll({
      citySlug: 'uralsk',
      latitude: 51.2278,
      longitude: 51.3865,
      radiusKm: 15,
      page: 1,
      limit: 20,
    });

    expect(result.items.map((item) => item.id)).toEqual(['near-free', 'far-premium']);
  });

  it('sorts by distance within same tier when geo is provided', async () => {
    prisma.business.findMany = jest.fn().mockResolvedValue([
      {
        id: 'far',
        title: 'Far Cafe',
        slug: 'far-cafe',
        cityId: 'city-uralsk',
        categoryId: 'cat-1',
        address: 'Far street',
        latitude: 51.24,
        longitude: 51.39,
        status: BusinessStatus.ACTIVE,
        isFeatured: false,
        planTier: BusinessPlanTier.FREE,
        planExpiresAt: null,
        featuredSlot: null,
        category,
      },
      {
        id: 'near',
        title: 'Near Cafe',
        slug: 'near-cafe',
        cityId: 'city-uralsk',
        categoryId: 'cat-1',
        address: 'Near street',
        latitude: 51.228,
        longitude: 51.387,
        status: BusinessStatus.ACTIVE,
        isFeatured: false,
        planTier: BusinessPlanTier.FREE,
        planExpiresAt: null,
        featuredSlot: null,
        category,
      },
    ]);

    const result = await service.findAll({
      citySlug: 'uralsk',
      latitude: 51.2278,
      longitude: 51.3865,
      radiusKm: 15,
      page: 1,
      limit: 20,
    });

    const first = result.items[0] as unknown as { id: string; distanceMeters?: number };
    const second = result.items[1] as unknown as { id: string; distanceMeters?: number };
    expect(first.id).toBe('near');
    expect(second.id).toBe('far');
    expect(first.distanceMeters!).toBeLessThan(second.distanceMeters!);
  });
});

describe('BusinessesService.recommended', () => {
  const cityScope = {
    resolveCityId: jest.fn().mockResolvedValue('city-uralsk'),
  } as unknown as CityScopeService;

  const prisma = {
    favorite: { findMany: jest.fn() },
    business: { findMany: jest.fn() },
  } as unknown as PrismaService;

  const service = new BusinessesService(
    prisma,
    cityScope,
    {} as PlanLimitsService,
    {} as BusinessPublicContentService,
  );

  const category = { id: 'cat-1', title: 'Кафе', slug: 'cafe', icon: null };
  const user = { id: 'user-1', sub: 'user-1', phone: '+7', role: 'USER' as never };

  const makeBusiness = (id: string, title: string, isFeatured: boolean, planTier: BusinessPlanTier) => ({
    id,
    title,
    slug: id,
    cityId: 'city-uralsk',
    categoryId: 'cat-1',
    address: 'Street',
    latitude: null,
    longitude: null,
    status: BusinessStatus.ACTIVE,
    isFeatured,
    planTier,
    planExpiresAt: null,
    featuredSlot: isFeatured ? 1 : null,
    category,
  });

  beforeEach(() => jest.clearAllMocks());

  it('cold start does not filter by isFeatured', async () => {
    prisma.favorite.findMany = jest.fn().mockResolvedValue([]);
    prisma.business.findMany = jest.fn().mockResolvedValue([
      makeBusiness('a', 'Alpha Cafe', false, BusinessPlanTier.FREE),
      makeBusiness('b', 'Beta VIP', true, BusinessPlanTier.VIP),
    ]);

    await service.recommended(user, 'uralsk');

    const findMany = prisma.business.findMany as jest.Mock;
    const where = findMany.mock.calls[0][0].where;
    expect(where.isFeatured).toBeUndefined();
  });

  it('cold start order does not depend on planTier or isFeatured', async () => {
    prisma.favorite.findMany = jest.fn().mockResolvedValue([]);
    prisma.business.findMany = jest.fn().mockResolvedValue([
      makeBusiness('vip', 'Zulu VIP', true, BusinessPlanTier.VIP),
      makeBusiness('free', 'Alpha Free', false, BusinessPlanTier.FREE),
    ]);

    const result = await service.recommended(user, 'uralsk');
    expect(result.map((b) => b.id)).toEqual(['free', 'vip']);
  });

  it('with favorites uses category filter only', async () => {
    prisma.favorite.findMany = jest.fn().mockResolvedValue([
      { business: { categoryId: 'cat-food' } },
    ]);
    prisma.business.findMany = jest.fn().mockResolvedValue([]);

    await service.recommended(user, 'uralsk');

    expect(prisma.business.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categoryId: { in: ['cat-food'] },
        }),
      }),
    );
  });
});
