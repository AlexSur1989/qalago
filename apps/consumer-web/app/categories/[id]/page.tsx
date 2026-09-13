export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { CategoryIconTile } from '@/components/CategoryIconTile';
import { fetchCategories, fetchSubcategories } from '@/lib/catalog-api';

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [categories, subs] = await Promise.all([
    fetchCategories('uralsk'),
    fetchSubcategories(id),
  ]);
  const category = categories.find((c) => c.id === id);

  return (
    <main className="page">
      <Link href="/categories">← Категории</Link>
      <h1>{category?.title ?? 'Категория'}</h1>
      {subs.length ? (
        <>
          <p style={{ color: 'var(--muted)' }}>Подкатегории</p>
          <div className="cat-grid">
            {subs.map((s) => (
              <CategoryIconTile
                key={s.id}
                title={s.nameRu}
                icon={s.iconUrl ?? s.icon}
                href={`/categories/${id}?sub=${s.id}`}
              />
            ))}
          </div>
        </>
      ) : (
        <p style={{ color: 'var(--muted)' }}>Подкатегории пока не добавлены.</p>
      )}
    </main>
  );
}
