import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BusinessList } from '@/components/BusinessList';
import { PaginationLinks } from '@/components/PaginationLinks';
import {
  findCategoryBySlug,
  findSubcategoryBySlug,
} from '@/lib/category-resolve';
import { requireCityCategories } from '@/lib/city-page-data';
import { fetchBusinesses, fetchSubcategories } from '@/lib/catalog-api';
import { parsePageParam } from '@/lib/search-query';
import {
  UI_LABELS,
  categoryDisplayName,
  subcategoryDisplayName,
} from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';
import { toPublicBusinessCard } from '@/lib/public-business';
import { cityCategoryPath, citySubcategoryPath } from '@/lib/routes';

export default async function CitySubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ citySlug: string; categorySlug: string; subcategorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { citySlug, categorySlug, subcategorySlug } = await params;
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];

  const { city, categories } = await requireCityCategories(citySlug);
  const category = findCategoryBySlug(categories, categorySlug);
  if (!category) notFound();

  const subs = await fetchSubcategories(category.id);
  const sub = findSubcategoryBySlug(subs, subcategorySlug, category.id);
  if (!sub) notFound();

  const businesses = await fetchBusinesses({
    citySlug: city.slug,
    categoryId: category.id,
    subcategoryId: sub.id,
    page,
    limit: 20,
  });

  const totalPages = Math.max(1, Math.ceil(businesses.total / businesses.limit) || 1);
  const safePage = Math.min(page, totalPages);
  const items =
    safePage === page
      ? businesses.items
      : (
          await fetchBusinesses({
            citySlug: city.slug,
            categoryId: category.id,
            subcategoryId: sub.id,
            page: safePage,
            limit: 20,
          })
        ).items;

  const publicItems = items.map((b) => toPublicBusinessCard(b));

  return (
    <main className="page">
      <Link href={cityCategoryPath(city.slug, category.slug)} className="page-back">
        {labels.back}
      </Link>
      <h1 className="page-title">{subcategoryDisplayName(sub, locale)}</h1>
      <p style={{ color: 'var(--muted)' }}>{categoryDisplayName(category, locale)}</p>
      <h2 style={{ marginTop: 28 }}>{labels.businesses}</h2>
      <BusinessList items={publicItems} locale={locale} />
      <PaginationLinks
        basePath={citySubcategoryPath(city.slug, category.slug, sub.slug)}
        page={safePage}
        totalPages={totalPages}
        labels={labels}
      />
    </main>
  );
}
