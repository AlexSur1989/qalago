import { BusinessPlanTier, BusinessStatus, Prisma } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { findBusinessIdsWithVisibleServiceItemSearch } from '../../common/utils/business-catalog-search.util';
import { normalizeCatalogSearchQuery } from '../../common/utils/catalog-search-query.util';
import { BusinessCatalogSort } from '../../common/utils/business-catalog-sort.util';
import { withBusinessListCount } from '../../test-utils/mock-business-catalog-prisma';

describe('Stage 6.11B.2 — multilingual search integrity', () => {
  const cityUralsk = 'city-uralsk';
  const cityAktobe = 'city-aktobe';

  const cityScope = {
    resolveCityId: jest.fn().mockImplementation(({ citySlug }: { citySlug?: string }) => {
      if (citySlug === 'aktobe') return Promise.resolve(cityAktobe);
      return Promise.resolve(cityUralsk);
    }),
  } as unknown as CityScopeService;

  const category = {
    id: 'cat-1',
    title: 'Retail',
    slug: 'retail',
    icon: null,
    nameRu: 'Магазины',
    nameKk: 'Дүкендер',
  };

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
      {} as never,
      {} as never,
      { get: jest.fn() } as never,
      {} as never,
    );
  }

  function makeBusiness(
    id: string,
    title: string,
    cityId: string,
    categoryId: string,
    status: BusinessStatus = BusinessStatus.ACTIVE,
  ) {
    return {
      id,
      title,
      slug: id,
      shortDesc: null,
      address: 'Street 1',
      cityId,
      categoryId,
      latitude: null,
      longitude: null,
      phone: null,
      whatsapp: null,
      coverImageUrl: null,
      status,
      isFeatured: false,
      planTier: BusinessPlanTier.FREE,
      planExpiresAt: null,
      featuredSlot: null,
      createdAt: new Date(),
      category,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visible ServiceItem resolver (relational query + plan cap)', () => {
    it('returns business when match is on published slot only', async () => {
      const businessId = 'biz-visible';
      const prisma = {
        serviceItem: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'svc-1',
              businessId,
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
      };

      const ids = await findBusinessIdsWithVisibleServiceItemSearch(
        prisma,
        { cityId: cityUralsk, status: BusinessStatus.ACTIVE },
        'МАНИКЮР',
      );
      expect(ids).toEqual([businessId]);
      expect(prisma.serviceItem.findMany).toHaveBeenCalledTimes(2);
    });

    it('excludes match on item beyond FREE plan cap (integration)', async () => {
      const businessId = 'biz-overflow';
      const hiddenMatch = {
        id: 'item-10',
        businessId,
        title: 'редкая услуга',
        titleKk: null,
        description: null,
        descriptionKk: null,
        sortOrder: 10,
        createdAt: new Date(),
        group: null,
        business: { planTier: BusinessPlanTier.FREE, planExpiresAt: null },
      };
      const filler = Array.from({ length: 10 }, (_, index) => ({
        id: `item-${index}`,
        businessId,
        title: `Service ${index}`,
        titleKk: null,
        description: null,
        descriptionKk: null,
        sortOrder: index,
        createdAt: new Date(Date.now() - index * 1000),
        group: null,
        business: { planTier: BusinessPlanTier.FREE, planExpiresAt: null },
      }));
      const prismaHidden = {
        serviceItem: {
          findMany: jest
            .fn()
            .mockResolvedValueOnce([hiddenMatch])
            .mockResolvedValueOnce([...filler, hiddenMatch]),
        },
      };
      expect(
        await findBusinessIdsWithVisibleServiceItemSearch(
          prismaHidden,
          { cityId: cityUralsk, status: BusinessStatus.ACTIVE },
          'редкая',
        ),
      ).toEqual([]);

      const visibleMatch = [
        {
          id: 'item-0',
          businessId,
          title: 'редкая услуга видимая',
          titleKk: null,
          description: null,
          descriptionKk: null,
          sortOrder: 0,
          createdAt: new Date(),
          group: null,
          business: { planTier: BusinessPlanTier.FREE, planExpiresAt: null },
        },
      ];
      const prismaVisible = {
        serviceItem: {
          findMany: jest
            .fn()
            .mockResolvedValueOnce(visibleMatch)
            .mockResolvedValueOnce(visibleMatch),
        },
      };
      expect(
        await findBusinessIdsWithVisibleServiceItemSearch(
          prismaVisible,
          { cityId: cityUralsk, status: BusinessStatus.ACTIVE },
          'редкая',
        ),
      ).toEqual([businessId]);
    });

    it('city isolation on service-item query', async () => {
      const prisma = {
        serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
      };
      await findBusinessIdsWithVisibleServiceItemSearch(
        prisma,
        { cityId: cityUralsk, status: BusinessStatus.ACTIVE },
        'балалар киімі',
      );
      const where = (prisma.serviceItem.findMany as jest.Mock).mock.calls[0][0].where;
      expect(JSON.stringify(where)).toContain(cityUralsk);
      expect(JSON.stringify(where)).not.toContain(cityAktobe);
    });

    it('Kazakh characters preserved in normalized search', () => {
      expect(normalizeCatalogSearchQuery('  балалар   киімі  ')).toBe('балалар киімі');
      expect(normalizeCatalogSearchQuery('әғқңөұүһі')).toBe('әғқңөұүһі');
    });
  });

  describe('BusinessesService.findAll end-to-end (mocked DB)', () => {
    it('returns business once when title + service paths both match', async () => {
      const biz = makeBusiness('biz-a', 'Магазин А', cityUralsk, 'cat-1');
      const prisma = {
        ...withBusinessListCount({ business: { findMany: jest.fn().mockResolvedValue([biz]) } }, 1),
        serviceItem: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'svc',
              businessId: 'biz-a',
              title: 'детская одежда',
              titleKk: 'Балалар киімі',
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
        search: 'детская одежда',
        limit: 20,
      });
      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('category filter AND search — wrong category excluded at query level', async () => {
      const prisma = {
        ...withBusinessListCount({ business: { findMany: jest.fn().mockResolvedValue([]) } }, 0),
        serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaService;
      const service = buildService(prisma);
      await service.findAll({
        citySlug: 'uralsk',
        categoryId: 'cat-beauty',
        search: 'pizza',
        sort: BusinessCatalogSort.RECOMMENDED,
      });
      const where = (prisma.business.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.categoryId).toBe('cat-beauty');
      const serviceWhere = (prisma.serviceItem.findMany as jest.Mock).mock.calls[0][0].where;
      expect(JSON.stringify(serviceWhere)).toContain('cat-beauty');
    });

    it('inactive business excluded by status AND', async () => {
      const prisma = {
        ...withBusinessListCount({ business: { findMany: jest.fn().mockResolvedValue([]) } }, 0),
        serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaService;
      const service = buildService(prisma);
      await service.findAll({ citySlug: 'uralsk', search: 'караоке' });
      const where = (prisma.business.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.status).toBe(BusinessStatus.ACTIVE);
    });

    it('adds visible-service business ids to OR without planTier in where', async () => {
      const prisma = {
        ...withBusinessListCount({ business: { findMany: jest.fn().mockResolvedValue([]) } }, 0),
        serviceItem: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 's1',
              businessId: 'only-service',
              title: 'замена масла',
              titleKk: null,
              description: null,
              descriptionKk: null,
              sortOrder: 0,
              createdAt: new Date(),
              group: null,
              business: { planTier: BusinessPlanTier.VIP, planExpiresAt: null },
            },
          ]),
        },
      } as unknown as PrismaService;
      const service = buildService(prisma);
      await service.findAll({ citySlug: 'uralsk', search: 'масла' });
      const where = (prisma.business.findMany as jest.Mock).mock.calls[0][0].where as Prisma.BusinessWhereInput;
      expect(where.OR).toEqual(
        expect.arrayContaining([{ id: { in: ['only-service'] } }]),
      );
      expect(JSON.stringify(where)).not.toContain('planTier');
    });
  });
});
