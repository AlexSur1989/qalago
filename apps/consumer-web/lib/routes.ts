import { DEFAULT_CITY_SLUG } from './public-config';
import { isSupportedPublicLocale, type PublicLocale } from './public-locale';

/** Prefix locale-neutral logical path (`/uralsk/...`) with `/ru` or `/kk`. */
export function withPublicLocalePrefix(locale: PublicLocale, logicalPath: string): string {
  const trimmed = logicalPath.startsWith('/') ? logicalPath : `/${logicalPath}`;
  if (trimmed === '/') {
    return `/${locale}`;
  }
  return `/${locale}${trimmed}`;
}

export function cityHomePath(locale: PublicLocale, citySlug: string): string {
  return withPublicLocalePrefix(locale, `/${encodeURIComponent(citySlug)}`);
}

export function cityCategoriesPath(locale: PublicLocale, citySlug: string): string {
  return withPublicLocalePrefix(locale, `/${encodeURIComponent(citySlug)}/categories`);
}

export function cityCategoryPath(
  locale: PublicLocale,
  citySlug: string,
  categorySlug: string,
): string {
  return withPublicLocalePrefix(
    locale,
    `/${encodeURIComponent(citySlug)}/${encodeURIComponent(categorySlug)}`,
  );
}

export function citySubcategoryPath(
  locale: PublicLocale,
  citySlug: string,
  categorySlug: string,
  subcategorySlug: string,
): string {
  return withPublicLocalePrefix(
    locale,
    `/${encodeURIComponent(citySlug)}/${encodeURIComponent(categorySlug)}/${encodeURIComponent(subcategorySlug)}`,
  );
}

export function citySearchPath(locale: PublicLocale, citySlug: string, query?: string): string {
  const base = withPublicLocalePrefix(locale, `/${encodeURIComponent(citySlug)}/search`);
  if (!query?.trim()) return base;
  return `${base}?q=${encodeURIComponent(query.trim())}`;
}

/** Extract city slug from pathname like /ru/uralsk/categories → uralsk */
export function parseCitySlugFromPathname(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (!parts.length) return null;
  if (isSupportedPublicLocale(parts[0]!)) {
    return parts[1] ?? null;
  }
  const first = parts[0]!;
  if (first === 'businesses' || first === 'categories') return null;
  return first;
}

export function defaultCityHomePath(locale: PublicLocale): string {
  return cityHomePath(locale, DEFAULT_CITY_SLUG);
}
