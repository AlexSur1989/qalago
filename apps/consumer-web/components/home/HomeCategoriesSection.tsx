import Link from 'next/link';
import { CategoryIconTile, CategoryMoreTile } from '@/components/CategoryIconTile';
import { PublicEmptyState } from '@/components/public/PublicState';
import type { CategoryDto } from '@/lib/catalog-api';
import { homeColumns, sliceHomeCategories } from '@/lib/home-categories';
import { categoryDisplayName, type AppLocale, type UiLabels } from '@/lib/locale';
import { cityCategoriesPath, cityCategoryPath } from '@/lib/routes';

export function HomeCategoriesSection({
  locale,
  citySlug,
  labels,
  categories,
}: {
  locale: AppLocale;
  citySlug: string;
  labels: UiLabels;
  categories: CategoryDto[];
}) {
  const columns = homeColumns(720);
  const { preview, showMore } = sliceHomeCategories(categories, columns);

  return (
    <section className="home-section" aria-labelledby="home-section-categories-heading">
      <div className="home-section__head">
        <h2 id="home-section-categories-heading" className="home-section__title">
          {labels.categories}
        </h2>
        <Link className="home-section__cta" href={cityCategoriesPath(locale, citySlug)}>
          {labels.allCategories} →
        </Link>
      </div>
      {!categories.length ? (
        <PublicEmptyState message={labels.emptyCategories} />
      ) : (
        <div className="cat-grid">
          {preview.map((c) => (
            <CategoryIconTile
              key={c.id}
              title={categoryDisplayName(c, locale)}
              icon={c.iconUrl ?? c.icon}
              href={cityCategoryPath(locale, citySlug, c.slug)}
            />
          ))}
          {showMore ? (
            <CategoryMoreTile
              href={cityCategoriesPath(locale, citySlug)}
              title={labels.moreCategories}
              ariaLabel={labels.moreCategoriesAria}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}
