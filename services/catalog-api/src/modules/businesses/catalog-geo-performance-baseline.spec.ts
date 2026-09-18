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

  for (const size of [100, 1000, 10000] as const) {
    it(`nearest sort loads all ${size} city rows into Node (no SQL LIMIT)`, async () => {
      const rows = Array.from({ length: size }, (_, i) =>
        makeBusiness(`id-${i}`, 51.22 + (i % 10) * 0.001, 51.38),
      );
      const prisma = {
        business: {
          findMany: jest.fn().mockResolvedValue(rows),
          count: jest.fn(),
        },
      };
      const service = buildService(prisma);

      const started = performance.now();
      await service.findAll({
        citySlug: 'uralsk',
        latitude: 51.2278,
        longitude: 51.3865,
        radiusKm: 15,
        limit: 20,
      });
      const elapsedMs = performance.now() - started;

      expect(prisma.business.findMany).toHaveBeenCalledTimes(1);
      const call = prisma.business.findMany.mock.calls[0][0];
      expect(call.take).toBeUndefined();
      expect(call.skip).toBeUndefined();
      expect(rows.length).toBe(size);

      // eslint-disable-next-line no-console -- baseline artifact for C.5A report
      console.log(
        `[C.5A baseline] nearest size=${size} findManyRows=${size} serviceMs=${elapsedMs.toFixed(1)}`,
      );
    });
  }

  it('recommended map bbox uses DB skip/take (contrast)', async () => {
    const prisma = {
      business: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const service = buildService(prisma);

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

    expect(prisma.business.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 100 }),
    );
  });
});
