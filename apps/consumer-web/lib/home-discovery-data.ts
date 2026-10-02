import { HomeSectionType } from '@qalago/shared-types';
import { AD_PLACEMENT } from './ad-placements';
import { fetchAdServe } from './ads-api';
import type { AdServeItemDto } from './ads-types';
import type { CategoryDto } from './catalog-api';
import { cachedFetchCategories } from './catalog-cache';
import {
  layoutIncludes,
  resolveHomeSectionLayout,
  type HomeSectionLayoutResult,
} from './home-section-layout';
import type { CityPromotionPreviewDto } from './promotions-api';
import { fetchCityPromotionsPreview } from './promotions-api';

export type HomeSectionDataSlice<T> =
  | { status: 'idle' }
  | { status: 'ready'; data: T }
  | { status: 'error' };

export type HomeDiscoveryPageData = {
  layout: HomeSectionLayoutResult;
  categories: HomeSectionDataSlice<CategoryDto[]>;
  promotions: HomeSectionDataSlice<CityPromotionPreviewDto[]>;
  vipBanner: HomeSectionDataSlice<AdServeItemDto[]>;
  featured: HomeSectionDataSlice<AdServeItemDto[]>;
  promotionsPaid: HomeSectionDataSlice<AdServeItemDto[]>;
  webSessionId: string;
};

async function loadCategories(citySlug: string): Promise<HomeSectionDataSlice<CategoryDto[]>> {
  try {
    const data = await cachedFetchCategories(citySlug);
    return { status: 'ready', data };
  } catch {
    return { status: 'error' };
  }
}

async function loadPromotions(citySlug: string): Promise<HomeSectionDataSlice<CityPromotionPreviewDto[]>> {
  try {
    const res = await fetchCityPromotionsPreview(citySlug, 6);
    return { status: 'ready', data: res.items ?? [] };
  } catch {
    return { status: 'error' };
  }
}

async function loadAdPlacement(
  enabled: boolean,
  placementCode: string,
  citySlug: string,
  sessionId: string,
): Promise<HomeSectionDataSlice<AdServeItemDto[]>> {
  if (!enabled) return { status: 'idle' };
  try {
    const items = await fetchAdServe({
      placementCode,
      citySlug,
      sessionId,
    });
    return { status: 'ready', data: items };
  } catch {
    return { status: 'error' };
  }
}

export async function loadHomeDiscoveryPageData(
  citySlug: string,
  webSessionId: string,
): Promise<HomeDiscoveryPageData> {
  const layout = await resolveHomeSectionLayout(citySlug);

  const needsCategories = layoutIncludes(HomeSectionType.CATEGORIES, layout);
  const needsPromotions = layoutIncludes(HomeSectionType.HOME_PROMOTIONS, layout);
  const needsVip = layoutIncludes(HomeSectionType.HOME_VIP_BANNER, layout);
  const needsFeatured = layoutIncludes(HomeSectionType.HOME_FEATURED, layout);

  const [categories, promotions, vipBanner, featured, promotionsPaid] = await Promise.all([
    needsCategories ? loadCategories(citySlug) : ({ status: 'idle' } as const),
    needsPromotions ? loadPromotions(citySlug) : ({ status: 'idle' } as const),
    loadAdPlacement(needsVip, AD_PLACEMENT.HOME_VIP_BANNER, citySlug, webSessionId),
    loadAdPlacement(needsFeatured, AD_PLACEMENT.HOME_FEATURED, citySlug, webSessionId),
    loadAdPlacement(
      needsPromotions,
      AD_PLACEMENT.HOME_PROMOTIONS,
      citySlug,
      webSessionId,
    ),
  ]);

  return {
    layout,
    categories,
    promotions,
    vipBanner,
    featured,
    promotionsPaid,
    webSessionId,
  };
}
