import {
  REVALIDATE_BUSINESS_DETAIL_SECONDS,
  REVALIDATE_BUSINESS_LIST_SECONDS,
  REVALIDATE_CATEGORIES_SECONDS,
  REVALIDATE_CITY_SECONDS,
} from './cache-policy';
import { DEFAULT_CITY_SLUG, getApiBaseUrl } from './public-config';

const API_BASE = getApiBaseUrl();

export type CityDto = {
  id: string;
  slug: string;
  nameRu: string;
  nameKk?: string | null;
};

export async function fetchCity(slug: string): Promise<CityDto> {
  const res = await fetch(`${API_BASE}/cities/${encodeURIComponent(slug)}`, {
    next: { revalidate: REVALIDATE_CITY_SECONDS },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<CityDto>;
}

export type CategoryDto = {
  id: string;
  title: string;
  nameRu: string;
  nameKk: string;
  slug: string;
  icon?: string | null;
  iconUrl?: string | null;
  sortOrder: number;
};

export type BusinessSummaryDto = {
  id: string;
  title: string;
  slug: string;
  address: string;
  shortDesc?: string | null;
  coverImageUrl?: string | null;
  category?: { id: string; title: string; slug: string } | null;
};

export type SubcategoryDto = {
  id: string;
  categoryId: string;
  slug: string;
  nameRu: string;
  nameKk: string;
  icon?: string | null;
  iconUrl?: string | null;
  sortOrder: number;
};

export async function fetchCategories(citySlug = DEFAULT_CITY_SLUG): Promise<CategoryDto[]> {
  const res = await fetch(`${API_BASE}/categories?citySlug=${encodeURIComponent(citySlug)}`, {
    next: { revalidate: REVALIDATE_CATEGORIES_SECONDS },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<CategoryDto[]>;
}

export async function fetchSubcategories(categoryId: string): Promise<SubcategoryDto[]> {
  const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(categoryId)}/subcategories`, {
    next: { revalidate: REVALIDATE_CATEGORIES_SECONDS },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<SubcategoryDto[]>;
}

export type BusinessListResponse = {
  items: BusinessSummaryDto[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchBusinesses(params: {
  citySlug?: string;
  categoryId: string;
  subcategoryId?: string;
  limit?: number;
}): Promise<BusinessListResponse> {
  const q = new URLSearchParams({
    citySlug: params.citySlug ?? DEFAULT_CITY_SLUG,
    categoryId: params.categoryId,
    limit: String(params.limit ?? 50),
    page: '1',
  });
  if (params.subcategoryId) q.set('subcategoryId', params.subcategoryId);
  const res = await fetch(`${API_BASE}/businesses?${q.toString()}`, {
    next: { revalidate: REVALIDATE_BUSINESS_LIST_SECONDS },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<BusinessListResponse>;
}

export async function fetchBusiness(id: string): Promise<BusinessSummaryDto> {
  const res = await fetch(`${API_BASE}/businesses/${encodeURIComponent(id)}`, {
    next: { revalidate: REVALIDATE_BUSINESS_DETAIL_SECONDS },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<BusinessSummaryDto>;
}
