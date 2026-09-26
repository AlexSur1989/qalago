import { fetchBusinesses, type BusinessSummaryDto } from './catalog-api';
import { canonicalForBusiness } from './seo/canonical';

const PAGE_LIMIT = 50;

export async function fetchAllPublicBusinessesInCity(citySlug: string): Promise<BusinessSummaryDto[]> {
  const items: BusinessSummaryDto[] = [];
  let page = 1;
  let total = Infinity;

  while (items.length < total) {
    const res = await fetchBusinesses({ citySlug, page, limit: PAGE_LIMIT });
    items.push(...res.items);
    total = res.total;
    if (!res.items.length) break;
    page += 1;
  }

  return items;
}

/** One sitemap URL per (citySlug, businessSlug) — dedupe multi-branch same city. */
export function dedupeBusinessCitySitemapUrls(
  citySlug: string,
  businesses: { slug: string }[],
): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const b of businesses) {
    const slug = b.slug?.trim();
    if (!slug) continue;
    const key = `${citySlug}:${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    urls.push(canonicalForBusiness(citySlug, slug));
  }
  return urls;
}
