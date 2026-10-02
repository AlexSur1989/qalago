'use client';

import Link from 'next/link';
import { PublicMediaImage, normalizePublicMediaSrc } from '@/components/public/PublicMediaImage';
import { AdViewabilityTracker } from '@/components/ads/AdViewabilityTracker';
import { SponsoredLabel } from '@/components/ads/SponsoredLabel';
import { useAdTracking } from '@/components/ads/useAdTracking';
import { vipBannerNavigateTarget } from '@/lib/ad-navigation';
import type { AdServeItemDto } from '@/lib/ads-types';
import type { AppLocale } from '@/lib/locale';
import { getApiOrigin } from '@/lib/public-config';

const API_ORIGIN = getApiOrigin();

type Props = {
  item: AdServeItemDto;
  sessionId: string;
  locale: AppLocale;
  citySlug: string;
};

export function HomeVipBannerAd({ item, sessionId, locale, citySlug }: Props) {
  const creative = item.creative;
  if (!creative?.title?.trim()) return null;

  const tracking = useAdTracking({
    campaignId: item.campaignId,
    placementId: item.placementId,
    placementCode: item.placementCode,
    sessionId,
    position: item.position,
  });

  const target = vipBannerNavigateTarget(locale, citySlug, item);
  if (!target) return null;

  const imageSrc = normalizePublicMediaSrc(creative.imageUrl, API_ORIGIN);
  const disclosure = item.displayLabel;

  const inner = (
    <article className="ad-vip-banner">
      {imageSrc ? (
        <div className="ad-vip-banner__media">
          <PublicMediaImage
            src={imageSrc}
            alt=""
            width={960}
            height={540}
            sizes="(max-width: 768px) 100vw, 960px"
            className="ad-vip-banner__img"
          />
        </div>
      ) : (
        <div className="ad-vip-banner__media ad-vip-banner__media--placeholder" aria-hidden />
      )}
      <div className="ad-vip-banner__body">
        <h2 className="ad-vip-banner__title">{creative.title}</h2>
        {creative.description?.trim() ? (
          <p className="ad-vip-banner__desc">{creative.description}</p>
        ) : null}
        <div className="ad-vip-banner__foot">
          <SponsoredLabel locale={locale} backendLabel={disclosure} />
        </div>
      </div>
    </article>
  );

  const onClick = () => tracking.trackClick();

  const linked =
    target.kind === 'external' ? (
      <a
        href={target.url}
        className="ad-vip-banner__link"
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={onClick}
      >
        {inner}
      </a>
    ) : (
      <Link href={target.href} className="ad-vip-banner__link" onClick={onClick}>
        {inner}
      </Link>
    );

  return (
    <section className="home-section" aria-labelledby="home-vip-ad-heading">
      <h2 id="home-vip-ad-heading" className="visually-hidden">
        {creative.title}
      </h2>
      <AdViewabilityTracker onQualifiedImpression={() => void tracking.trackImpression()}>
        {linked}
      </AdViewabilityTracker>
    </section>
  );
}
