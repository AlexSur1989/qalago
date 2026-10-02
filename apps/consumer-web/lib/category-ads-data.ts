import { AD_PLACEMENT } from './ad-placements';
import { fetchAdServe } from './ads-api';
import type { AdServeItemDto } from './ads-types';
import { splitCategoryServeAds, preserveCategoryOrganicPage } from './category-feed-compose';

export type CategoryAdsBundle = {
  topItems: AdServeItemDto[];
  boostItems: AdServeItemDto[];
};

export async function loadCategoryAds(
  citySlug: string,
  categoryId: string,
  sessionId: string,
): Promise<CategoryAdsBundle> {
  const [topRaw, boostRaw] = await Promise.all([
    fetchAdServe({
      placementCode: AD_PLACEMENT.CATEGORY_TOP,
      citySlug,
      sessionId,
      categoryId,
    }),
    fetchAdServe({
      placementCode: AD_PLACEMENT.CATEGORY_BOOST,
      citySlug,
      sessionId,
      categoryId,
      limit: 1,
    }),
  ]);
  return splitCategoryServeAds(topRaw, boostRaw);
}

/** @deprecated 6.13M.6 — organic page size is preserved; use composeCategoryOrganicListWithBoost. */
export function applyCategoryOrganicDedupe<T extends { id: string }>(
  organicItems: T[],
  _sponsoredItems: AdServeItemDto[],
): T[] {
  return preserveCategoryOrganicPage(organicItems);
}
