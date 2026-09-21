import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CategoryIconTile } from '@/components/CategoryIconTile';
import { JsonLd } from '@/components/JsonLd';
import { requireCityCategories } from '@/lib/city-page-data';
import { cityDisplayName } from '@/lib/localized-content';
import { UI_LABELS, categoryDisplayName } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';
import { cityCategoriesPath, cityCategoryPath, cityHomePath } from '@/lib/routes';
import {
  breadcrumbsForCityCategories,
  jsonLdFromCrumbs,
} from '@/lib/seo/discovery-breadcrumbs';
import { breadcrumbListJsonLd } from '@/lib/seo/json-ld';
import { metadataForCityCategories } from '@/lib/seo/page-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}): Promise<Metadata> {
  const { citySlug } = await params;
  const locale = await getServerLocale();
  const { city } = await requireCityCategories(citySlug);
  return metadataForCityCategories(city.slug, cityDisplayName(city, locale), locale);
}

export default async function CityCategoriesPage({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}) {
  const { citySlug } = await params;
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];
  const { city, categories } = await requireCityCategories(citySlug);
  const crumbs = breadcrumbsForCityCategories(city, locale);
  const listPath = cityCategoriesPath(city.slug);

  return (
    <main className="page">
      <JsonLd data={breadcrumbListJsonLd(jsonLdFromCrumbs(crumbs, listPath))} />
      <Breadcrumbs items={crumbs} />
      <Link href={cityHomePath(city.slug)} className="page-back">
        {labels.back}
      </Link>
      <h1 className="page-title">
        {labels.categories} — {cityDisplayName(city, locale)}
      </h1>
      {!categories.length ? (
        <p style={{ color: 'var(--muted)' }}>{labels.emptyCategories}</p>
      ) : (
        <div className="cat-grid">
          {categories.map((c) => (
            <CategoryIconTile
              key={c.id}
              title={categoryDisplayName(c, locale)}
              icon={c.iconUrl ?? c.icon}
              href={cityCategoryPath(city.slug, c.slug)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
