import Link from 'next/link';
import { OrganicPromotionCard } from '@/components/promotions/OrganicPromotionCard';
import { PublicEmptyState } from '@/components/public/PublicState';
import type { CityPromotionPreviewDto } from '@/lib/promotions-api';
import type { AppLocale, UiLabels } from '@/lib/locale';
import { cityPromotionsPath } from '@/lib/routes';

export function HomePromotionsSection({
  locale,
  citySlug,
  labels,
  items,
  showEmpty = true,
}: {
  locale: AppLocale;
  citySlug: string;
  labels: UiLabels;
  items: CityPromotionPreviewDto[];
  showEmpty?: boolean;
}) {
  return (
    <section className="home-section" aria-labelledby="home-section-promotions-heading">
      <div className="home-section__head">
        <h2 id="home-section-promotions-heading" className="home-section__title">
          {labels.homeSectionPromotions}
        </h2>
        <Link className="home-section__cta" href={cityPromotionsPath(locale, citySlug)}>
          {labels.homeAllPromotions} →
        </Link>
      </div>
      {!items.length ? (
        showEmpty ? <PublicEmptyState message={labels.emptyHomePromotions} /> : null
      ) : (
        <ul className="home-promo-list">
          {items.map((promo) => (
            <li key={promo.id}>
              <OrganicPromotionCard
                locale={locale}
                citySlug={citySlug}
                promo={promo}
                imageAlt=""
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
