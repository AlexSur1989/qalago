/**
 * Canonical public consumer-web origin (Stage 6.11F.3).
 * Distinct from business-web legal host in getPublicSiteBaseUrl().
 */
import {
  DEFAULT_PUBLIC_LOCALE,
  SUPPORTED_PUBLIC_LOCALES,
  type PublicLocale,
} from '../public-locale';

export function normalizeConsumerWebOrigin(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return 'http://localhost:3005';
  }
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
    throw new Error('Unsafe origin protocol');
  }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withScheme);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Unsafe origin protocol');
  }
  return `${url.protocol}//${url.host}`;
}

export function getConsumerWebOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_CONSUMER_WEB_URL ??
    'http://localhost:3005';
  return normalizeConsumerWebOrigin(raw);
}

function encodeSegment(segment: string): string {
  return encodeURIComponent(segment);
}

/** Build absolute locale-prefixed canonical URL from controlled segments (no open redirect). */
export function buildCanonicalUrl(options: {
  locale: PublicLocale;
  citySlug?: string;
  pathSegments?: string[];
  page?: number;
}): string {
  const origin = getConsumerWebOrigin();
  const parts: string[] = [encodeSegment(options.locale)];
  if (options.citySlug) {
    parts.push(encodeSegment(options.citySlug));
  }
  for (const seg of options.pathSegments ?? []) {
    parts.push(encodeSegment(seg));
  }
  const pathname = parts.length ? `/${parts.join('/')}` : '';
  const page = options.page ?? 1;
  const query = page > 1 ? `?page=${page}` : '';
  return `${origin}${pathname}${query}`;
}

export type IndexablePathOptions = {
  citySlug: string;
  pathSegments?: string[];
  page?: number;
};

/** F.5 Phase 2 — self-canonical + reciprocal hreflang for indexable discovery/business pages. */
export function buildIndexableLocaleSeoAlternates(
  pageLocale: PublicLocale,
  options: IndexablePathOptions,
): { canonical: string; languages: Record<string, string> } {
  const ru = buildCanonicalUrl({ locale: 'ru', ...options });
  const kk = buildCanonicalUrl({ locale: 'kk', ...options });
  const canonical = buildCanonicalUrl({ locale: pageLocale, ...options });
  return {
    canonical,
    languages: {
      ru,
      kk,
      'x-default': ru,
    },
  };
}

export function canonicalForCity(locale: PublicLocale, citySlug: string): string {
  return buildCanonicalUrl({ locale, citySlug });
}

export function canonicalForCityCategories(locale: PublicLocale, citySlug: string): string {
  return buildCanonicalUrl({ locale, citySlug, pathSegments: ['categories'] });
}

export function canonicalForCategory(
  locale: PublicLocale,
  citySlug: string,
  categorySlug: string,
  page?: number,
): string {
  return buildCanonicalUrl({ locale, citySlug, pathSegments: [categorySlug], page });
}

export function canonicalForSubcategory(
  locale: PublicLocale,
  citySlug: string,
  categorySlug: string,
  subcategorySlug: string,
  page?: number,
): string {
  return buildCanonicalUrl({
    locale,
    citySlug,
    pathSegments: [categorySlug, subcategorySlug],
    page,
  });
}

/** Search — locale-prefixed; page remains noindex (F.3/F.5). */
export function canonicalForSearch(
  locale: PublicLocale,
  citySlug: string,
  query: string,
): string {
  const origin = getConsumerWebOrigin();
  const base = `${origin}/${encodeSegment(locale)}/${encodeSegment(citySlug)}/search`;
  if (!query.trim()) return base;
  return `${base}?q=${encodeURIComponent(query.trim())}`;
}

/** F.4 indexable business page — never includes ?locationId=. */
export function canonicalForBusiness(
  locale: PublicLocale,
  citySlug: string,
  businessSlug: string,
): string {
  return buildCanonicalUrl({
    locale,
    citySlug,
    pathSegments: ['business', businessSlug],
  });
}

/** Emit both /ru/ and /kk/ sitemap URLs for one logical indexable path. */
export function localizedIndexableSitemapUrls(options: IndexablePathOptions): string[] {
  return SUPPORTED_PUBLIC_LOCALES.map((locale) => buildCanonicalUrl({ locale, ...options }));
}

export { DEFAULT_PUBLIC_LOCALE, SUPPORTED_PUBLIC_LOCALES };
