import Link from 'next/link';
import { PublicEmptyState } from '@/components/public/PublicState';
import { PublicMediaImage, normalizePublicMediaSrc } from '@/components/public/PublicMediaImage';
import type { CityPromotionPreviewDto } from '@/lib/promotions-api';
import { canonicalBusinessPagePath } from '@/lib/business-page-paths';
import type { AppLocale, UiLabels } from '@/lib/locale';
import { getApiOrigin } from '@/lib/public-config';

const API_ORIGIN = getApiOrigin();

export function HomePromotionsSection({
  locale,
  citySlug,
  labels,
  items,
}: {
  locale: AppLocale;
  citySlug: string;
  labels: UiLabels;
  items: CityPromotionPreviewDto[];
}) {
  return (
    <section className="home-section" aria-labelledby="home-section-promotions-heading">
      <div className="home-section__head">
        <h2 id="home-section-promotions-heading" className="home-section__title">
          {labels.homeSectionPromotions}
        </h2>
      </div>
      {!items.length ? (
        <PublicEmptyState message={labels.emptyHomePromotions} />
      ) : (
        <ul className="home-promo-list">
          {items.map((promo) => {
            const href = canonicalBusinessPagePath(
              locale,
              citySlug,
              promo.business.slug,
              promo.contextLocationId ?? undefined,
            );
            const cover = normalizePublicMediaSrc(
              promo.imageUrl ?? promo.business.coverImageUrl,
              API_ORIGIN,
            );
            return (
              <li key={promo.id}>
                <Link href={href} className="home-promo-card">
                  <div className="home-promo-card__media">
                    {cover ? (
                      <PublicMediaImage
                        src={cover}
                        alt=""
                        width={80}
                        height={80}
                        sizes="80px"
                      />
                    ) : (
                      <span className="home-promo-card__fallback" aria-hidden />
                    )}
                  </div>
                  <div className="home-promo-card__body">
                    <p className="home-promo-card__title">{promo.title}</p>
                    <p className="home-promo-card__business">{promo.business.title}</p>
                    {promo.discountText ? (
                      <p className="home-promo-card__discount">{promo.discountText}</p>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
