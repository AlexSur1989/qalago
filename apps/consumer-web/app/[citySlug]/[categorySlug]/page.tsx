import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryIconTile } from '@/components/CategoryIconTile';
import { BusinessList } from '@/components/BusinessList';
import { PaginationLinks } from '@/components/PaginationLinks';
import { findCategoryBySlug } from '@/lib/category-resolve';
import { requireCityCategories } from '@/lib/city-page-data';
import {
  fetchBusinesses,
  fetchSubcategories,
} from '@/lib/catalog-api';
import { parsePageParam } from '@/lib/search-query';
import {
  UI_LABELS,
  categoryDisplayName,
  subcategoryDisplayName,
} from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';
import { toPublicBusinessCard } from '@/lib/public-business';
import {
  cityCategoriesPath,
  cityCategoryPath,
  citySubcategoryPath,
} from '@/lib/routes';

export default async function CityCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ citySlug: string; categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { citySlug, categorySlug } = await params;
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];

  const { city, categories } = await requireCityCategories(citySlug);
  const category = findCategoryBySlug(categories, categorySlug);
  if (!category) notFound();

  const [subs, businesses] = await Promise.all([
    fetchSubcategories(category.id),
    fetchBusinesses({
      citySlug: city.slug,
      categoryId: category.id,
      page,
      limit: 20,
    }),
  ]);

  const catTitle = categoryDisplayName(category, locale);
  const totalPages = Math.max(1, Math.ceil(businesses.total / businesses.limit) || 1);
  const safePage = Math.min(page, totalPages);
  const items =
    safePage === page
      ? businesses.items
      : (
          await fetchBusinesses({
            citySlug: city.slug,
            categoryId: category.id,
            page: safePage,
            limit: 20,
          })
        ).items;

  const publicItems = items.map((b) => toPublicBusinessCard(b));

  return (
    <main className="page">
      <Link href={cityCategoriesPath(city.slug)} className="page-back">
        {labels.back}
      </Link>
      <h1 className="page-title">{catTitle}</h1>
      {subs.length ? (
        <>
          <p style={{ color: 'var(--muted)' }}>{labels.subcategories}</p>
          <div className="cat-grid">
            <CategoryIconTile
              title={labels.allSubcategories}
              icon={null}
              href={cityCategoryPath(city.slug, category.slug)}
            />
            {subs.map((s) => (
              <CategoryIconTile
                key={s.id}
                title={subcategoryDisplayName(s, locale)}
                icon={s.iconUrl ?? s.icon}
                href={citySubcategoryPath(city.slug, category.slug, s.slug)}
              />
            ))}
          </div>
        </>
      ) : null}
      <h2 style={{ marginTop: 28 }}>{labels.businesses}</h2>
      <BusinessList items={publicItems} locale={locale} />
      <PaginationLinks
        basePath={cityCategoryPath(city.slug, category.slug)}
        page={safePage}
        totalPages={totalPages}
        labels={labels}
      />
    </main>
  );
}
