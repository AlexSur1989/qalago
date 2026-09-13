export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { CategoryIconTile } from '@/components/CategoryIconTile';
import { fetchCategories } from '@/lib/catalog-api';

export default async function AllCategoriesPage() {
  const categories = await fetchCategories('uralsk');
  return (
    <main className="page">
      <Link href="/">← Главная</Link>
      <h1>Категории</h1>
      <div className="cat-grid">
        {categories.map((c) => (
          <CategoryIconTile
            key={c.id}
            title={c.title}
            icon={c.iconUrl ?? c.icon}
            href={`/categories/${c.id}`}
          />
        ))}
      </div>
    </main>
  );
}
