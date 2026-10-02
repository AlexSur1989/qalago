import type { AdServeItemDto } from './ads-types';

/** Insert inline CATEGORY_BOOST after this many organic cards (presentation-only). */
export const CATEGORY_BOOST_INSERT_AFTER_ORGANIC = 4;

export type CategoryAdsSplit = {
  topItems: AdServeItemDto[];
  boostItems: AdServeItemDto[];
};

export function splitCategoryServeAds(
  topItems: AdServeItemDto[],
  boostItemsRaw: AdServeItemDto[],
): CategoryAdsSplit {
  const topIds = collectBusinessIds(topItems);
  const boostOne = boostItemsRaw.slice(0, 1);
  const boostItems = boostOne.filter((item) => {
    const id = item.business?.id;
    return !id || !topIds.has(id);
  });
  return { topItems, boostItems };
}

function collectBusinessIds(items: AdServeItemDto[]): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    const id = item.business?.id;
    if (id) ids.add(id);
  }
  return ids;
}

export type CategoryFeedEntry<T extends { id: string }> =
  | { kind: 'organic'; business: T }
  | { kind: 'boost'; ad: AdServeItemDto };

/** Preserves organic order and count; inserts at most one BOOST card. */
export function composeCategoryOrganicListWithBoost<T extends { id: string }>(
  organicItems: readonly T[],
  boostItems: readonly AdServeItemDto[],
  topItems: readonly AdServeItemDto[] = [],
  insertAfterOrganic: number = CATEGORY_BOOST_INSERT_AFTER_ORGANIC,
): CategoryFeedEntry<T>[] {
  const organic = [...organicItems];
  const boost = boostItems[0];
  const topIds = collectBusinessIds([...topItems]);

  const entries: CategoryFeedEntry<T>[] = organic.map((business) => ({
    kind: 'organic',
    business,
  }));

  if (!organic.length) return entries;
  if (!boost) return entries;

  const boostId = boost.business?.id;
  if (boostId && topIds.has(boostId)) return entries;
  if (boostId && organic.some((b) => b.id === boostId)) return entries;

  const insertIndex = Math.min(Math.max(insertAfterOrganic, 0), entries.length);
  entries.splice(insertIndex, 0, { kind: 'boost', ad: boost });
  return entries;
}

/** 6.13M.6: organic API page is not reduced when ads are present. */
export function preserveCategoryOrganicPage<T>(organicItems: T[]): T[] {
  return organicItems;
}
