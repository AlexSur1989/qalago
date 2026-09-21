import { CategoryIconTile } from '@/components/CategoryIconTile';
import { requireCityCategories } from '@/lib/city-page-data';
import { cityDisplayName } from '@/lib/localized-content';
import { UI_LABELS, categoryDisplayName } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';
import { cityCategoryPath, cityHomePath } from '@/lib/routes';
import Link from 'next/link';

export default async function CityCategoriesPage({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}) {
  const { citySlug } = await params;
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];
  const { city, categories } = await requireCityCategories(citySlug);

  return (
    <main className="page">
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
