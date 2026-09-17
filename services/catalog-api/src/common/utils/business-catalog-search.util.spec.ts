import { Prisma } from '@prisma/client';
import {
  appendBusinessCatalogTextSearch,
  buildBusinessCatalogSearchOr,
} from './business-catalog-search.util';

describe('business-catalog-search.util (6.11B.1)', () => {
  it('builds OR branches for business, taxonomy, and public service items', () => {
    const or = buildBusinessCatalogSearchOr('караоке');
    expect(or).toHaveLength(6);
    expect(or[0]).toEqual({
      title: { contains: 'караоке', mode: 'insensitive' },
    });
    expect(or[3]).toEqual(
      expect.objectContaining({
        category: expect.any(Object),
      }),
    );
    expect(or[4]).toEqual(
      expect.objectContaining({
        businessSubcategories: expect.any(Object),
      }),
    );
    const serviceBranch = or[5] as { serviceItems: { some: { AND: unknown[] } } };
    expect(serviceBranch.serviceItems.some.AND[0]).toEqual(
      expect.objectContaining({ isActive: true }),
    );
    expect(JSON.stringify(or)).not.toContain('promotion');
  });

  it('appendBusinessCatalogTextSearch leaves city/status AND intact', () => {
    const where: Prisma.BusinessWhereInput = {
      cityId: 'city-uralsk',
      status: 'ACTIVE',
      categoryId: 'cat-beauty',
    };
    appendBusinessCatalogTextSearch(where, '  nails  ');
    expect(where.cityId).toBe('city-uralsk');
    expect(where.categoryId).toBe('cat-beauty');
    expect(where.OR).toHaveLength(6);
    expect(where.OR![0]).toEqual(
      expect.objectContaining({ title: { contains: 'nails', mode: 'insensitive' } }),
    );
  });

  it('does not set OR when normalized search is empty', () => {
    const where: Prisma.BusinessWhereInput = { cityId: 'x' };
    expect(appendBusinessCatalogTextSearch(where, '   ')).toBeNull();
    expect(where.OR).toBeUndefined();
  });
});
