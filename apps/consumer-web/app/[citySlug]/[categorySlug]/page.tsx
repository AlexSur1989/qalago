import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CategoryIconTile } from '@/components/CategoryIconTile';
import { BusinessList } from '@/components/BusinessList';
import { JsonLd } from '@/components/JsonLd';
import { PaginationLinks } from '@/components/PaginationLinks';
import { findCategoryBySlug } from '@/lib/category-resolve';
import { cachedFetchSubcategories } from '@/lib/catalog-cache';
import { requireCityCategories } from '@/lib/city-page-data';
import { fetchBusinesses } from '@/lib/catalog-api';
import { parsePageParam } from '@/lib/search-query';
import {
  UI_LABELS,
  categoryDisplayName,
  subcategoryDisplayName,
} from '@/lib/locale';
import { cityDisplayName } from '@/lib/localized-content';
import { getServerLocale } from '@/lib/locale-server';
import { toPublicBusinessCard } from '@/lib/public-business';
import {
  cityCategoriesPath,
  cityCategoryPath,
  citySubcategoryPath,
} from '@/lib/routes';
import {
  breadcrumbsForCategory,
  jsonLdFromCrumbs,
} from '@/lib/seo/discovery-breadcrumbs';
import { breadcrumbListJsonLd } from '@/lib/seo/json-ld';
import { metadataForCategory } from '@/lib/seo/page-metadata';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ citySlug: string; categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { citySlug, categorySlug } = await params;
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const locale = await getServerLocale();
  const { city, categories } = await requireCityCategories(citySlug);
  const category = findCategoryBySlug(categories, categorySlug);
  if (!category) notFound();
  return metadataForCategory(
    city.slug,
    cityDisplayName(city, locale),
    category.slug,
    categoryDisplayName(category, locale),
    locale,
    page,
  );
}

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
    cachedFetchSubcategories(category.id),
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
  const crumbs = breadcrumbsForCategory(city, category, locale);
  const listPath = cityCategoryPath(city.slug, category.slug);

  return (
    <main className="page">
      <JsonLd data={breadcrumbListJsonLd(jsonLdFromCrumbs(crumbs, listPath))} />
      <Breadcrumbs items={crumbs} />
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
