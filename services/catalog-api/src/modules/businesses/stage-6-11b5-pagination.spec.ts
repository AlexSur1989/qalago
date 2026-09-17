import { BusinessPlanTier, BusinessStatus, Prisma } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { BusinessCatalogSort } from '../../common/utils/business-catalog-sort.util';

describe('Stage 6.11B.5 — search pagination and relevance', () => {
  const cityScope = {
    resolveCityId: jest.fn().mockResolvedValue('city-uralsk'),
  } as unknown as CityScopeService;

  const category = { id: 'cat-1', title: 'Beauty', slug: 'beauty', icon: null, nameRu: 'Красота', nameKk: 'Сұлулық' };

  function makeBusiness(
    id: string,
    title: string,
    extra: Partial<{
      shortDesc: string | null;
      planTier: BusinessPlanTier;
    }> = {},
  ) {
    return {
      id,
      title,
      slug: id,
      shortDesc: extra.shortDesc ?? null,
      address: 'Street',
      cityId: 'city-uralsk',
      categoryId: 'cat-1',
      latitude: null,
      longitude: null,
      phone: null,
      whatsapp: null,
      coverImageUrl: null,
      status: BusinessStatus.ACTIVE,
      isFeatured: false,
      planTier: extra.planTier ?? BusinessPlanTier.FREE,
      planExpiresAt: null,
      featuredSlot: null,
      createdAt: new Date(),
      category,
      businessSubcategories: [],
    };
  }

  function buildService(prisma: PrismaService) {
    const subDeps = createMockSubcategoryDeps();
    return new BusinessesService(
      prisma,
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

  beforeEach(() => jest.clearAllMocks());

  describe('DB pagination — discovery (no search)', () => {
    it('uses count + orderBy skip/take for recommended', async () => {
      const prisma = {
        business: {
          count: jest.fn().mockResolvedValue(25),
          findMany: jest.fn().mockResolvedValue([makeBusiness('p2-a', 'Alpha')]),
        },
        serviceItem: { findMany: jest.fn() },
      } as unknown as PrismaService;
      const service = buildService(prisma);

      const result = await service.findAll({
        citySlug: 'uralsk',
        sort: BusinessCatalogSort.RECOMMENDED,
        page: 2,
        limit: 10,
      });

      expect(prisma.business.count).toHaveBeenCalled();
      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
          orderBy: [{ title: 'asc' }, { id: 'asc' }],
        }),
      );
      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(3);
    });

    it('page 1 and page 2 have no duplicate IDs (mocked slices)', async () => {
      const all = Array.from({ length: 25 }, (_, i) =>
        makeBusiness(`biz-${String(i).padStart(2, '0')}`, `Title ${String(i).padStart(2, '0')}`),
      );
      const prisma = {
        business: {
          count: jest.fn().mockResolvedValue(25),
          findMany: jest
            .fn()
            .mockImplementation(({ skip, take }: { skip: number; take: number }) =>
              Promise.resolve(all.slice(skip, skip + take)),
            ),
        },
        serviceItem: { findMany: jest.fn() },
      } as unknown as PrismaService;
      const service = buildService(prisma);

      const page1 = await service.findAll({ citySlug: 'uralsk', page: 1, limit: 10 });
      const page2 = await service.findAll({ citySlug: 'uralsk', page: 2, limit: 10 });
      const ids1 = page1.items.map((b) => b.id);
      const ids2 = page2.items.map((b) => b.id);
      expect(ids1).toHaveLength(10);
      expect(ids2).toHaveLength(10);
      expect(new Set([...ids1, ...ids2]).size).toBe(20);
    });
  });

  describe('search relevance ordering', () => {
    it('exact business title ranks before service-only match', async () => {
      const prisma = {
        business: {
          count: jest.fn().mockResolvedValue(3),
          findMany: jest.fn().mockResolvedValue([
            makeBusiness('svc-only', 'Beauty Lounge'),
            makeBusiness('exact', 'Маникюр'),
            makeBusiness('desc', 'Nails', { shortDesc: 'маникюр классический' }),
          ]),
        },
        serviceItem: {
          findMany: jest
            .fn()
            .mockResolvedValueOnce([
              {
                id: 'item-1',
                businessId: 'svc-only',
                title: 'маникюр',
                titleKk: null,
                description: null,
                descriptionKk: null,
                sortOrder: 0,
                createdAt: new Date(),
                group: null,
                business: { planTier: BusinessPlanTier.FREE, planExpiresAt: null },
              },
            ])
            .mockResolvedValueOnce([
              {
                id: 'item-1',
                businessId: 'svc-only',
                title: 'маникюр',
                titleKk: null,
                description: null,
                descriptionKk: null,
                sortOrder: 0,
                createdAt: new Date(),
                group: null,
                business: { planTier: BusinessPlanTier.FREE, planExpiresAt: null },
              },
            ]),
        },
      } as unknown as PrismaService;
      const service = buildService(prisma);

      const result = await service.findAll({
        citySlug: 'uralsk',
        search: 'маникюр',
        sort: BusinessCatalogSort.RECOMMENDED,
        limit: 20,
      });

      expect(result.items.map((b) => b.id)).toEqual(['exact', 'svc-only', 'desc']);
    });

    it('FREE vs VIP does not change organic relevance order', async () => {
      const prisma = {
        business: {
          count: jest.fn().mockResolvedValue(2),
          findMany: jest.fn().mockResolvedValue([
            makeBusiness('vip', 'Маникюр VIP', { planTier: BusinessPlanTier.VIP }),
            makeBusiness('free', 'Маникюр', { planTier: BusinessPlanTier.FREE }),
          ]),
        },
        serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaService;
      const service = buildService(prisma);

      const result = await service.findAll({
        citySlug: 'uralsk',
        search: 'маникюр',
        sort: BusinessCatalogSort.RECOMMENDED,
      });

      expect(result.items.map((b) => b.id)).toEqual(['free', 'vip']);
    });
  });

  describe('service search eligibility before pagination', () => {
    it('hidden plan-capped service does not inflate total', async () => {
      const businessId = 'biz-overflow';
      const filler = Array.from({ length: 10 }, (_, index) => ({
        id: `visible-${index}`,
        businessId,
        title: `Visible ${index}`,
        titleKk: null,
        description: null,
        descriptionKk: null,
        sortOrder: index,
        createdAt: new Date(Date.now() - index * 1000),
        group: null,
        business: { planTier: BusinessPlanTier.FREE, planExpiresAt: null },
      }));
      const hiddenMatch = {
        id: 'hidden-match',
        businessId,
        title: 'секретная услуга',
        titleKk: null,
        description: null,
        descriptionKk: null,
        sortOrder: 999,
        createdAt: new Date(),
        group: null,
        business: { planTier: BusinessPlanTier.FREE, planExpiresAt: null },
      };
      const prisma = {
        business: {
          count: jest.fn().mockResolvedValue(0),
          findMany: jest.fn().mockResolvedValue([]),
        },
        serviceItem: {
          findMany: jest
            .fn()
            .mockResolvedValueOnce([hiddenMatch])
            .mockResolvedValueOnce([...filler, hiddenMatch]),
        },
      } as unknown as PrismaService;
      const service = buildService(prisma);

      const result = await service.findAll({
        citySlug: 'uralsk',
        search: 'секретная',
        limit: 20,
      });

      expect(result.meta.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });
});
