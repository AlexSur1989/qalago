import type { CategoryDto, CityDto, SubcategoryDto } from '@/lib/catalog-api';
import {
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
