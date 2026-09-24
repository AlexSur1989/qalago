import Link from 'next/link';
import type { PublicBusinessCard } from '@/lib/public-business';
import { discoveryBusinessDetailHref } from '@/lib/public-business';
import { UI_LABELS, type AppLocale } from '@/lib/locale';
import { getApiOrigin } from '@/lib/public-config';

const API_ORIGIN = getApiOrigin();

function coverSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function BusinessList({
  items,
  locale,
}: {
  items: PublicBusinessCard[];
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
            <Link href={discoveryBusinessDetailHref(b)} className="biz-card">
              <div className="biz-card__media">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt={labels.businessCardCoverAlt} width={72} height={72} loading="lazy" />
                ) : (
                  <span className="biz-card__fallback" aria-hidden />
                )}
              </div>
              <div>
                <strong>{b.title}</strong>
                {b.categoryLabel ? (
                  <div style={{ fontSize: 13, color: 'var(--blue)' }}>{b.categoryLabel}</div>
                ) : null}
                <div style={{ fontSize: 14, color: 'var(--muted)' }}>{b.address}</div>
                {b.averageRating != null && b.reviewCount > 0 ? (
                  <div style={{ fontSize: 13, marginTop: 4 }} aria-label={labels.ratingLabel}>
                    ★ {b.averageRating.toFixed(1)} ({b.reviewCount})
                  </div>
                ) : null}
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
