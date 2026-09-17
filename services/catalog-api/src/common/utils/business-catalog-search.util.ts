import { BusinessPlanTier, BusinessStatus, Prisma } from '@prisma/client';
import { normalizeCatalogSearchQuery } from './catalog-search-query.util';
import { selectPublishedCatalogServiceItems } from './public-catalog-service-items.util';

const insensitiveContains = (search: string): Prisma.StringFilter => ({
  contains: search,
  mode: 'insensitive',
});

/** Active item in active or ungrouped section — DB filter shared with catalog fetch. */
export const publicServiceItemSearchScope: Prisma.ServiceItemWhereInput = {
  isActive: true,
  OR: [{ groupId: null }, { group: { isActive: true } }],
};

export type BusinessCatalogSearchScope = {
  cityId: string;
  status: BusinessStatus;
  categoryId?: string;
  subcategoryId?: string;
};

export function buildBusinessCatalogTextSearchOr(search: string): Prisma.BusinessWhereInput[] {
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
  ];
}

/** @deprecated Use buildBusinessCatalogTextSearchOr — includes only non–service-item branches. */
export function buildBusinessCatalogSearchOr(search: string): Prisma.BusinessWhereInput[] {
  return buildBusinessCatalogTextSearchOr(search);
}

type ServiceItemSearchClient = {
  serviceItem: {
    findMany: (args: Prisma.ServiceItemFindManyArgs) => Promise<unknown[]>;
  };
};

/**
 * Businesses whose *consumer-visible* catalog items match search text.
 * One bounded query; plan cap applied in memory using canonical sort + slice.
 */
export async function findBusinessIdsWithVisibleServiceItemSearch(
  prisma: ServiceItemSearchClient,
  scope: BusinessCatalogSearchScope,
  search: string,
): Promise<string[]> {
  const contains = insensitiveContains(search);
  const businessScope: Prisma.BusinessWhereInput = {
    cityId: scope.cityId,
    status: scope.status,
    ...(scope.categoryId ? { categoryId: scope.categoryId } : {}),
    ...(scope.subcategoryId
      ? {
          businessSubcategories: {
            some: { subcategoryId: scope.subcategoryId },
          },
        }
      : {}),
  };

  const itemSelect = {
    id: true,
    businessId: true,
    title: true,
    titleKk: true,
    description: true,
    descriptionKk: true,
    sortOrder: true,
    createdAt: true,
    group: { select: { sortOrder: true, title: true } },
    business: { select: { planTier: true, planExpiresAt: true } },
  } satisfies Prisma.ServiceItemSelect;

  const matchingItems = await prisma.serviceItem.findMany({
    where: {
      AND: [
        publicServiceItemSearchScope,
        { business: businessScope },
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
    select: itemSelect,
  });

  type Row = {
    id: string;
    businessId: string;
    sortOrder: number;
    createdAt: Date;
    title: string | null;
    group: { sortOrder: number; title: string } | null;
    business: { planTier: BusinessPlanTier; planExpiresAt: Date | null };
  };

  const matches = matchingItems as Row[];
  if (matches.length === 0) return [];

  const matchingIdsByBusiness = new Map<string, Set<string>>();
  for (const item of matches) {
    const set = matchingIdsByBusiness.get(item.businessId) ?? new Set<string>();
    set.add(item.id);
    matchingIdsByBusiness.set(item.businessId, set);
  }

  const candidateBusinessIds = [...matchingIdsByBusiness.keys()];
  const allPublicItems = await prisma.serviceItem.findMany({
    where: {
      AND: [publicServiceItemSearchScope, { businessId: { in: candidateBusinessIds } }],
    },
    select: itemSelect,
  });

  const catalogByBusiness = new Map<string, Row[]>();
  for (const item of allPublicItems as Row[]) {
    const bucket = catalogByBusiness.get(item.businessId) ?? [];
    bucket.push(item);
    catalogByBusiness.set(item.businessId, bucket);
  }

  const businessIds: string[] = [];
  for (const businessId of candidateBusinessIds) {
    const catalog = catalogByBusiness.get(businessId) ?? [];
    if (catalog.length === 0) continue;
    const { planTier, planExpiresAt } = catalog[0]!.business;
    const published = selectPublishedCatalogServiceItems(catalog, planTier, planExpiresAt);
    const publishedIds = new Set(published.map((item) => item.id));
    const matchingIds = matchingIdsByBusiness.get(businessId)!;
    if ([...matchingIds].some((id) => publishedIds.has(id))) {
      businessIds.push(businessId);
    }
  }
  return businessIds;
}

/** Applies text-search OR under existing AND-scoped Business where (city, status, filters). */
export async function appendBusinessCatalogTextSearch(
  prisma: ServiceItemSearchClient,
  where: Prisma.BusinessWhereInput,
  rawSearch: string | null | undefined,
  scope: BusinessCatalogSearchScope,
): Promise<string | null> {
  const normalized = normalizeCatalogSearchQuery(rawSearch);
  if (!normalized) return null;

  const orBranches: Prisma.BusinessWhereInput[] = buildBusinessCatalogTextSearchOr(normalized);
  const visibleServiceBusinessIds = await findBusinessIdsWithVisibleServiceItemSearch(
    prisma,
    scope,
    normalized,
  );
  if (visibleServiceBusinessIds.length > 0) {
    orBranches.push({ id: { in: visibleServiceBusinessIds } });
  }
  where.OR = orBranches;
  return normalized;
}
