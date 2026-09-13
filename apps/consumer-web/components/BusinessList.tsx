import Link from 'next/link';
import type { BusinessSummaryDto } from '@/lib/catalog-api';
import { UI_LABELS, type AppLocale } from '@/lib/locale';

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') ?? 'http://localhost:3002';

function coverSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function BusinessList({
  items,
  locale,
}: {
  items: BusinessSummaryDto[];
  locale: AppLocale;
}) {
  const labels = UI_LABELS[locale];
  if (!items.length) {
    return <p style={{ color: 'var(--muted)' }}>{labels.emptyBusinesses}</p>;
  }
  return (
    <ul className="biz-list">
      {items.map((b) => {
        const cover = coverSrc(b.coverImageUrl);
        return (
          <li key={b.id}>
            <Link href={`/businesses/${b.id}`} className="biz-card">
              <div className="biz-card__media">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt="" width={72} height={72} loading="lazy" />
                ) : (
                  <span className="biz-card__fallback" aria-hidden />
                )}
              </div>
              <div>
                <strong>{b.title}</strong>
                <div style={{ fontSize: 14, color: 'var(--muted)' }}>{b.address}</div>
                {b.shortDesc ? (
                  <div style={{ fontSize: 13, marginTop: 4, color: 'var(--muted)' }}>{b.shortDesc}</div>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
