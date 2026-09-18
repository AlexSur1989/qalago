import { BusinessPlanTier, BusinessStatus } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';

/**
 * Stage 6.11C.5A — documents in-memory nearest behavior (C.5D replacement target).
 * Uses mocked Prisma rows; does not seed dev catalog.
 */
describe('Catalog geo performance baseline (mocked)', () => {
  const cityScope = {
    resolveCityId: jest.fn().mockResolvedValue('city-uralsk'),
  } as unknown as CityScopeService;

  const category = { id: 'cat-1', title: 'Кафе', slug: 'cafe', icon: null };

  function makeBusiness(id: string, lat: number, lng: number) {
    return {
      id,
      title: `Biz ${id}`,
      slug: `biz-${id}`,
      cityId: 'city-uralsk',
      categoryId: 'cat-1',
      address: 'Street',
      latitude: lat,
      longitude: lng,
      status: BusinessStatus.ACTIVE,
      isFeatured: false,
      planTier: BusinessPlanTier.FREE,
      planExpiresAt: null,
      featuredSlot: null,
      category,
    };
  }

  function buildService(prisma: { business: { findMany: jest.Mock; count: jest.Mock } }) {
    const subDeps = createMockSubcategoryDeps();
    return new BusinessesService(
      prisma as unknown as PrismaService,
      cityScope,
      asBusinessAccessService(createMockBusinessAccess()),
      { createActiveOwnerMembership: jest.fn() } as never,
      {} as PlanLimitsService,
      {} as BusinessPublicContentService,
      asAuditLogService(createMockAuditLog()),
      subDeps.businessSubcategories,
      subDeps.subcategories,
    );
  }

  it('nearest sort uses PostGIS raw query with LIMIT (not full-city findMany)', async () => {
    const prisma = {
      business: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn(),
      },
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'id-1', distance_meters: 100 }])
        .mockResolvedValueOnce([{ count: 1n }]),
    };
    const service = buildService(prisma as never);

    await service.findAll({
      citySlug: 'uralsk',
      latitude: 51.2278,
      longitude: 51.3865,
      radiusKm: 15,
      limit: 20,
    });

    expect(prisma.$queryRaw).toHaveBeenCalled();
    const fullListCall = prisma.business.findMany.mock.calls.find(
      (call) => call[0]?.where?.cityId === 'city-uralsk' && !call[0]?.take,
    );
    expect(fullListCall).toBeUndefined();
    const hydrateCall = prisma.business.findMany.mock.calls.find(
      (call) => call[0]?.where?.id?.in,
    );
    expect(hydrateCall).toBeDefined();
  });

  it('map bbox uses PostGIS viewport query with LIMIT (not full-city findMany)', async () => {
    const prisma = {
      business: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn(),
      },
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'b1' }])
        .mockResolvedValueOnce([{ count: 1n }]),
    };
    const service = buildService(prisma as never);

    await service.findAll({
      citySlug: 'uralsk',
      forMap: true,
      minLat: 51.1,
      maxLat: 51.3,
      minLng: 51.2,
      maxLng: 51.5,
      page: 1,
      limit: 100,
    });

    expect(prisma.$queryRaw).toHaveBeenCalled();
    const cityWide = prisma.business.findMany.mock.calls.find(
      (call) => call[0]?.where?.cityId === 'city-uralsk' && !call[0]?.take,
    );
    expect(cityWide).toBeUndefined();
  });
});
