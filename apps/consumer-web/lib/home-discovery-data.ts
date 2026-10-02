import { HomeSectionType } from '@qalago/shared-types';
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

export async function loadHomeDiscoveryPageData(citySlug: string): Promise<HomeDiscoveryPageData> {
  const layout = await resolveHomeSectionLayout(citySlug);

  const needsCategories = layoutIncludes(HomeSectionType.CATEGORIES, layout);
  const needsPromotions = layoutIncludes(HomeSectionType.HOME_PROMOTIONS, layout);

  const [categories, promotions] = await Promise.all([
    needsCategories ? loadCategories(citySlug) : ({ status: 'idle' } as const),
    needsPromotions ? loadPromotions(citySlug) : ({ status: 'idle' } as const),
  ]);

  return { layout, categories, promotions };
}
