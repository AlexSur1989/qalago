import Link from 'next/link';
import { PublicEmptyState } from '@/components/public/PublicState';
import { PublicMediaImage, normalizePublicMediaSrc } from '@/components/public/PublicMediaImage';
import type { PublicBusinessCard } from '@/lib/public-business';
import { discoveryBusinessDetailHref } from '@/lib/public-business';
import { UI_LABELS } from '@/lib/locale';
import type { PublicLocale } from '@/lib/public-locale';
import { getApiOrigin } from '@/lib/public-config';

const API_ORIGIN = getApiOrigin();

export function BusinessList({
  citySlug,
  items,
  locale,
}: {
  citySlug: string;
  items: PublicBusinessCard[];
  locale: PublicLocale;
}) {
  const labels = UI_LABELS[locale];
  if (!items.length) {
    return <PublicEmptyState message={labels.emptyBusinesses} />;
  }
  return (
    <ul className="biz-list">
      {items.map((b) => {
        const cover = normalizePublicMediaSrc(b.coverImageUrl, API_ORIGIN);
        return (
          <li key={b.id}>
            <Link href={discoveryBusinessDetailHref(locale, citySlug, b)} className="biz-card">
              <div className="biz-card__media">
                {cover ? (
                  <PublicMediaImage
                    src={cover}
                    alt={labels.businessCardCoverAlt}
                    width={72}
                    height={72}
                    sizes="72px"
                  />
                ) : (
                  <span className="biz-card__fallback" aria-hidden />
                )}
              </div>
              <div className="biz-card__body">
                <p className="biz-card__title">{b.title}</p>
                {b.categoryLabel ? (
                  <div className="biz-card__category">{b.categoryLabel}</div>
                ) : null}
                <div className="biz-card__meta">{b.address}</div>
                {b.averageRating != null && b.reviewCount > 0 ? (
                  <div className="biz-card__rating" aria-label={labels.ratingLabel}>
                    ★ {b.averageRating.toFixed(1)} ({b.reviewCount})
                  </div>
                ) : null}
                {b.shortDesc ? <div className="biz-card__desc">{b.shortDesc}</div> : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
