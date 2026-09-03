import { BusinessStatus } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceMenuService } from '../service-items/service-menu.service';

describe('BusinessesService.findAll geo', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sorts by distance when latitude and longitude are provided', async () => {
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
        category: { id: 'cat-1', title: 'Кафе', slug: 'cafe', icon: null },
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
        isFeatured: true,
        category: { id: 'cat-1', title: 'Кафе', slug: 'cafe', icon: null },
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
    expect(first.distanceMeters).toBeDefined();
    expect(second.id).toBe('far');
    expect(first.distanceMeters!).toBeLessThan(second.distanceMeters!);
  });
});
