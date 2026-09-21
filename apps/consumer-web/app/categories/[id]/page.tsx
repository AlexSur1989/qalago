import Link from 'next/link';
import { CategoryIconTile } from '@/components/CategoryIconTile';
import { BusinessList } from '@/components/BusinessList';
import { fetchBusinesses, fetchCategories, fetchSubcategories } from '@/lib/catalog-api';
import { DEFAULT_CITY_SLUG } from '@/lib/public-config';
import {
  UI_LABELS,
  categoryDisplayName,
  subcategoryDisplayName,
} from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sub?: string }>;
}) {
  const { id } = await params;
  const { sub: subcategoryId } = await searchParams;
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];

  const [categories, subs, businesses] = await Promise.all([
    fetchCategories(DEFAULT_CITY_SLUG),
    fetchSubcategories(id),
    fetchBusinesses({ categoryId: id, subcategoryId: subcategoryId || undefined }),
  ]);
  const category = categories.find((c) => c.id === id);
  const catTitle = category ? categoryDisplayName(category, locale) : labels.categories;

  return (
    <main className="page">
      <Link href="/categories" className="page-back">
        {labels.back}
      </Link>
      <h1 className="page-title">{catTitle}</h1>
      {subs.length ? (
        <>
          <p style={{ color: 'var(--muted)' }}>{labels.subcategories}</p>
          <div className="cat-grid">
            <CategoryIconTile
              title={labels.allSubcategories}
              icon={null}
              href={`/categories/${id}`}
            />
            {subs.map((s) => (
              <CategoryIconTile
                key={s.id}
                title={subcategoryDisplayName(s, locale)}
                icon={s.iconUrl ?? s.icon}
                href={`/categories/${id}?sub=${s.id}`}
              />
            ))}
          </div>
        </>
      ) : null}
      <h2 style={{ marginTop: 28 }}>{labels.businesses}</h2>
      <BusinessList items={businesses.items} locale={locale} />
    </main>
  );
}
