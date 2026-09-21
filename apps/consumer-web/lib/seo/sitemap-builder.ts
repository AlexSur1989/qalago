import type { CategoryDto, CityDto, SubcategoryDto } from '@/lib/catalog-api';
import {
  canonicalForCategory,
  canonicalForCity,
  canonicalForCityCategories,
  canonicalForSubcategory,
} from './canonical';

export type SitemapEntry = { url: string; lastModified?: Date };

export function buildDiscoverySitemapEntries(input: {
  cities: CityDto[];
  categoriesByCitySlug: Record<string, CategoryDto[]>;
  subcategoriesByCategoryId: Record<string, SubcategoryDto[]>;
}): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const seen = new Set<string>();

  function add(url: string) {
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({ url });
  }

  for (const city of input.cities) {
    add(canonicalForCity(city.slug));
    add(canonicalForCityCategories(city.slug));
    const categories = input.categoriesByCitySlug[city.slug] ?? [];
    for (const cat of categories) {
      add(canonicalForCategory(city.slug, cat.slug));
      const subs = input.subcategoriesByCategoryId[cat.id] ?? [];
      for (const sub of subs) {
        add(canonicalForSubcategory(city.slug, cat.slug, sub.slug));
      }
    }
  }

  return entries;
}
