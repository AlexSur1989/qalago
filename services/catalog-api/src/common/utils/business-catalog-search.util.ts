import { BusinessPlanTier, BusinessStatus, Prisma } from '@prisma/client';
import { normalizeCatalogSearchQuery } from './catalog-search-query.util';
import { selectPublishedCatalogServiceItems } from './public-catalog-service-items.util';
import type { ServiceSearchMatchKind } from './business-catalog-search-relevance.util';
import { catalogSearchNeedle } from './catalog-search-query.util';
import {
  buildBusinessCatalogBranchAddressSearchWhere,
  evaluateServiceItemSearchBranchAvailabilityInCity,
  pickDeterministicSearchContextBranch,
  type SearchContextBranchRow,
} from './business-catalog-search-branch.util';

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
  businessLocation?: {
    findMany: (args: Prisma.BusinessLocationFindManyArgs) => Promise<unknown[]>;
  };
};

/**
 * Businesses whose *consumer-visible* catalog items match search text.
 * One bounded query; plan cap applied in memory using canonical sort + slice.
 */
export type VisibleServiceItemSearchMatches = {
  businessIds: string[];
  matchKindByBusinessId: Map<string, ServiceSearchMatchKind>;
  /** SELECTED-mode service item matches only (ALL uses generic city context). */
  selectedContextLocationIdByBusinessId: Map<string, string>;
};

function serviceItemTextMatchKind(
  item: {
    title: string | null;
    titleKk?: string | null;
    description?: string | null;
    descriptionKk?: string | null;
  },
  needle: string,
): ServiceSearchMatchKind | null {
  const titleHit =
    (item.title != null && item.title.toLocaleLowerCase().includes(needle)) ||
    (item.titleKk != null && item.titleKk.toLocaleLowerCase().includes(needle));
  if (titleHit) return 'service_title';
  const descHit =
    (item.description != null && item.description.toLocaleLowerCase().includes(needle)) ||
    (item.descriptionKk != null && item.descriptionKk.toLocaleLowerCase().includes(needle));
  if (descHit) return 'service_description';
  return null;
}

