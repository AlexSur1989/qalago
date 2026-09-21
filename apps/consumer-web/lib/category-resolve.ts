import type { CategoryDto, SubcategoryDto } from './catalog-api';
import { isReservedCitySegment } from './reserved-segments';

export function findCategoryBySlug(
  categories: CategoryDto[],
  categorySlug: string,
): CategoryDto | undefined {
  if (isReservedCitySegment(categorySlug)) return undefined;
  const normalized = categorySlug.toLowerCase();
  return categories.find((c) => c.slug.toLowerCase() === normalized);
}

export function findCategoryById(
  categories: CategoryDto[],
  categoryId: string,
): CategoryDto | undefined {
  return categories.find((c) => c.id === categoryId);
}

export function findSubcategoryBySlug(
  subs: SubcategoryDto[],
  subcategorySlug: string,
  categoryId: string,
): SubcategoryDto | undefined {
  const normalized = subcategorySlug.toLowerCase();
  return subs.find(
    (s) => s.categoryId === categoryId && s.slug.toLowerCase() === normalized,
  );
}
