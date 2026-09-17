import { Prisma } from '@prisma/client';
import { normalizeCatalogSearchQuery } from './catalog-search-query.util';

const insensitiveContains = (search: string): Prisma.StringFilter => ({
  contains: search,
  mode: 'insensitive',
});

/** Public ServiceItem visibility aligned with getPublishedCatalogItems query. */
export const publicServiceItemSearchScope: Prisma.ServiceItemWhereInput = {
  isActive: true,
  OR: [{ groupId: null }, { group: { isActive: true } }],
};

export function buildBusinessCatalogSearchOr(search: string): Prisma.BusinessWhereInput[] {
  const contains = insensitiveContains(search);
  return [
    { title: contains },
    { shortDesc: contains },
    { address: contains },
    {
      category: {
        OR: [{ title: contains }, { nameRu: contains }, { nameKk: contains }],
      },
    },
    {
      businessSubcategories: {
        some: {
          subcategory: {
            OR: [{ nameRu: contains }, { nameKk: contains }],
          },
        },
      },
    },
    {
      serviceItems: {
        some: {
          AND: [
            publicServiceItemSearchScope,
            {
              OR: [
                { title: contains },
                { titleKk: contains },
                { description: contains },
                { descriptionKk: contains },
              ],
            },
          ],
        },
      },
    },
  ];
}

/** Applies text-search OR to an existing AND-scoped Business where (city, status, filters). */
export function appendBusinessCatalogTextSearch(
  where: Prisma.BusinessWhereInput,
  rawSearch?: string | null,
): string | null {
  const normalized = normalizeCatalogSearchQuery(rawSearch);
  if (!normalized) return null;
  where.OR = buildBusinessCatalogSearchOr(normalized);
  return normalized;
}
