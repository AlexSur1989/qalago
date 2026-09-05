import { BusinessPlanTier, BusinessStatus } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceMenuService } from '../service-items/service-menu.service';

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

  const serviceMenuService = {} as ServiceMenuService;
  const service = new BusinessesService(prisma, cityScope, serviceMenuService);

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
