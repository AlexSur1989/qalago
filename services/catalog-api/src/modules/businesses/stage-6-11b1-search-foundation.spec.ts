import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BusinessPlanTier, BusinessStatus, Prisma } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { ListBusinessesQueryDto } from './dto/business.dto';
import { BusinessCatalogSort } from '../../common/utils/business-catalog-sort.util';
import { CATALOG_SEARCH_MAX_LENGTH } from '../../common/utils/catalog-search-query.util';
import { buildBusinessCatalogSearchOr } from '../../common/utils/business-catalog-search.util';
import { withBusinessListCount } from '../../test-utils/mock-business-catalog-prisma';

describe('Stage 6.11B.1 — search backend foundation', () => {
  const cityScope = {
    resolveCityId: jest.fn().mockResolvedValue('city-uralsk'),
  } as unknown as CityScopeService;

  const category = { id: 'cat-food', title: 'Еда', slug: 'food', icon: null };

  function makeBusiness(
    id: string,
    title: string,
    overrides: Partial<{ status: BusinessStatus; categoryId: string; planTier: BusinessPlanTier }> = {},
  ) {
    return {
      id,
      title,
      slug: id,
      shortDesc: `${title} desc`,
      address: `${title} street`,
      cityId: 'city-uralsk',
      categoryId: overrides.categoryId ?? 'cat-food',
      latitude: null,
      longitude: null,
      phone: null,
      whatsapp: null,
      coverImageUrl: null,
      status: overrides.status ?? BusinessStatus.ACTIVE,
      isFeatured: false,
      planTier: overrides.planTier ?? BusinessPlanTier.FREE,
      planExpiresAt: null,
      featuredSlot: null,
      createdAt: new Date(),
      category,
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
      {} as never,
    );
  }

  function lastWhere(prisma: PrismaService) {
    return (prisma.business.findMany as jest.Mock).mock.calls.at(-1)![0].where;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /businesses search where-clause', () => {
    const prisma = {
      ...withBusinessListCount(
        { business: { findMany: jest.fn().mockResolvedValue([]) } },
        0,
      ),
      serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;

    const service = buildService(prisma);

    it('A/B: business title case-insensitive branch', async () => {
      await service.findAll({ citySlug: 'uralsk', search: 'Pizza' });
      const where = lastWhere(prisma);
      expect(where.OR).toEqual(
        expect.arrayContaining([
          { title: { contains: 'Pizza', mode: 'insensitive' } },
        ]),
      );
    });

    it('C/D: shortDesc and address branches present', async () => {
      await service.findAll({ citySlug: 'uralsk', search: 'main' });
      const or = lastWhere(prisma).OR!;
      expect(or).toEqual(
        expect.arrayContaining([
          { shortDesc: { contains: 'main', mode: 'insensitive' } },
          { address: { contains: 'main', mode: 'insensitive' } },
        ]),
      );
    });

    it('E/F: category RU and KK branches', async () => {
      await service.findAll({ citySlug: 'uralsk', search: 'ресторан' });
      const or = lastWhere(prisma).OR!;
      const categoryBranch = or.find((b: Prisma.BusinessWhereInput) => 'category' in b) as {
        category: { OR: unknown[] };
      };
      expect(categoryBranch.category.OR).toEqual(
        expect.arrayContaining([
          { nameRu: { contains: 'ресторан', mode: 'insensitive' } },
          { nameKk: { contains: 'ресторан', mode: 'insensitive' } },
        ]),
      );
    });

    it('G/H: subcategory RU and KK branches', async () => {
      await service.findAll({ citySlug: 'uralsk', search: 'маникюр' });
      const or = lastWhere(prisma).OR!;
      const subBranch = or.find((b: Prisma.BusinessWhereInput) => 'businessSubcategories' in b);
      expect(subBranch).toBeDefined();
      expect(JSON.stringify(subBranch)).toContain('nameKk');
    });

    it('I/J: visible service search uses dedicated query with titleKk', async () => {
      await service.findAll({ citySlug: 'uralsk', search: 'балалар киімі' });
      expect(prisma.serviceItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  { titleKk: { contains: 'балалар киімі', mode: 'insensitive' } },
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('K/L: service description RU/KK included in visible-service query', async () => {
      await service.findAll({ citySlug: 'uralsk', search: 'oil' });
      const call = (prisma.serviceItem.findMany as jest.Mock).mock.calls.at(-1)![0];
      expect(JSON.stringify(call.where)).toContain('descriptionKk');
    });

    it('W/X: whitespace normalization; empty search omits OR', async () => {
      await service.findAll({ citySlug: 'uralsk', search: '  караоке  ' });
      expect(lastWhere(prisma).OR![0]).toEqual(
        expect.objectContaining({
          title: { contains: 'караоке', mode: 'insensitive' },
        }),
      );

      await service.findAll({ citySlug: 'uralsk', search: '   ' });
      expect(lastWhere(prisma).OR).toBeUndefined();
    });

    it('N: city isolation stays AND-scoped', async () => {
      await service.findAll({ citySlug: 'uralsk', search: 'детская одежда' });
      const where = lastWhere(prisma);
      expect(where.cityId).toBe('city-uralsk');
      expect(where.OR!.length).toBeGreaterThanOrEqual(5);
    });

    it('O: ACTIVE default with search', async () => {
      await service.findAll({ citySlug: 'uralsk', search: 'bar' });
      expect(lastWhere(prisma).status).toBe(BusinessStatus.ACTIVE);
    });

    it('P: categoryId AND search (adversarial 2)', async () => {
      await service.findAll({
        citySlug: 'uralsk',
        categoryId: 'cat-beauty',
        search: 'food-title-match',
      });
      const where = lastWhere(prisma);
      expect(where.categoryId).toBe('cat-beauty');
      expect(where.OR).toBeDefined();
    });

    it('Q: subcategoryId AND search', async () => {
      const subDeps = createMockSubcategoryDeps();
      subDeps.subcategories.assertSubcategoryFilter = jest.fn().mockResolvedValue(undefined);
      const svc = new BusinessesService(
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
      );
      await svc.findAll({
        citySlug: 'uralsk',
        categoryId: 'cat-food',
        subcategoryId: 'sub-1',
        search: 'pizza',
      });
      const where = lastWhere(prisma);
      expect(where.businessSubcategories).toEqual({
        some: { subcategoryId: 'sub-1' },
      });
      expect(where.OR).toBeDefined();
    });

    it('R: visible service query requires isActive and active group', async () => {
      await service.findAll({ citySlug: 'uralsk', search: 'secret' });
      const call = (prisma.serviceItem.findMany as jest.Mock).mock.calls.at(-1)![0];
      expect(JSON.stringify(call.where)).toContain('isActive');
      expect(JSON.stringify(call.where)).toContain('groupId');
    });

    it('U: promotions are not searchable via business OR', async () => {
      const serialized = JSON.stringify(buildBusinessCatalogSearchOr('promo'));
      expect(serialized).not.toMatch(/promotion/i);
    });

    it('V: organic matching where has no planTier filter', async () => {
      await service.findAll({ citySlug: 'uralsk', search: 'cafe' });
      expect(JSON.stringify(lastWhere(prisma))).not.toContain('planTier');
    });
  });

  describe('DTO validation', () => {
    it('Y: accepts 100-character search', async () => {
      const dto = plainToInstance(ListBusinessesQueryDto, {
        citySlug: 'uralsk',
        search: 'z'.repeat(100),
      });
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === 'search')).toHaveLength(0);
      expect(dto.search!.length).toBe(CATALOG_SEARCH_MAX_LENGTH);
    });

    it('Z: rejects 101-character search', async () => {
      const dto = plainToInstance(ListBusinessesQueryDto, {
        citySlug: 'uralsk',
        search: 'z'.repeat(101),
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'search')).toBe(true);
    });
  });

  describe('Result shape and ordering', () => {
    it('S/T: duplicate prevention — one row per business from findMany', async () => {
      const prisma = {
        ...withBusinessListCount(
          {
            business: {
              findMany: jest.fn().mockResolvedValue([makeBusiness('biz-a', 'Магазин А')]),
            },
          },
          1,
        ),
        serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaService;
      const service = buildService(prisma);
      const result = await service.findAll({
        citySlug: 'uralsk',
        search: 'детская',
        limit: 20,
      });
      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('V: VIP vs FREE both eligible; sort remains plan-neutral title order', async () => {
      const prisma = {
        ...withBusinessListCount(
          {
            business: {
              findMany: jest.fn().mockResolvedValue([
                makeBusiness('vip', 'Zulu VIP', { planTier: BusinessPlanTier.VIP }),
                makeBusiness('free', 'Alpha Free', { planTier: BusinessPlanTier.FREE }),
              ]),
            },
          },
          2,
        ),
        serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaService;
      const service = buildService(prisma);
      const result = await service.findAll({
        citySlug: 'uralsk',
        search: 'a',
        sort: BusinessCatalogSort.RECOMMENDED,
        limit: 20,
      });
      expect(result.items.map((b) => b.id)).toEqual(['free', 'vip']);
    });
  });

  describe('Adversarial OR-grouping (mandatory)', () => {
    it('TEST 1: wrong-city filter enforced in AND, not OR', async () => {
      const prisma = {
        ...withBusinessListCount({ business: { findMany: jest.fn().mockResolvedValue([]) } }, 0),
        serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaService;
      const service = buildService(prisma);
      await service.findAll({ citySlug: 'uralsk', search: 'aktobe-only-item' });
      expect(lastWhere(prisma).cityId).toBe('city-uralsk');
    });

    it('TEST 2: category filter AND text search', async () => {
      const prisma = {
        ...withBusinessListCount({ business: { findMany: jest.fn().mockResolvedValue([]) } }, 0),
        serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaService;
      const service = buildService(prisma);
      await service.findAll({
        citySlug: 'uralsk',
        categoryId: 'cat-beauty',
        search: 'pizza',
      });
      const where = lastWhere(prisma);
      expect(where.categoryId).toBe('cat-beauty');
      expect(where.OR).toBeDefined();
    });

    it('TEST 3: inactive businesses excluded by default status filter', async () => {
      const prisma = {
        ...withBusinessListCount({ business: { findMany: jest.fn().mockResolvedValue([]) } }, 0),
        serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaService;
      const service = buildService(prisma);
      await service.findAll({ citySlug: 'uralsk', search: 'exact-title' });
      expect(lastWhere(prisma).status).toBe(BusinessStatus.ACTIVE);
    });

    it('TEST 4: visible service query requires public visibility predicates', async () => {
      const localPrisma = {
        ...withBusinessListCount({ business: { findMany: jest.fn().mockResolvedValue([]) } }, 0),
        serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaService;
      const localService = buildService(localPrisma);
      await localService.findAll({ citySlug: 'uralsk', search: 'hidden-item' });
      const call = (localPrisma.serviceItem.findMany as jest.Mock).mock.calls[0][0];
      expect(JSON.stringify(call.where)).toMatch(/isActive/);
      expect(JSON.stringify(call.where)).toMatch(/groupId/);
    });
  });
});
