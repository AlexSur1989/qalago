import { CategoryIconTile } from '@/components/CategoryIconTile';
import { fetchCategories } from '@/lib/catalog-api';
import { DEFAULT_CITY_SLUG } from '@/lib/public-config';
import { UI_LABELS, categoryDisplayName } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';

export default async function AllCategoriesPage() {
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];
  const categories = await fetchCategories(DEFAULT_CITY_SLUG);
  return (
    <main className="page">
      <h1 className="page-title">{labels.categories}</h1>
      <div className="cat-grid">
        {categories.map((c) => (
          <CategoryIconTile
            key={c.id}
            title={categoryDisplayName(c, locale)}
            icon={c.iconUrl ?? c.icon}
            href={`/categories/${c.id}`}
          />
        ))}
      </div>
    </main>
  );
}
