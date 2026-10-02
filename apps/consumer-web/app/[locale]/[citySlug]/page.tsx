import type { Metadata } from 'next';
import { HomeDiscoverySections } from '@/components/home/HomeDiscoverySections';
import { SearchForm } from '@/components/SearchForm';
import { requireCity } from '@/lib/city-page-data';
import { loadHomeDiscoveryPageData } from '@/lib/home-discovery-data';
import { getOrCreateWebSessionId } from '@/lib/web-session-server';
import { cityDisplayName, homeTaglineForCity } from '@/lib/localized-content';
import { UI_LABELS } from '@/lib/locale';
import { getRouteAppLocaleFromParams } from '@/lib/locale-server';
import { metadataForCity } from '@/lib/seo/page-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; citySlug: string }>;
}): Promise<Metadata> {
  const { locale: localeParam, citySlug } = await params;
  const locale = getRouteAppLocaleFromParams(localeParam);
  const city = await requireCity(citySlug);
  return metadataForCity(city.slug, cityDisplayName(city, locale), locale);
}

export default async function CityHomePage({
  params,
}: {
  params: Promise<{ locale: string; citySlug: string }>;
}) {
  const { locale: localeParam, citySlug } = await params;
  const locale = getRouteAppLocaleFromParams(localeParam);
  const labels = UI_LABELS[locale];
  const city = await requireCity(citySlug);
  const tagline = homeTaglineForCity(locale, cityDisplayName(city, locale));
  const webSessionId = await getOrCreateWebSessionId();
  const discovery = await loadHomeDiscoveryPageData(
    {
      id: city.id,
      slug: city.slug,
      centerLat: city.centerLat ?? null,
      centerLng: city.centerLng ?? null,
    },
    webSessionId,
  );

  return (
    <div className="page">
      <h1 className="page-title">{cityDisplayName(city, locale)}</h1>
      <p className="page-lead">{tagline}</p>
      <SearchForm locale={locale} citySlug={city.slug} labels={labels} />
      <HomeDiscoverySections
        locale={locale}
        citySlug={city.slug}
        labels={labels}
        data={discovery}
      />
    </div>
  );
}
