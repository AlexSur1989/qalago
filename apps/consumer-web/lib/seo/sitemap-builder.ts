import type { CategoryDto, CityDto, SubcategoryDto } from '@/lib/catalog-api';
import { PUBLIC_LEGAL_ROOT_SEGMENTS } from '@/lib/legal-paths';
import {
  canonicalForHelpPage,
  canonicalForLegalPage,
  localizedIndexableSitemapUrls,
} from './canonical';

export type SitemapEntry = { url: string; lastModified?: Date };

export function buildDiscoverySitemapEntries(input: {
  cities: CityDto[];
  categoriesByCitySlug: Record<string, CategoryDto[]>;
  subcategoriesByCategoryId: Record<string, SubcategoryDto[]>;
  businessUrlsByCitySlug?: Record<string, string[]>;
}): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const seen = new Set<string>();

  function add(url: string) {
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({ url });
  }

  function addLocalized(citySlug: string, pathSegments?: string[]) {
    for (const url of localizedIndexableSitemapUrls({ citySlug, pathSegments })) {
      add(url);
    }
  }

  for (const city of input.cities) {
    addLocalized(city.slug);
    addLocalized(city.slug, ['categories']);
    const categories = input.categoriesByCitySlug[city.slug] ?? [];
    for (const cat of categories) {
      addLocalized(city.slug, [cat.slug]);
      const subs = input.subcategoriesByCategoryId[cat.id] ?? [];
      for (const sub of subs) {
        addLocalized(city.slug, [cat.slug, sub.slug]);
      }
    }
    const businessUrls = input.businessUrlsByCitySlug?.[city.slug] ?? [];
    for (const url of businessUrls) {
      add(url);
    }
  }

  return entries;
}

/** F.7 — one locale-neutral URL per legal document (no /ru|kk/ duplicates). */
export function buildLegalSitemapEntries(): SitemapEntry[] {
  return PUBLIC_LEGAL_ROOT_SEGMENTS.map((segment) => ({
    url: canonicalForLegalPage(segment),
  }));
}

/** Public help — single locale-neutral /help entry. */
export function buildHelpSitemapEntry(): SitemapEntry {
  return { url: canonicalForHelpPage() };
}

export function buildLocaleNeutralPublicSitemapEntries(): SitemapEntry[] {
  return [...buildLegalSitemapEntries(), buildHelpSitemapEntry()];
}

export function mergeDiscoveryAndLegalSitemapEntries(
  discovery: SitemapEntry[],
  legal: SitemapEntry[] = buildLocaleNeutralPublicSitemapEntries(),
): SitemapEntry[] {
  const seen = new Set<string>();
  const merged: SitemapEntry[] = [];
  for (const entry of [...discovery, ...legal]) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    merged.push(entry);
  }
  return merged;
}
