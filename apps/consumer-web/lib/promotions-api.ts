import { REVALIDATE_BUSINESS_LIST_SECONDS } from './cache-policy';
import { getApiBaseUrl } from './public-config';

const API_BASE = getApiBaseUrl();

export type CityPromotionPreviewDto = {
  id: string;
  title: string;
  description?: string | null;
  discountText?: string | null;
  imageUrl?: string | null;
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

export async function fetchCityPromotionsPreview(
  citySlug: string,
  limit = 6,
): Promise<CityPromotionsListResponse> {
  const q = new URLSearchParams({
    citySlug,
    limit: String(limit),
    page: '1',
    activeNow: 'true',
  });
  const res = await fetch(`${API_BASE}/promotions?${q.toString()}`, {
    next: { revalidate: REVALIDATE_BUSINESS_LIST_SECONDS },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<CityPromotionsListResponse>;
}
