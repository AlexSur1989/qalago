export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { CategoryIconTile, CategoryMoreTile } from '@/components/CategoryIconTile';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { fetchCategories, fetchCity } from '@/lib/catalog-api';
import { homeColumns, sliceHomeCategories } from '@/lib/home-categories';
import { cityDisplayName, homeTaglineForCity } from '@/lib/localized-content';
import { UI_LABELS, categoryDisplayName } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';

const DEFAULT_CITY_SLUG = 'uralsk';

export default async function HomePage() {
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];
  const [categories, city] = await Promise.all([
    fetchCategories(DEFAULT_CITY_SLUG),
    fetchCity(DEFAULT_CITY_SLUG).catch(() => null),
  ]);
  const tagline = city
    ? homeTaglineForCity(locale, cityDisplayName(city, locale))
    : labels.homeTagline;
  const columns = homeColumns(720);
  const { preview, showMore } = sliceHomeCategories(categories, columns);

  return (
    <main className="page">
      <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--blue)' }}>QalaGo</h1>
          <p style={{ color: 'var(--muted)' }}>{tagline}</p>
        </div>
        <LocaleSwitcher locale={locale} labels={labels} />
      </header>
      <section aria-label={labels.categories}>
        <div className="cat-grid">
          {preview.map((c) => (
            <CategoryIconTile
              key={c.id}
              title={categoryDisplayName(c, locale)}
              icon={c.iconUrl ?? c.icon}
              href={`/categories/${c.id}`}
            />
          ))}
          {showMore ? (
            <CategoryMoreTile
              href="/categories"
              title={labels.moreCategories}
              ariaLabel={labels.moreCategoriesAria}
            />
          ) : null}
        </div>
      </section>
      <p style={{ marginTop: 32 }}>
        <Link href="/categories">{labels.allCategories} →</Link>
      </p>
    </main>
  );
}