export async function findVisibleServiceItemSearchMatches(
  prisma: ServiceItemSearchClient,
  scope: BusinessCatalogSearchScope,
  search: string,
): Promise<VisibleServiceItemSearchMatches> {
  const contains = insensitiveContains(search);
  const businessScope: Prisma.BusinessWhereInput = {
    locations: { some: { cityId: scope.cityId } },
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
    branchAvailabilities: {
      select: {
        locationId: true,
        branchLocation: {
          select: { id: true, cityId: true, isPrimary: true, createdAt: true },
        },
      },
    },
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
    branchAvailabilities: Array<{
      locationId: string;
      branchLocation: SearchContextBranchRow & { cityId: string };
    }>;
  };

  const matches = matchingItems as Row[];
  const needle = catalogSearchNeedle(search);
  if (matches.length === 0 || !needle) {
    return {
      businessIds: [],
      matchKindByBusinessId: new Map(),
      selectedContextLocationIdByBusinessId: new Map(),
    };
  }

  const matchingIdsByBusiness = new Map<string, Set<string>>();
  const rawMatchKindByItemId = new Map<string, ServiceSearchMatchKind>();
  for (const item of matches) {
    const set = matchingIdsByBusiness.get(item.businessId) ?? new Set<string>();
    set.add(item.id);
    matchingIdsByBusiness.set(item.businessId, set);
    const kind = serviceItemTextMatchKind(item, needle);
    if (kind) {
      rawMatchKindByItemId.set(item.id, kind);
    }
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

  const itemById = new Map<string, Row>();
  for (const item of matches) {
    itemById.set(item.id, item);
  }
  for (const item of allPublicItems as Row[]) {
    itemById.set(item.id, item);
  }

  const businessIds: string[] = [];
  const matchKindByBusinessId = new Map<string, ServiceSearchMatchKind>();
  const selectedContextLocationIdByBusinessId = new Map<string, string>();

  for (const businessId of candidateBusinessIds) {
    const catalog = catalogByBusiness.get(businessId) ?? [];
    if (catalog.length === 0) continue;
    const { planTier, planExpiresAt } = catalog[0]!.business;
    const published = selectPublishedCatalogServiceItems(catalog, planTier, planExpiresAt);
    const publishedIds = new Set(published.map((item) => item.id));
    const matchingIds = matchingIdsByBusiness.get(businessId)!;

    type EligibleMatch = {
      kind: ServiceSearchMatchKind;
      selectedContextLocation: SearchContextBranchRow | null;
    };
    const eligibleMatches: EligibleMatch[] = [];

    for (const id of matchingIds) {
      if (!publishedIds.has(id)) continue;
      const kind = rawMatchKindByItemId.get(id);
      if (!kind) continue;
      const item = itemById.get(id);
      if (!item) continue;
      const branchCheck = evaluateServiceItemSearchBranchAvailabilityInCity(
        item.branchAvailabilities,
        scope.cityId,
      );
      if (!branchCheck.eligible) continue;
      eligibleMatches.push({
        kind,
        selectedContextLocation: branchCheck.selectedContextLocation,
      });
    }

    if (eligibleMatches.length === 0) continue;

    const hasTitle = eligibleMatches.some((m) => m.kind === 'service_title');
    const bestKind: ServiceSearchMatchKind = hasTitle ? 'service_title' : 'service_description';
    const tierMatches = eligibleMatches.filter((m) =>
      hasTitle ? m.kind === 'service_title' : true,
    );

    const selectedBranches = tierMatches
      .map((m) => m.selectedContextLocation)
      .filter((loc): loc is SearchContextBranchRow => loc != null);
    if (selectedBranches.length > 0) {
      const picked = pickDeterministicSearchContextBranch(selectedBranches);
      if (picked) {
        selectedContextLocationIdByBusinessId.set(businessId, picked.id);
      }
    }

    businessIds.push(businessId);
    matchKindByBusinessId.set(businessId, bestKind);
  }
  return { businessIds, matchKindByBusinessId, selectedContextLocationIdByBusinessId };
}

type BranchAddressSearchClient = {
  businessLocation: {
    findMany: (args: Prisma.BusinessLocationFindManyArgs) => Promise<
      Array<{
        id: string;
        businessId: string;
        isPrimary: boolean;
        createdAt: Date;
      }>
    >;
  };
};

/** Bounded query: branch address matches in city C → deterministic contextLocationId per business. */
export async function findBranchAddressSearchContextByBusinessId(
  prisma: BranchAddressSearchClient,
  cityId: string,
  search: string,
): Promise<Map<string, string>> {
  const normalized = normalizeCatalogSearchQuery(search);
  if (!normalized) {
    return new Map();
  }
  const contains = insensitiveContains(normalized);
  const rows = await prisma.businessLocation.findMany({
    where: { cityId, address: contains },
    select: { id: true, businessId: true, isPrimary: true, createdAt: true },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });
  const map = new Map<string, string>();
  for (const row of rows) {
    if (!map.has(row.businessId)) {
      map.set(row.businessId, row.id);
    }
  }
  return map;
}

export async function findBusinessIdsWithVisibleServiceItemSearch(
  prisma: ServiceItemSearchClient,
  scope: BusinessCatalogSearchScope,
  search: string,
): Promise<string[]> {
  const { businessIds } = await findVisibleServiceItemSearchMatches(prisma, scope, search);
  return businessIds;
}

export type BusinessSearchContextLocationSource = 'selected_service_item' | 'branch_address';

export type BusinessCatalogSearchContext = {
  normalized: string;
  serviceMatchKindByBusinessId: Map<string, ServiceSearchMatchKind>;
  /** Precedence: selected service branch > branch address (geo applied separately). */
  searchContextLocationIdByBusinessId: Map<string, string>;
  searchContextSourceByBusinessId: Map<string, BusinessSearchContextLocationSource>;
  branchAddressMatchBusinessIds: Set<string>;
};

/** Applies text-search OR under existing AND-scoped Business where (city, status, filters). */
export async function appendBusinessCatalogTextSearch(
  prisma: ServiceItemSearchClient,
  where: Prisma.BusinessWhereInput,
  rawSearch: string | null | undefined,
  scope: BusinessCatalogSearchScope,
): Promise<BusinessCatalogSearchContext | null> {
  const normalized = normalizeCatalogSearchQuery(rawSearch);
  if (!normalized) return null;

  const orBranches: Prisma.BusinessWhereInput[] = buildBusinessCatalogTextSearchOr(normalized);
  orBranches.push(buildBusinessCatalogBranchAddressSearchWhere(scope.cityId, normalized));

  const { businessIds: visibleServiceBusinessIds, matchKindByBusinessId, selectedContextLocationIdByBusinessId } =
    await findVisibleServiceItemSearchMatches(prisma, scope, normalized);
  if (visibleServiceBusinessIds.length > 0) {
    orBranches.push({ id: { in: visibleServiceBusinessIds } });
  }

  const branchAddressContext =
    typeof prisma.businessLocation?.findMany === 'function'
      ? await findBranchAddressSearchContextByBusinessId(
          prisma as BranchAddressSearchClient,
          scope.cityId,
          normalized,
        )
      : new Map<string, string>();

  const searchContextLocationIdByBusinessId = new Map<string, string>();
  const searchContextSourceByBusinessId = new Map<string, BusinessSearchContextLocationSource>();

  for (const [businessId, locationId] of selectedContextLocationIdByBusinessId) {
    searchContextLocationIdByBusinessId.set(businessId, locationId);
    searchContextSourceByBusinessId.set(businessId, 'selected_service_item');
  }
  for (const [businessId, locationId] of branchAddressContext) {
    if (!searchContextLocationIdByBusinessId.has(businessId)) {
      searchContextLocationIdByBusinessId.set(businessId, locationId);
      searchContextSourceByBusinessId.set(businessId, 'branch_address');
    }
  }

  where.OR = orBranches;
  return {
    normalized,
    serviceMatchKindByBusinessId: matchKindByBusinessId,
    searchContextLocationIdByBusinessId,
    searchContextSourceByBusinessId,
    branchAddressMatchBusinessIds: new Set(branchAddressContext.keys()),
  };
}
