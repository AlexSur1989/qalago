import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CategorySponsoredBlock } from '@/components/ads/CategorySponsoredBlock';
import { BusinessList } from '@/components/BusinessList';
import { JsonLd } from '@/components/JsonLd';
import { PaginationLinks } from '@/components/PaginationLinks';
import {
  findCategoryBySlug,
  findSubcategoryBySlug,
} from '@/lib/category-resolve';
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
import { getRouteAppLocaleFromParams } from '@/lib/locale-server';
import { applyCategoryOrganicDedupe, loadCategoryAds } from '@/lib/category-ads-data';
import { toPublicBusinessCard } from '@/lib/public-business';
import { getOrCreateWebSessionId } from '@/lib/web-session-server';
import { cityCategoryPath, citySubcategoryPath } from '@/lib/routes';
import {
  breadcrumbsForSubcategory,
  jsonLdFromCrumbs,
} from '@/lib/seo/discovery-breadcrumbs';
import { breadcrumbListJsonLd } from '@/lib/seo/json-ld';
import { metadataForSubcategory } from '@/lib/seo/page-metadata';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; citySlug: string; categorySlug: string; subcategorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { locale: localeParam, citySlug, categorySlug, subcategorySlug } = await params;
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const locale = getRouteAppLocaleFromParams(localeParam);
  const { city, categories } = await requireCityCategories(citySlug);
  const category = findCategoryBySlug(categories, categorySlug);
  if (!category) notFound();
  const subs = await cachedFetchSubcategories(category.id);
  const sub = findSubcategoryBySlug(subs, subcategorySlug, category.id);
  if (!sub) notFound();
  return metadataForSubcategory(
    city.slug,
    cityDisplayName(city, locale),
    category.slug,
    categoryDisplayName(category, locale),
    sub.slug,
    subcategoryDisplayName(sub, locale),
    locale,
    page,
  );
}

export default async function CitySubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; citySlug: string; categorySlug: string; subcategorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale: localeParam, citySlug, categorySlug, subcategorySlug } = await params;
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const locale = getRouteAppLocaleFromParams(localeParam);
  const labels = UI_LABELS[locale];

  const { city, categories } = await requireCityCategories(citySlug);
  const category = findCategoryBySlug(categories, categorySlug);
  if (!category) notFound();

  const subs = await cachedFetchSubcategories(category.id);
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

  const webSessionId = await getOrCreateWebSessionId();
  const { sponsoredItems } = await loadCategoryAds(city.slug, category.id, webSessionId);
  const publicItems = applyCategoryOrganicDedupe(
    items.map((b) => toPublicBusinessCard(b)),
    sponsoredItems,
  );
  const crumbs = breadcrumbsForSubcategory(city, category, sub, locale);
  const listPath = citySubcategoryPath(locale, city.slug, category.slug, sub.slug);

  return (
    <div className="page">
      <JsonLd data={breadcrumbListJsonLd(jsonLdFromCrumbs(crumbs, listPath))} />
      <Breadcrumbs items={crumbs} />
      <Link href={cityCategoryPath(locale, city.slug, category.slug)} className="page-back">
        {labels.back}
      </Link>
      <h1 className="page-title">{subcategoryDisplayName(sub, locale)}</h1>
      <p style={{ color: 'var(--muted)' }}>{categoryDisplayName(category, locale)}</p>
      {sponsoredItems.length ? (
        <CategorySponsoredBlock
          items={sponsoredItems}
          sessionId={webSessionId}
          locale={locale}
          citySlug={city.slug}
          labels={labels}
          title={labels.categorySponsored}
        />
      ) : null}
      <h2 style={{ marginTop: 28 }}>{labels.businesses}</h2>
      <BusinessList citySlug={citySlug} items={publicItems} locale={locale} />
      <PaginationLinks
        basePath={citySubcategoryPath(locale, city.slug, category.slug, sub.slug)}
        page={safePage}
        totalPages={totalPages}
        labels={labels}
      />
    </div>
  );
}
