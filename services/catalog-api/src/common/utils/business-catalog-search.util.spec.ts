import { BusinessStatus, Prisma } from '@prisma/client';
import {
  appendBusinessCatalogTextSearch,
  buildBusinessCatalogTextSearchOr,
  findBusinessIdsWithVisibleServiceItemSearch,
  findVisibleServiceItemSearchMatches,
} from './business-catalog-search.util';

describe('business-catalog-search.util (6.11B.1 / 6.11B.2)', () => {
  it('builds text OR branches without raw service-item relation leak', () => {
    const or = buildBusinessCatalogTextSearchOr('караоке');
    expect(or).toHaveLength(4);
    expect(or[0]).toEqual({
      title: { contains: 'караоке', mode: 'insensitive' },
    });
    expect(or[3]).toEqual(
      expect.objectContaining({
        businessSubcategories: expect.any(Object),
      }),
    );
    expect(JSON.stringify(or)).not.toContain('serviceItems');
  });

  it('appendBusinessCatalogTextSearch leaves city/status AND intact', async () => {
    const prisma = {
      serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
      businessLocation: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const where: Prisma.BusinessWhereInput = {
      locations: { some: { cityId: 'city-uralsk' } },
      status: BusinessStatus.ACTIVE,
      categoryId: 'cat-beauty',
    };
    await appendBusinessCatalogTextSearch(prisma, where, '  nails  ', {
      cityId: 'city-uralsk',
      status: BusinessStatus.ACTIVE,
      categoryId: 'cat-beauty',
    });
    expect(where.locations).toEqual({ some: { cityId: 'city-uralsk' } });
    expect(where.categoryId).toBe('cat-beauty');
    expect(where.OR).toHaveLength(5);
    expect(where.OR![0]).toEqual(
      expect.objectContaining({ title: { contains: 'nails', mode: 'insensitive' } }),
    );
  });

  it('does not set OR when normalized search is empty', async () => {
    const prisma = { serviceItem: { findMany: jest.fn() } };
    const where: Prisma.BusinessWhereInput = { locations: { some: { cityId: 'x' } } };
    await expect(
      appendBusinessCatalogTextSearch(prisma, where, '   ', {
        cityId: 'x',
        status: BusinessStatus.ACTIVE,
      }),
    ).resolves.toBeNull();
    expect(where.OR).toBeUndefined();
    expect(prisma.serviceItem.findMany).not.toHaveBeenCalled();
  });

  it('plan-cap: excess matching item does not qualify business', async () => {
    const businessId = 'biz-free';
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
      business: { planTier: 'FREE' as const, planExpiresAt: null },
      branchAvailabilities: [],
    }));
    const hiddenMatch = {
      id: 'hidden-match',
      businessId,
      title: 'редкая услуга',
      titleKk: null,
      description: null,
      descriptionKk: null,
      sortOrder: 999,
      createdAt: new Date(Date.now() - 999000),
      group: null,
      business: { planTier: 'FREE' as const, planExpiresAt: null },
      branchAvailabilities: [],
    };
    const prisma = {
      serviceItem: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([hiddenMatch])
          .mockResolvedValueOnce([...filler, hiddenMatch]),
      },
    };

    const ids = await findBusinessIdsWithVisibleServiceItemSearch(
      prisma,
      { cityId: 'city-1', status: BusinessStatus.ACTIVE },
      'редкая',
    );
    expect(ids).toEqual([]);
  });

  it('plan-cap: same term on visible item qualifies business', async () => {
    const businessId = 'biz-free';
    const visibleMatch = {
      id: 'visible-match',
      businessId,
      title: 'маникюр',
      titleKk: null,
      description: null,
      descriptionKk: null,
      sortOrder: 0,
      createdAt: new Date(),
      group: null,
      business: { planTier: 'FREE' as const, planExpiresAt: null },
      branchAvailabilities: [],
    };
    const prisma = {
      serviceItem: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([visibleMatch])
          .mockResolvedValueOnce([visibleMatch]),
      },
    };

    const ids = await findBusinessIdsWithVisibleServiceItemSearch(
      prisma,
      { cityId: 'city-1', status: BusinessStatus.ACTIVE },
      'маникюр',
    );
    expect(ids).toEqual([businessId]);
  });

  it('SELECTED SIBA: item not searchable in city without assignment', async () => {
    const businessId = 'biz-cross';
    const item = {
      id: 'item-1',
      businessId,
      title: 'Капучино',
      titleKk: null,
      description: null,
      descriptionKk: null,
      sortOrder: 0,
      createdAt: new Date(),
      group: null,
      business: { planTier: 'FREE' as const, planExpiresAt: null },
      branchAvailabilities: [
        {
          locationId: 'loc-aktobe',
          branchLocation: {
            id: 'loc-aktobe',
            cityId: 'city-aktobe',
            isPrimary: false,
            createdAt: new Date(1),
          },
        },
      ],
    };
    const prisma = {
      serviceItem: {
        findMany: jest.fn().mockResolvedValue([item]),
      },
    };

    const oral = await findVisibleServiceItemSearchMatches(
      prisma,
      { cityId: 'city-oral', status: BusinessStatus.ACTIVE },
      'Капучино',
    );
    expect(oral.businessIds).toEqual([]);

    const aktobe = await findVisibleServiceItemSearchMatches(
      prisma,
      { cityId: 'city-aktobe', status: BusinessStatus.ACTIVE },
      'Капучино',
    );
    expect(aktobe.businessIds).toEqual([businessId]);
    expect(aktobe.selectedContextLocationIdByBusinessId.get(businessId)).toBe('loc-aktobe');
  });
});
