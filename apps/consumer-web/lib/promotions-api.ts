import { REVALIDATE_BUSINESS_LIST_SECONDS } from './cache-policy';
import {
  CITY_PROMOTIONS_PAGE_LIMIT,
  HOME_PROMOTIONS_PREVIEW_LIMIT,
} from './promotions-page';
import { getApiBaseUrl } from './public-config';

const API_BASE = getApiBaseUrl();

export type CityPromotionPreviewDto = {
  id: string;
  title: string;
  description?: string | null;
  discountText?: string | null;
  imageUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  contextLocationId?: string | null;
  business: {
    id: string;
    title: string;
    slug: string;
    coverImageUrl?: string | null;
  };
};

export type CityPromotionsListResponse = {
  items: CityPromotionPreviewDto[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
};

export async function fetchCityPromotions(
  citySlug: string,
  options?: { page?: number; limit?: number },
): Promise<CityPromotionsListResponse> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? CITY_PROMOTIONS_PAGE_LIMIT;
  const q = new URLSearchParams({
    citySlug,
    limit: String(limit),
    page: String(page),
    activeNow: 'true',
  });
  const res = await fetch(`${API_BASE}/promotions?${q.toString()}`, {
    next: { revalidate: REVALIDATE_BUSINESS_LIST_SECONDS },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<CityPromotionsListResponse>;
}

export async function fetchCityPromotionsPreview(
  citySlug: string,
  limit = HOME_PROMOTIONS_PREVIEW_LIMIT,
): Promise<CityPromotionsListResponse> {
  return fetchCityPromotions(citySlug, { page: 1, limit });
}
