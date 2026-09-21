import { notFound, permanentRedirect } from 'next/navigation';
import { fetchCategories } from '@/lib/catalog-api';
import { findCategoryById } from '@/lib/category-resolve';
import { DEFAULT_CITY_SLUG } from '@/lib/public-config';
import { cityCategoryPath } from '@/lib/routes';

export default async function LegacyCategoryByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categories = await fetchCategories(DEFAULT_CITY_SLUG);
  const category = findCategoryById(categories, id);
  if (!category) notFound();
  permanentRedirect(cityCategoryPath(DEFAULT_CITY_SLUG, category.slug));
}
