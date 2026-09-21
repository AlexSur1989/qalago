import { DEFAULT_CITY_SLUG } from './public-config';

export function cityHomePath(citySlug: string): string {
  return `/${encodeURIComponent(citySlug)}`;
}

export function cityCategoriesPath(citySlug: string): string {
  return `/${encodeURIComponent(citySlug)}/categories`;
}

export function cityCategoryPath(citySlug: string, categorySlug: string): string {
  return `/${encodeURIComponent(citySlug)}/${encodeURIComponent(categorySlug)}`;
}

export function citySubcategoryPath(
  citySlug: string,
  categorySlug: string,
  subcategorySlug: string,
): string {
  return `/${encodeURIComponent(citySlug)}/${encodeURIComponent(categorySlug)}/${encodeURIComponent(subcategorySlug)}`;
}

export function citySearchPath(citySlug: string, query?: string): string {
  const base = `/${encodeURIComponent(citySlug)}/search`;
  if (!query?.trim()) return base;
  return `${base}?q=${encodeURIComponent(query.trim())}`;
}

/** Extract city slug from pathname like /uralsk/categories → uralsk */
export function parseCitySlugFromPathname(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (!parts.length) return null;
  const first = parts[0]!;
  if (first === 'businesses' || first === 'categories') return null;
  return first;
}

export function defaultCityHomePath(): string {
  return cityHomePath(DEFAULT_CITY_SLUG);
}
