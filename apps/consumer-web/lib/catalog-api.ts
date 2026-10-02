import { parsePublicBusinessLocationsResponse } from './public-business-location';
import {
  buildBusinessBySlugRequestPath,
  parseBusinessCityMismatchBody,
} from './business-page-paths';
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
  centerLat?: number | null;
  centerLng?: number | null;
};

export async function fetchCities(): Promise<CityDto[]> {
  const res = await fetch(`${API_BASE}/cities`, {
    next: { revalidate: REVALIDATE_CITY_SECONDS },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<CityDto[]>;
}

export async function fetchCity(slug: string): Promise<CityDto | null> {
  const res = await fetch(`${API_BASE}/cities/${encodeURIComponent(slug)}`, {
    next: { revalidate: REVALIDATE_CITY_SECONDS },
  });
  if (res.status === 404) return null;
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

export type EffectivePhysicalDto = {
  locationId: string | null;
  isPrimary: boolean;
  cityId: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  workHours: Record<string, unknown> | null;
};

export type BusinessSubcategoryDto = {
  id: string;
  slug: string;
  nameRu: string;
  nameKk: string;
};

export type EffectiveMediaItemDto = {
  id: string;
  imageUrl: string;
  sortOrder: number;
  locationId: string | null;
  scope: 'brand' | 'branch';
};

export type EffectiveMediaDto = {
  activeLocationId: string | null;
  coverImageUrl: string | null;
  galleryPreview: { items: EffectiveMediaItemDto[]; totalCount: number };
};

export type EffectiveCatalogItemDto = {
  id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  sortOrder: number;
  sectionId?: string | null;
};

export type EffectiveCatalogDto = {
  activeLocationId: string | null;
  sections: { id: string; title: string; sortOrder: number }[];
  items: EffectiveCatalogItemDto[];
  totalCount: number;
};

export type EffectivePromotionItemDto = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  discountText?: string | null;
};

export type EffectivePromotionsDto = {
  activeLocationId: string | null;
  items: EffectivePromotionItemDto[];
  totalCount: number;
};

export type ReviewPreviewItemDto = {
  id: string;
  rating: number;
  text?: string | null;
  createdAt: string;
  ownerReply?: string | null;
  user?: { id: string; name: string | null };
};

export type BusinessSummaryDto = {
  id: string;
  title: string;
  slug: string;
  address: string;
  shortDesc?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  category?: { id: string; title: string; slug: string } | null;
  subcategories?: BusinessSubcategoryDto[];
  averageRating?: number | null;
  reviewCount?: number;
  /** Stage 6.12A.7.6 — optional branch context (additive). */
  activeLocationId?: string | null;
  /** Discovery navigation hint (A.7.9.1+) — open detail with ?locationId=. */
  contextLocationId?: string | null;
  /** Present when listing with latitude/longitude geo query. */
  distanceMeters?: number | null;
  effectivePhysical?: EffectivePhysicalDto;
  effectiveMedia?: EffectiveMediaDto;
  effectiveCatalog?: EffectiveCatalogDto;
  effectivePromotions?: EffectivePromotionsDto;
  reviewsPreview?: { items: ReviewPreviewItemDto[]; totalCount: number };
};

/** Public detail from F.4 slug endpoint or legacy ID detail (same shape). */
export type BusinessPublicDetailDto = BusinessSummaryDto;

/** Relative API path for detail fetch (tests + fetchBusiness). */
export function buildBusinessDetailRequestPath(
  id: string,
  locationId?: string | null,
): string {
  const path = `/businesses/${encodeURIComponent(id)}`;
  const trimmed = locationId?.trim();
  if (!trimmed) return path;
  const q = new URLSearchParams({ locationId: trimmed });
  return `${path}?${q.toString()}`;
}

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

export type FetchBusinessesParams = {
  citySlug?: string;
  categoryId?: string;
  subcategoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
};

export async function fetchBusinesses(
  params: FetchBusinessesParams,
): Promise<BusinessListResponse> {
  const q = new URLSearchParams({
    citySlug: params.citySlug ?? DEFAULT_CITY_SLUG,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });
  if (params.categoryId) q.set('categoryId', params.categoryId);
  if (params.subcategoryId) q.set('subcategoryId', params.subcategoryId);
  if (params.search) q.set('search', params.search);
  if (params.latitude != null && params.longitude != null) {
    q.set('latitude', String(params.latitude));
    q.set('longitude', String(params.longitude));
    if (params.radiusKm != null) q.set('radiusKm', String(params.radiusKm));
  }

  const geoQuery = params.latitude != null && params.longitude != null;
  const res = await fetch(`${API_BASE}/businesses?${q.toString()}`, {
    ...(geoQuery ? { cache: 'no-store' as const } : { next: { revalidate: REVALIDATE_BUSINESS_LIST_SECONDS } }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<BusinessListResponse>;
}

export async function fetchBusiness(
  id: string,
  locationId?: string | null,
): Promise<BusinessPublicDetailDto | null> {
  const res = await fetch(`${API_BASE}${buildBusinessDetailRequestPath(id, locationId)}`, {
    next: { revalidate: REVALIDATE_BUSINESS_DETAIL_SECONDS },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<BusinessPublicDetailDto>;
}

export type FetchBusinessBySlugResult =
  | { status: 'ok'; business: BusinessPublicDetailDto }
  | { status: 'not_found' }
  | {
      status: 'city_mismatch';
      payload: { businessSlug: string; locationId: string; citySlug: string };
    };

export async function fetchBusinessBySlug(input: {
  businessSlug: string;
  citySlug: string;
  locationId?: string | null;
}): Promise<FetchBusinessBySlugResult> {
  const path = buildBusinessBySlugRequestPath(
    input.businessSlug,
    input.citySlug,
    input.locationId,
  );
  const res = await fetch(`${API_BASE}${path}`, {
    next: { revalidate: REVALIDATE_BUSINESS_DETAIL_SECONDS },
  });
  if (res.status === 404) return { status: 'not_found' };
  if (res.status === 409) {
    const body = await res.json().catch(() => null);
    const payload = parseBusinessCityMismatchBody(body);
    if (payload) return { status: 'city_mismatch', payload };
    throw new Error('Unexpected city mismatch response');
  }
  if (!res.ok) throw new Error(await res.text());
  const business = (await res.json()) as BusinessPublicDetailDto;
  return { status: 'ok', business };
}

export async function fetchPublicBusinessLocations(businessId: string) {
  const res = await fetch(
    `${API_BASE}/businesses/${encodeURIComponent(businessId)}/locations/public`,
    { next: { revalidate: REVALIDATE_BUSINESS_DETAIL_SECONDS } },
  );
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(await res.text());
  const raw = await res.json();
  return parsePublicBusinessLocationsResponse(raw);
}
