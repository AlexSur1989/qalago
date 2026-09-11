import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BusinessPlanTier, BusinessStatus } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { ListBusinessesQueryDto } from './dto/business.dto';
import { BusinessCatalogSort } from '../../common/utils/business-catalog-sort.util';

describe('Stage 6.7QA — category discovery adversarial', () => {
  const cityScope = {
    resolveCityId: jest.fn().mockResolvedValue('city-qa'),
  } as unknown as CityScopeService;

  const category = { id: 'cat-food', title: 'Еда', slug: 'food', icon: null };

  function makeBusiness(id: string, title: string, tier: BusinessPlanTier = BusinessPlanTier.FREE) {
    return {
      id,
      title,
      slug: id,
      cityId: 'city-qa',
      categoryId: 'cat-food',
      address: 'Street',
      latitude: 51.22,
      longitude: 51.38,
      status: BusinessStatus.ACTIVE,
      isFeatured: tier !== BusinessPlanTier.FREE,
      planTier: tier,
      planExpiresAt: tier === BusinessPlanTier.FREE ? null : new Date(Date.now() + 86400000),
      featuredSlot: null,
      category,
    };
  }

  function buildService(prisma: PrismaService) {
    return new BusinessesService(
      prisma,
      cityScope,
      asBusinessAccessService(createMockBusinessAccess()),
      { createActiveOwnerMembership: jest.fn() } as never,
      {} as PlanLimitsService,
      {} as BusinessPublicContentService,
      asAuditLogService(createMockAuditLog()),
    );
  }

  describe('§37 sort-before-slice (>100 businesses)', () => {
    it('rating sort returns top-rated business within first page', async () => {
      const businesses = Array.from({ length: 120 }, (_, i) =>
        makeBusiness(`biz-${i}`, `Place ${String(i).padStart(3, '0')}`),
      );
      const prisma = {
        business: { findMany: jest.fn().mockResolvedValue(businesses) },
        review: {
          groupBy: jest.fn().mockResolvedValue([
            { businessId: 'biz-119', _avg: { rating: 5 }, _count: { _all: 40 } },
            { businessId: 'biz-0', _avg: { rating: 2 }, _count: { _all: 1 } },
          ]),
        },
        analyticsDailyMetric: { groupBy: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaService;

      const service = buildService(prisma);
      const result = await service.findAll({
        citySlug: 'qa-city',
        categoryId: 'cat-food',
        sort: BusinessCatalogSort.RATING,
        page: 1,
        limit: 100,
      });

      expect(result.items[0].id).toBe('biz-119');
      expect(result.items).toHaveLength(100);
      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat-food' }),
        }),
      );
    });
  });

  describe('§36 popularity aggregation efficiency', () => {
    it('loads review and view metrics with batch groupBy (not per-row queries)', async () => {
      const businesses = [
        makeBusiness('biz-a', 'Alpha'),
        makeBusiness('biz-b', 'Beta'),
      ];
      const reviewGroupBy = jest.fn().mockResolvedValue([]);
      const viewsGroupBy = jest.fn().mockResolvedValue([]);
      const prisma = {
        business: { findMany: jest.fn().mockResolvedValue(businesses) },
        review: { groupBy: reviewGroupBy },
        analyticsDailyMetric: { groupBy: viewsGroupBy },
      } as unknown as PrismaService;

      const service = buildService(prisma);
      await service.findAll({
        citySlug: 'qa-city',
        sort: BusinessCatalogSort.POPULAR,
        limit: 50,
      });

      expect(reviewGroupBy).toHaveBeenCalledTimes(1);
      expect(viewsGroupBy).toHaveBeenCalledTimes(1);
    });
  });

  describe('§28 organic plan neutrality', () => {
    it('recommended sort ignores VIP tier vs FREE title order', async () => {
      const businesses = [
        makeBusiness('vip', 'Zulu VIP', BusinessPlanTier.VIP),
        makeBusiness('free', 'Alpha Free', BusinessPlanTier.FREE),
      ];
      const prisma = {
        business: { findMany: jest.fn().mockResolvedValue(businesses) },
      } as unknown as PrismaService;

      const service = buildService(prisma);
      const result = await service.findAll({
        citySlug: 'qa-city',
        sort: BusinessCatalogSort.RECOMMENDED,
        limit: 20,
      });

      expect(result.items.map((b) => b.id)).toEqual(['free', 'vip']);
    });
  });

  describe('§39 search + sort composition', () => {
    it('applies categoryId, search, and sort together', async () => {
      const prisma = {
        business: {
          findMany: jest.fn().mockResolvedValue([makeBusiness('biz-1', 'Pizza House')]),
        },
      } as unknown as PrismaService;

      const service = buildService(prisma);
      await service.findAll({
        citySlug: 'qa-city',
        categoryId: 'cat-food',
        search: 'pizza',
        sort: BusinessCatalogSort.RECOMMENDED,
        limit: 20,
      });

      const where = (prisma.business.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.categoryId).toBe('cat-food');
      expect(where.OR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: expect.objectContaining({ contains: 'pizza' }) }),
        ]),
      );
    });
  });

  describe('§32 nearest input validation', () => {
    it('rejects out-of-range latitude', async () => {
      const dto = plainToInstance(ListBusinessesQueryDto, {
        citySlug: 'qa-city',
        latitude: 95,
        longitude: 51.1,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'latitude')).toBe(true);
    });

    it('rejects NaN latitude', async () => {
      const dto = plainToInstance(ListBusinessesQueryDto, {
        citySlug: 'qa-city',
        latitude: NaN,
        longitude: 51.1,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'latitude')).toBe(true);
    });
  });

  describe('§34 rating sort ordering', () => {
    it('orders rated before unrated; higher review count wins rating tie', async () => {
      const businesses = [
        makeBusiness('unrated', 'Unrated'),
        makeBusiness('few', 'Few reviews'),
        makeBusiness('many', 'Many reviews'),
      ];
      const prisma = {
        business: { findMany: jest.fn().mockResolvedValue(businesses) },
        review: {
          groupBy: jest.fn().mockResolvedValue([
            { businessId: 'few', _avg: { rating: 5 }, _count: { _all: 2 } },
            { businessId: 'many', _avg: { rating: 5 }, _count: { _all: 100 } },
          ]),
        },
        analyticsDailyMetric: { groupBy: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaService;

      const service = buildService(prisma);
      const result = await service.findAll({
        citySlug: 'qa-city',
        sort: BusinessCatalogSort.RATING,
        limit: 10,
      });

      expect(result.items.map((b) => b.id)).toEqual(['many', 'few', 'unrated']);
    });
  });
});
