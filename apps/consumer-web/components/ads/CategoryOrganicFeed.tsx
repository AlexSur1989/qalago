'use client';

import Link from 'next/link';
import { SponsoredBusinessAdCard } from '@/components/ads/SponsoredBusinessAdCard';
import { PublicEmptyState } from '@/components/public/PublicState';
import { PublicMediaImage, normalizePublicMediaSrc } from '@/components/public/PublicMediaImage';
import type { CategoryFeedEntry } from '@/lib/category-feed-compose';
import { discoveryBusinessDetailHref } from '@/lib/public-business';
import type { PublicBusinessCard } from '@/lib/public-business';
import type { AppLocale, UiLabels } from '@/lib/locale';
import type { PublicLocale } from '@/lib/public-locale';
import { getApiOrigin } from '@/lib/public-config';

const API_ORIGIN = getApiOrigin();

export function CategoryOrganicFeed({
  citySlug,
  entries,
  sessionId,
  locale,
  labels,
}: {
  citySlug: string;
  entries: CategoryFeedEntry<PublicBusinessCard>[];
  sessionId: string;
  locale: PublicLocale;
  labels: UiLabels;
}) {
  if (!entries.length) {
    return <PublicEmptyState message={labels.emptyBusinesses} />;
  }

  return (
    <ul className="biz-list">
      {entries.map((entry, index) => {
        if (entry.kind === 'boost') {
          return (
            <SponsoredBusinessAdCard
              key={`boost-${entry.ad.campaignId}-${entry.ad.placementId}-${index}`}
              item={entry.ad}
              sessionId={sessionId}
              locale={locale as AppLocale}
              citySlug={citySlug}
              labels={labels}
            />
          );
        }
        const b = entry.business;
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
