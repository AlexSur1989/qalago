'use client';

import Link from 'next/link';
import { PublicMediaImage, normalizePublicMediaSrc } from '@/components/public/PublicMediaImage';
import { AdViewabilityTracker } from '@/components/ads/AdViewabilityTracker';
import { SponsoredLabel } from '@/components/ads/SponsoredLabel';
import { useAdTracking } from '@/components/ads/useAdTracking';
import { adBusinessHref } from '@/lib/ad-navigation';
import type { AdServeItemDto } from '@/lib/ads-types';
import type { AppLocale, UiLabels } from '@/lib/locale';
import { getApiOrigin } from '@/lib/public-config';
import type { PublicLocale } from '@/lib/public-locale';

const API_ORIGIN = getApiOrigin();

export function SponsoredBusinessAdCard({
  item,
  sessionId,
  locale,
  citySlug,
  labels,
}: {
  item: AdServeItemDto;
  sessionId: string;
  locale: PublicLocale;
  citySlug: string;
  labels: UiLabels;
}) {
  const business = item.business;
  if (!business?.slug) return null;
  const href = adBusinessHref(locale, citySlug, item);
  if (!href) return null;

  const tracking = useAdTracking({
    campaignId: item.campaignId,
    placementId: item.placementId,
    placementCode: item.placementCode,
    sessionId,
    position: item.position,
  });

  const cover = normalizePublicMediaSrc(business.coverImageUrl, API_ORIGIN);

  return (
    <AdViewabilityTracker onQualifiedImpression={() => void tracking.trackImpression()}>
      <li>
        <Link
          href={href}
          className="biz-card biz-card--sponsored"
          onClick={() => tracking.trackClick()}
          rel="sponsored"
        >
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
            <p className="biz-card__title">{business.title}</p>
            {business.category?.title ? (
              <div className="biz-card__category">{business.category.title}</div>
            ) : null}
            {business.address ? <div className="biz-card__meta">{business.address}</div> : null}
            <SponsoredLabel locale={locale as AppLocale} backendLabel={item.displayLabel} />
          </div>
        </Link>
      </li>
    </AdViewabilityTracker>
  );
}
