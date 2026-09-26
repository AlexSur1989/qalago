import type { Metadata } from 'next';
import { BusinessList } from '@/components/BusinessList';
import { PaginationLinks } from '@/components/PaginationLinks';
import { SearchForm } from '@/components/SearchForm';
import { requireCity } from '@/lib/city-page-data';
import { fetchBusinesses } from '@/lib/catalog-api';
import { cityDisplayName } from '@/lib/localized-content';
import { UI_LABELS } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';
import { toPublicBusinessCard } from '@/lib/public-business';
import {
  isSearchQueryTooShort,
  normalizeSearchQuery,
  parsePageParam,
  SEARCH_RESULTS_LIMIT,
} from '@/lib/search-query';
import { citySearchPath } from '@/lib/routes';
import { metadataForSearch } from '@/lib/seo/page-metadata';

/** Search URLs are query-specific — do not ISR-cache HTML globally. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ citySlug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}): Promise<Metadata> {
  const { citySlug } = await params;
  const { q: qRaw } = await searchParams;
  const locale = await getServerLocale();
  const city = await requireCity(citySlug);
  const query = normalizeSearchQuery(qRaw);
  return metadataForSearch(city.slug, cityDisplayName(city, locale), locale, query);
}

export default async function CitySearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ citySlug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { citySlug } = await params;
  const { q: qRaw, page: pageRaw } = await searchParams;
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];
  const city = await requireCity(citySlug);
  const query = normalizeSearchQuery(qRaw);
  const page = parsePageParam(pageRaw);

  let publicItems: ReturnType<typeof toPublicBusinessCard>[] = [];
  let totalPages = 0;
  let safePage = 1;

  if (query && !isSearchQueryTooShort(query)) {
    const businesses = await fetchBusinesses({
      citySlug: city.slug,
      search: query,
      page,
      limit: SEARCH_RESULTS_LIMIT,
    });
    totalPages = Math.max(1, Math.ceil(businesses.total / businesses.limit) || 1);
    safePage = Math.min(page, totalPages);
    const items =
      safePage === page
        ? businesses.items
        : (
            await fetchBusinesses({
              citySlug: city.slug,
              search: query,
              page: safePage,
              limit: SEARCH_RESULTS_LIMIT,
            })
          ).items;
    publicItems = items.map((b) => toPublicBusinessCard(b));
  }

  const basePath = citySearchPath(city.slug, query);

  return (
    <main className="page">
      <h1 className="page-title">
        {labels.searchHeading} — {cityDisplayName(city, locale)}
      </h1>
      <SearchForm citySlug={city.slug} labels={labels} defaultQuery={query} />
      {!query ? (
        <p style={{ color: 'var(--muted)' }}>{labels.searchNoQueryHint}</p>
      ) : isSearchQueryTooShort(query) ? (
        <p style={{ color: 'var(--muted)' }}>{labels.searchTooShort}</p>
      ) : publicItems.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>{labels.searchNoResults}</p>
      ) : (
        <>
          <BusinessList citySlug={citySlug} items={publicItems} locale={locale} />
          <PaginationLinks
            basePath={basePath}
            page={safePage}
            totalPages={totalPages}
            labels={labels}
          />
        </>
      )}
    </main>
  );
}
