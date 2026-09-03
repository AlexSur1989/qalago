import type { CatalogBusiness } from '@qalago/ai-core';

const baseUrl = process.env.CATALOG_API_URL ?? 'http://localhost:3002/api/v1';

async function fetchJson<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, { headers });
  if (!res.ok) {
    throw new Error(`Catalog API ${path}: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchPersonalRecommendations(
  citySlug: string,
  token: string,
): Promise<CatalogBusiness[]> {
  const params = new URLSearchParams({ citySlug });
  return fetchJson<CatalogBusiness[]>(`/businesses/recommended/me?${params}`, token);
}

export async function fetchFeaturedFallback(
  citySlug: string,
  limit = 10,
): Promise<CatalogBusiness[]> {
  const params = new URLSearchParams({
    citySlug,
    featured: 'true',
    limit: String(limit),
  });
  const data = await fetchJson<{ items: CatalogBusiness[] }>(`/businesses?${params}`);
  return data.items ?? [];
}

export async function fetchCity(citySlug: string): Promise<{ slug: string; nameRu: string }> {
  return fetchJson<{ slug: string; nameRu: string }>(`/cities/${citySlug}`);
}
