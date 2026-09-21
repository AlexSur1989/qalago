import type { Metadata } from 'next';
import Link from 'next/link';
import { CategoryIconTile, CategoryMoreTile } from '@/components/CategoryIconTile';
import { SearchForm } from '@/components/SearchForm';
import { requireCity, requireCityCategories } from '@/lib/city-page-data';
import { homeColumns, sliceHomeCategories } from '@/lib/home-categories';
import { cityDisplayName, homeTaglineForCity } from '@/lib/localized-content';
import { UI_LABELS, categoryDisplayName } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';
import { cityCategoriesPath, cityCategoryPath } from '@/lib/routes';
import { metadataForCity } from '@/lib/seo/page-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}): Promise<Metadata> {
  const { citySlug } = await params;
  const locale = await getServerLocale();
  const city = await requireCity(citySlug);
  return metadataForCity(city.slug, cityDisplayName(city, locale), locale);
}

export default async function CityHomePage({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}) {
  const { citySlug } = await params;
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];
  const { city, categories } = await requireCityCategories(citySlug);
  const tagline = homeTaglineForCity(locale, cityDisplayName(city, locale));
  const columns = homeColumns(720);
  const { preview, showMore } = sliceHomeCategories(categories, columns);

  return (
    <main className="page">
      <h1 className="page-title">{cityDisplayName(city, locale)}</h1>
      <p className="page-lead">{tagline}</p>
      <SearchForm citySlug={city.slug} labels={labels} />
      {!categories.length ? (
        <p style={{ color: 'var(--muted)' }}>{labels.emptyCategories}</p>
      ) : (
        <section aria-label={labels.categories} style={{ marginTop: 28 }}>
          <div className="cat-grid">
            {preview.map((c) => (
              <CategoryIconTile
                key={c.id}
                title={categoryDisplayName(c, locale)}
                icon={c.iconUrl ?? c.icon}
                href={cityCategoryPath(city.slug, c.slug)}
              />
            ))}
            {showMore ? (
              <CategoryMoreTile
                href={cityCategoriesPath(city.slug)}
                title={labels.moreCategories}
                ariaLabel={labels.moreCategoriesAria}
              />
            ) : null}
          </div>
        </section>
      )}
      <p style={{ marginTop: 32 }}>
        <Link href={cityCategoriesPath(city.slug)}>{labels.allCategories} →</Link>
      </p>
    </main>
  );
}
