const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

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

export async function fetchCategories(citySlug = 'uralsk'): Promise<CategoryDto[]> {
  const res = await fetch(`${API_BASE}/categories?citySlug=${encodeURIComponent(citySlug)}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<CategoryDto[]>;
}

export async function fetchSubcategories(categoryId: string): Promise<SubcategoryDto[]> {
  const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(categoryId)}/subcategories`, {
    next: { revalidate: 60 },
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
    citySlug: params.citySlug ?? 'uralsk',
    categoryId: params.categoryId,
    limit: String(params.limit ?? 50),
    page: '1',
  });
  if (params.subcategoryId) q.set('subcategoryId', params.subcategoryId);
  const res = await fetch(`${API_BASE}/businesses?${q.toString()}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<BusinessListResponse>;
}

export async function fetchBusiness(id: string): Promise<BusinessSummaryDto> {
  const res = await fetch(`${API_BASE}/businesses/${encodeURIComponent(id)}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<BusinessSummaryDto>;
}
