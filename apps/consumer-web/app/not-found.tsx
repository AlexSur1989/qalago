export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { UI_LABELS } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';

export default async function NotFound() {
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];
  return (
    <main className="page">
      <h1>{labels.notFoundTitle}</h1>
      <p style={{ color: 'var(--muted)' }}>{labels.notFoundMessage}</p>
      <p>
        <Link href="/">{labels.notFoundHome}</Link>
      </p>
    </main>
  );
}
