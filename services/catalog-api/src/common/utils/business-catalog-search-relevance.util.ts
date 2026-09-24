import { catalogSearchNeedle } from './catalog-search-query.util';

/** Lower number = higher relevance. Organic only — no plan/ad signals. */
export enum BusinessCatalogSearchRelevanceTier {
  EXACT_TITLE = 1,
  TITLE_PREFIX = 2,
  TITLE_CONTAINS = 3,
  TAXONOMY = 4,
  SERVICE_TITLE = 5,
  DESCRIPTION = 6,
}

export type ServiceSearchMatchKind = 'service_title' | 'service_description';

export type BusinessSearchRelevanceRow = {
  id: string;
  title: string;
  shortDesc?: string | null;
  address?: string | null;
  category?: {
    title: string;
    nameRu?: string;
    nameKk?: string;
  } | null;
  businessSubcategories?: { subcategory: { nameRu: string; nameKk: string } }[];
  serviceMatchKind?: ServiceSearchMatchKind | null;
  branchAddressMatch?: boolean;
};

function fieldContains(value: string | null | undefined, needle: string): boolean {
  return value != null && value.toLocaleLowerCase().includes(needle);
}

function taxonomyFieldsMatch(
  fields: { title?: string; nameRu?: string; nameKk?: string },
  needle: string,
): boolean {
  return (
    fieldContains(fields.title, needle) ||
    fieldContains(fields.nameRu, needle) ||
    fieldContains(fields.nameKk, needle)
  );
}

export function computeBusinessSearchRelevanceTier(
  business: BusinessSearchRelevanceRow,
  rawQuery: string,
): BusinessCatalogSearchRelevanceTier {
  const needle = catalogSearchNeedle(rawQuery);
  if (!needle) {
    return BusinessCatalogSearchRelevanceTier.DESCRIPTION;
  }

  const titleLower = (business.title ?? '').toLocaleLowerCase();
  if (titleLower === needle) {
    return BusinessCatalogSearchRelevanceTier.EXACT_TITLE;
  }
  if (titleLower.startsWith(needle)) {
    return BusinessCatalogSearchRelevanceTier.TITLE_PREFIX;
  }
  if (titleLower.includes(needle)) {
    return BusinessCatalogSearchRelevanceTier.TITLE_CONTAINS;
  }

  if (business.category && taxonomyFieldsMatch(business.category, needle)) {
    return BusinessCatalogSearchRelevanceTier.TAXONOMY;
  }
  for (const link of business.businessSubcategories ?? []) {
    if (taxonomyFieldsMatch(link.subcategory, needle)) {
      return BusinessCatalogSearchRelevanceTier.TAXONOMY;
    }
  }

  if (business.serviceMatchKind === 'service_title') {
    return BusinessCatalogSearchRelevanceTier.SERVICE_TITLE;
  }
  if (business.serviceMatchKind === 'service_description') {
    return BusinessCatalogSearchRelevanceTier.DESCRIPTION;
  }

  if (fieldContains(business.shortDesc, needle) || business.branchAddressMatch) {
    return BusinessCatalogSearchRelevanceTier.DESCRIPTION;
  }

  return BusinessCatalogSearchRelevanceTier.DESCRIPTION;
}

export function compareBusinessBySearchRelevance(
  a: BusinessSearchRelevanceRow,
  b: BusinessSearchRelevanceRow,
  rawQuery: string,
): number {
  const tierA = computeBusinessSearchRelevanceTier(a, rawQuery);
  const tierB = computeBusinessSearchRelevanceTier(b, rawQuery);
  if (tierA !== tierB) {
    return tierA - tierB;
  }
  const byTitle = (a.title ?? '').localeCompare(b.title ?? '', 'ru');
  if (byTitle !== 0) {
    return byTitle;
  }
  return a.id.localeCompare(b.id);
}
