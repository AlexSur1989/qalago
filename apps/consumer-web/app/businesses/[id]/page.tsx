export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { fetchBusiness } from '@/lib/catalog-api';
import { UI_LABELS } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') ?? 'http://localhost:3002';

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];
  const business = await fetchBusiness(id);
  const cover = business.coverImageUrl
    ? business.coverImageUrl.startsWith('http')
      ? business.coverImageUrl
      : `${API_ORIGIN}${business.coverImageUrl}`
    : null;

  return (
    <main className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/categories">{labels.allCategories}</Link>
        <LocaleSwitcher locale={locale} />
      </div>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" width={320} height={180} style={{ borderRadius: 16, objectFit: 'cover' }} />
      ) : null}
      <h1 style={{ marginTop: 16 }}>{business.title}</h1>
      <p style={{ color: 'var(--muted)' }}>{business.address}</p>
      {business.shortDesc ? <p>{business.shortDesc}</p> : null}
    </main>
  );
}
