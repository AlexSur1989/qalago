import Link from 'next/link';
import { fetchBusiness } from '@/lib/catalog-api';
import { getApiOrigin } from '@/lib/public-config';
import { UI_LABELS } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];
  const business = await fetchBusiness(id);
  const apiOrigin = getApiOrigin();
  const cover = business.coverImageUrl
    ? business.coverImageUrl.startsWith('http')
      ? business.coverImageUrl
      : `${apiOrigin}${business.coverImageUrl}`
    : null;

  return (
    <main className="page">
      <Link href="/categories" className="page-back">
        {labels.allCategories}
      </Link>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt={labels.businessCoverAlt}
          width={320}
          height={180}
          style={{ borderRadius: 16, objectFit: 'cover', maxWidth: '100%' }}
        />
      ) : null}
      <h1 className="page-title" style={{ marginTop: 16 }}>
        {business.title}
      </h1>
      <p style={{ color: 'var(--muted)' }}>{business.address}</p>
      {business.shortDesc ? <p>{business.shortDesc}</p> : null}
    </main>
  );
}
