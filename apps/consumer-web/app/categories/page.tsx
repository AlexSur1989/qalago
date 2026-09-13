export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { CategoryIconTile } from '@/components/CategoryIconTile';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { fetchCategories } from '@/lib/catalog-api';
import { UI_LABELS, categoryDisplayName } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';

export default async function AllCategoriesPage() {
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];
  const categories = await fetchCategories('uralsk');
  return (
    <main className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/">{labels.back}</Link>
        <LocaleSwitcher locale={locale} />
      </div>
      <h1>{labels.categories}</h1>
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
