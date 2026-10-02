'use client';

import Link from 'next/link';
import { PublicMediaImage, normalizePublicMediaSrc } from '@/components/public/PublicMediaImage';
import { AdViewabilityTracker } from '@/components/ads/AdViewabilityTracker';
import { SponsoredLabel } from '@/components/ads/SponsoredLabel';
import { useAdTracking } from '@/components/ads/useAdTracking';
import { adBusinessHref } from '@/lib/ad-navigation';
import type { AdServeItemDto } from '@/lib/ads-types';
import type { AppLocale } from '@/lib/locale';
import { getApiOrigin } from '@/lib/public-config';

const API_ORIGIN = getApiOrigin();

function PaidPromotionCard({
  item,
  sessionId,
  locale,
  citySlug,
}: {
  item: AdServeItemDto;
  sessionId: string;
  locale: AppLocale;
  citySlug: string;
}) {
  const href = adBusinessHref(locale, citySlug, item);
  const promo = item.promotion as { title?: string; imageUrl?: string } | null | undefined;
  const title =
    promo?.title?.trim() ||
    item.creative?.title?.trim() ||
    item.business?.title ||
    '';
  if (!href || !title) return null;

  const tracking = useAdTracking({
    campaignId: item.campaignId,
    placementId: item.placementId,
    placementCode: item.placementCode,
    sessionId,
    position: item.position,
  });

  const cover = normalizePublicMediaSrc(
    promo?.imageUrl ?? item.business?.coverImageUrl ?? item.creative?.imageUrl,
    API_ORIGIN,
  );

  return (
    <AdViewabilityTracker onQualifiedImpression={() => void tracking.trackImpression()}>
      <li>
        <Link
          href={href}
          className="home-promo-card home-promo-card--paid"
          onClick={() => tracking.trackClick()}
          rel="sponsored"
        >
          <div className="home-promo-card__media">
            {cover ? (
              <PublicMediaImage src={cover} alt="" width={80} height={80} sizes="80px" />
            ) : (
              <span className="home-promo-card__fallback" aria-hidden />
            )}
          </div>
          <div className="home-promo-card__body">
            <p className="home-promo-card__title">{title}</p>
            {item.business?.title ? (
              <p className="home-promo-card__business">{item.business.title}</p>
            ) : null}
            <SponsoredLabel locale={locale} backendLabel={item.displayLabel} />
          </div>
        </Link>
      </li>
    </AdViewabilityTracker>
  );
}

/** Paid HOME_PROMOTIONS placement — rendered below organic CW.4 preview (mobile parity). */
export function HomePromotionsPaidStrip({
  items,
  sessionId,
  locale,
  citySlug,
}: {
  items: AdServeItemDto[];
  sessionId: string;
  locale: AppLocale;
  citySlug: string;
}) {
  if (!items.length) return null;
  return (
    <ul className="home-promo-list home-promo-list--paid" aria-label="Sponsored promotions">
      {items.map((item) => (
        <PaidPromotionCard
          key={`${item.campaignId}-${item.placementId}`}
          item={item}
          sessionId={sessionId}
          locale={locale}
          citySlug={citySlug}
        />
      ))}
    </ul>
  );
}
