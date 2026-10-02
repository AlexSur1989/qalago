import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { OrganicPromotionCard } from '@/components/promotions/OrganicPromotionCard';
import { PublicEmptyState } from '@/components/public/PublicState';
import { PaginationLinks } from '@/components/PaginationLinks';
import { requireCity } from '@/lib/city-page-data';
import { cityDisplayName } from '@/lib/localized-content';
import { UI_LABELS } from '@/lib/locale';
import { getRouteAppLocaleFromParams } from '@/lib/locale-server';
import { fetchCityPromotions } from '@/lib/promotions-api';
import { CITY_PROMOTIONS_PAGE_LIMIT } from '@/lib/promotions-page';
import { cityHomePath, cityPromotionsPath } from '@/lib/routes';
import { parsePageParam } from '@/lib/search-query';
import {
  breadcrumbsForCityPromotions,
  jsonLdFromCrumbs,
} from '@/lib/seo/discovery-breadcrumbs';
import { breadcrumbListJsonLd } from '@/lib/seo/json-ld';
import { metadataForCityPromotions } from '@/lib/seo/page-metadata';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; citySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { locale: localeParam, citySlug } = await params;
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const locale = getRouteAppLocaleFromParams(localeParam);
  const city = await requireCity(citySlug);
  return metadataForCityPromotions(city.slug, cityDisplayName(city, locale), locale, page);
}

export default async function CityPromotionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; citySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale: localeParam, citySlug } = await params;
  const { page: pageRaw } = await searchParams;
  const locale = getRouteAppLocaleFromParams(localeParam);
  const labels = UI_LABELS[locale];
  const city = await requireCity(citySlug);
  const page = parsePageParam(pageRaw);
  const listPath = cityPromotionsPath(locale, city.slug);
  const crumbs = breadcrumbsForCityPromotions(city, locale);

  let items: Awaited<ReturnType<typeof fetchCityPromotions>>['items'] = [];
  let totalPages = 0;
  let safePage = 1;
  let loadFailed = false;

  try {
    const first = await fetchCityPromotions(city.slug, {
      page,
      limit: CITY_PROMOTIONS_PAGE_LIMIT,
    });
    totalPages = Math.max(1, first.meta?.totalPages ?? 1);
    safePage = Math.min(page, totalPages);
    const response =
      safePage === page
        ? first
        : await fetchCityPromotions(city.slug, {
            page: safePage,
            limit: CITY_PROMOTIONS_PAGE_LIMIT,
          });
    items = response.items;
  } catch {
    loadFailed = true;
  }

  return (
    <div className="page">
      <JsonLd data={breadcrumbListJsonLd(jsonLdFromCrumbs(crumbs, listPath))} />
      <Breadcrumbs items={crumbs} />
      <Link href={cityHomePath(locale, city.slug)} className="page-back">
        {labels.back}
      </Link>
      <h1 className="page-title">
        {labels.promotionsPageTitle} — {cityDisplayName(city, locale)}
      </h1>
      <p className="text-secondary promotions-page__intro">{labels.promotionsPageIntro}</p>
      {loadFailed ? (
        <PublicEmptyState message={labels.promotionsLoadError} />
      ) : !items.length ? (
        <PublicEmptyState message={labels.emptyHomePromotions} />
      ) : (
        <>
          <ul className="home-promo-list promotions-page__list" aria-label={labels.promotionsPageTitle}>
            {items.map((promo) => (
              <li key={promo.id}>
                <OrganicPromotionCard
                  locale={locale}
                  citySlug={city.slug}
                  promo={promo}
                  imageAlt={promo.title}
                  showDescription
                  showPeriod
                />
              </li>
            ))}
          </ul>
          <PaginationLinks
            basePath={listPath}
            page={safePage}
            totalPages={totalPages}
            labels={labels}
          />
        </>
      )}
    </div>
  );
}
