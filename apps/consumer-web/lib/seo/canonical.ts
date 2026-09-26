/**
 * Canonical public consumer-web origin (Stage 6.11F.3).
 * Distinct from business-web legal host in getPublicSiteBaseUrl().
 */
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

/** Build absolute canonical URL from controlled path segments (no open redirect). */
export function buildCanonicalUrl(options: {
  citySlug?: string;
  pathSegments?: string[];
  page?: number;
}): string {
  const origin = getConsumerWebOrigin();
  const parts: string[] = [];
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

export function canonicalForCity(citySlug: string): string {
  return buildCanonicalUrl({ citySlug });
}

export function canonicalForCityCategories(citySlug: string): string {
  return buildCanonicalUrl({ citySlug, pathSegments: ['categories'] });
}

export function canonicalForCategory(
  citySlug: string,
  categorySlug: string,
  page?: number,
): string {
  return buildCanonicalUrl({ citySlug, pathSegments: [categorySlug], page });
}

export function canonicalForSubcategory(
  citySlug: string,
  categorySlug: string,
  subcategorySlug: string,
  page?: number,
): string {
  return buildCanonicalUrl({
    citySlug,
    pathSegments: [categorySlug, subcategorySlug],
    page,
  });
}

export function canonicalForSearch(citySlug: string, query: string): string {
  const origin = getConsumerWebOrigin();
  const base = `${origin}/${encodeSegment(citySlug)}/search`;
  if (!query.trim()) return base;
  return `${base}?q=${encodeURIComponent(query.trim())}`;
}

/** F.4 indexable business page — never includes ?locationId=. */
export function canonicalForBusiness(citySlug: string, businessSlug: string): string {
  return buildCanonicalUrl({
    citySlug,
    pathSegments: ['business', businessSlug],
  });
}
