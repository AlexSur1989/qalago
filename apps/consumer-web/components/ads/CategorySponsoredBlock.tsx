'use client';

import type { AdServeItemDto } from '@/lib/ads-types';
import type { AppLocale, UiLabels } from '@/lib/locale';
import { SponsoredBusinessAdCard } from '@/components/ads/SponsoredBusinessAdCard';
import { SponsoredLabel } from '@/components/ads/SponsoredLabel';

/** CATEGORY_TOP + CATEGORY_BOOST served items (deduped upstream). */
export function CategorySponsoredBlock({
  items,
  sessionId,
  locale,
  citySlug,
  labels,
  title,
}: {
  items: AdServeItemDto[];
  sessionId: string;
  locale: AppLocale;
  citySlug: string;
  labels: UiLabels;
  title: string;
}) {
  if (!items.length) return null;
  const disclosure = items[0]?.displayLabel;

  return (
    <section className="category-ad-block" aria-labelledby="category-sponsored-heading">
      <div className="home-section__head">
        <h2 id="category-sponsored-heading" className="home-section__title">
          {title}
        </h2>
        <SponsoredLabel locale={locale} backendLabel={disclosure} labels={labels} />
      </div>
      <ul className="biz-list">
        {items.map((item) => (
          <SponsoredBusinessAdCard
            key={`${item.placementCode}-${item.campaignId}-${item.placementId}`}
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
