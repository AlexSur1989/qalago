import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { TrackBusinessView } from '@/components/analytics/TrackBusinessView';
import { BusinessShowcase } from '@/components/BusinessShowcase';
import { JsonLd } from '@/components/JsonLd';
import {
  canonicalBusinessPagePath,
  parseLocationIdParam,
} from '@/lib/business-page-paths';
import { loadCanonicalBusinessPageData } from '@/lib/business-page-data';
import { cachedFetchCity } from '@/lib/catalog-cache';
import { UI_LABELS } from '@/lib/locale';
import { getRouteAppLocaleFromParams, getRouteLocaleFromParams } from '@/lib/locale-server';
import {
  breadcrumbsForCanonicalBusiness,
  jsonLdFromCrumbs,
} from '@/lib/seo/discovery-breadcrumbs';
import { breadcrumbListJsonLd } from '@/lib/seo/json-ld';
import { metadataForCanonicalBusiness } from '@/lib/seo/page-metadata';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; citySlug: string; businessSlug: string }>;
  searchParams: Promise<{ locationId?: string | string[] }>;
}): Promise<Metadata> {
  const { locale: localeParam, citySlug, businessSlug } = await params;
  const locationId = parseLocationIdParam((await searchParams).locationId);
  const locale = getRouteAppLocaleFromParams(localeParam);
  const routeLocale = getRouteLocaleFromParams(localeParam);
  const data = await loadCanonicalBusinessPageData({
    locale: routeLocale,
    citySlug,
    businessSlug,
    locationId,
  });
  return metadataForCanonicalBusiness(
    citySlug,
    businessSlug,
    data.business.title,
    data.business.shortDesc ?? data.business.description,
    locale,
    data.business.coverImageUrl ?? null,
  );
}

export default async function CanonicalBusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; citySlug: string; businessSlug: string }>;
  searchParams: Promise<{ locationId?: string | string[] }>;
}) {
  const { locale: localeParam, citySlug, businessSlug } = await params;
  const locationId = parseLocationIdParam((await searchParams).locationId);
  const locale = getRouteAppLocaleFromParams(localeParam);
  const routeLocale = getRouteLocaleFromParams(localeParam);
  const labels = UI_LABELS[locale];

  const data = await loadCanonicalBusinessPageData({
    locale: routeLocale,
    citySlug,
    businessSlug,
    locationId,
  });
  const city = await cachedFetchCity(citySlug);
  const category = data.business.category
    ? {
        id: data.business.category.id,
        title: data.business.category.title,
        slug: data.business.category.slug,
        nameRu: data.business.category.title,
        nameKk: data.business.category.title,
        sortOrder: 0,
      }
    : null;

  const crumbs = breadcrumbsForCanonicalBusiness(
    city!,
    data.business.title,
    routeLocale,
    category,
  );
  const currentPath = canonicalBusinessPagePath(routeLocale, citySlug, businessSlug);
  const jsonLdItems = jsonLdFromCrumbs(crumbs, currentPath);

  return (
    <div className="page">
      <TrackBusinessView
        businessId={data.business.id}
        cityId={data.business.effectivePhysical?.cityId ?? city?.id}
        businessLocationId={data.activeLocationId ?? data.business.effectivePhysical?.locationId}
      />
      <Breadcrumbs items={crumbs} />
      <JsonLd data={breadcrumbListJsonLd(jsonLdItems)} />
      <BusinessShowcase
        business={data.business}
        locale={locale}
        labels={labels}
        routeLocale={routeLocale}
        businessSlug={businessSlug}
        branches={data.branches}
        activeLocationId={data.activeLocationId}
      />
    </div>
  );
}
