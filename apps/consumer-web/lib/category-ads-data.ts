import { AD_PLACEMENT } from './ad-placements';
import { fetchAdServe } from './ads-api';
import type { AdServeItemDto } from './ads-types';
import {
  categoryAllPlacesAfterSponsored,
  collectPaidBusinessIds,
  filterOrganicByPaidIds,
} from './ads-dedupe';

export type CategoryAdsBundle = {
  sponsoredItems: AdServeItemDto[];
};

export async function loadCategoryAds(
  citySlug: string,
  categoryId: string,
  sessionId: string,
): Promise<CategoryAdsBundle> {
  const [topItems, boostItems] = await Promise.all([
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
    }),
  ]);
  const sponsoredItems = [...topItems, ...boostItems];
  return { sponsoredItems };
}

export function applyCategoryOrganicDedupe<T extends { id: string }>(
  organicItems: T[],
  sponsoredItems: AdServeItemDto[],
): T[] {
  const paidIds = collectPaidBusinessIds(sponsoredItems);
  const withoutPaidDupes = filterOrganicByPaidIds(organicItems, paidIds);
  const sponsoredIds = sponsoredItems
    .map((ad) => ad.business?.id)
    .filter((id): id is string => Boolean(id));
  return categoryAllPlacesAfterSponsored(withoutPaidDupes, sponsoredIds);
}
