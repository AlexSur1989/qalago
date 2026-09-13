export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { CategoryIconTile, CategoryMoreTile } from '@/components/CategoryIconTile';
import { fetchCategories } from '@/lib/catalog-api';
import { homeColumns, sliceHomeCategories } from '@/lib/home-categories';

export default async function HomePage() {
  const categories = await fetchCategories('uralsk');
  const columns = homeColumns(720);
  const { preview, showMore } = sliceHomeCategories(categories, columns);

  return (
    <main className="page">
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: 'var(--blue)' }}>QalaGo</h1>
        <p style={{ color: 'var(--muted)' }}>Заведения и услуги Уральска</p>
      </header>
      <section aria-label="Категории">
        <div className="cat-grid">
          {preview.map((c) => (
            <CategoryIconTile
              key={c.id}
              title={c.title}
              icon={c.iconUrl ?? c.icon}
              href={`/categories/${c.id}`}
            />
          ))}
          {showMore ? <CategoryMoreTile href="/categories" /> : null}
        </div>
      </section>
      <p style={{ marginTop: 32 }}>
        <Link href="/categories">Все категории →</Link>
      </p>
    </main>
  );
}
