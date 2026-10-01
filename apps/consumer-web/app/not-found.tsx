import Link from 'next/link';
import { PublicEmptyState } from '@/components/public/PublicState';
import { UI_LABELS } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';

export default async function NotFound() {
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];
  return (
    <div className="page">
      <PublicEmptyState
        title={labels.notFoundTitle}
        message={labels.notFoundMessage}
        action={
          <Link href="/" className="public-btn public-btn--primary">
            {labels.notFoundHome}
          </Link>
        }
      />
    </div>
  );
}
