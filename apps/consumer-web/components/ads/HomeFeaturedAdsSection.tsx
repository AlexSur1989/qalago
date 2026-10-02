'use client';

import type { AdServeItemDto } from '@/lib/ads-types';
import type { AppLocale, UiLabels } from '@/lib/locale';
import { SponsoredBusinessAdCard } from '@/components/ads/SponsoredBusinessAdCard';

export function HomeFeaturedAdsSection({
  items,
  sessionId,
  locale,
  citySlug,
  labels,
  sectionTitle,
}: {
  items: AdServeItemDto[];
  sessionId: string;
  locale: AppLocale;
  citySlug: string;
  labels: UiLabels;
  sectionTitle: string;
}) {
  const visible = items.slice(0, 4);
  if (!visible.length) return null;

  return (
    <section className="home-section" aria-labelledby="home-featured-ad-heading">
      <div className="home-section__head">
        <h2 id="home-featured-ad-heading" className="home-section__title">
          {sectionTitle}
        </h2>
      </div>
      <ul className="biz-list">
        {visible.map((item) => (
          <SponsoredBusinessAdCard
            key={`${item.campaignId}-${item.placementId}`}
            item={item}
            sessionId={sessionId}
            locale={locale}
            citySlug={citySlug}
            labels={labels}
          />
        ))}
      </ul>
    </section>
  );
}
