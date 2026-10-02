'use client';

import { PublicMediaImage, normalizePublicMediaSrc } from '@/components/public/PublicMediaImage';
import { TrackedOrganicBusinessLink } from '@/components/analytics/TrackedOrganicBusinessLink';
import type { HomePopularEntry } from '@/lib/home-popular-data';
import { discoveryBusinessDetailHref, type PublicBusinessCard } from '@/lib/public-business';
import type { AppLocale, UiLabels } from '@/lib/locale';
import { getApiOrigin } from '@/lib/public-config';

const API_ORIGIN = getApiOrigin();

export function HomeOrganicBusinessVerticalList({
  locale,
  citySlug,
  cityId,
  labels,
  items,
  discoverySurface,
}: {
  locale: AppLocale;
  citySlug: string;
  cityId?: string | null;
  labels: UiLabels;
  items: PublicBusinessCard[];
  discoverySurface: string;
}) {
  return (
    <ul className="biz-list">
      {items.map((b, index) => {
        const cover = normalizePublicMediaSrc(b.coverImageUrl, API_ORIGIN);
        const href = discoveryBusinessDetailHref(locale, citySlug, b);
        return (
          <li key={b.id}>
            <TrackedOrganicBusinessLink
              href={href}
              businessId={b.id}
              cityId={cityId}
              businessLocationId={b.contextLocationId}
              discoverySurface={discoverySurface}
              position={index + 1}
              className="biz-card"
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
            </TrackedOrganicBusinessLink>
          </li>
        );
      })}
    </ul>
  );
}

export function HomeOrganicBusinessHorizontalStrip({
  locale,
  citySlug,
  cityId,
  labels,
  items,
  discoverySurface,
}: {
  locale: AppLocale;
  citySlug: string;
  cityId?: string | null;
  labels: UiLabels;
  items: HomePopularEntry[];
  discoverySurface: string;
}) {
  return (
    <ul className="home-popular-strip" aria-label={labels.homeSectionPopular}>
      {items.map((b, index) => {
        const cover = normalizePublicMediaSrc(b.coverImageUrl, API_ORIGIN);
        const href = discoveryBusinessDetailHref(locale, citySlug, b);
        return (
          <li key={b.id} className="home-popular-strip__item">
            <TrackedOrganicBusinessLink
              href={href}
              businessId={b.id}
              cityId={cityId}
              businessLocationId={b.contextLocationId}
              discoverySurface={discoverySurface}
              position={index + 1}
              className="home-popular-card"
            >
              <div className="home-popular-card__media">
                {cover ? (
                  <PublicMediaImage
                    src={cover}
                    alt={labels.businessCardCoverAlt}
                    width={168}
                    height={120}
                    sizes="168px"
                  />
                ) : (
                  <span className="biz-card__fallback" aria-hidden />
                )}
              </div>
              <p className="home-popular-card__title">{b.title}</p>
              {b.subtitle ? (
                <p className="home-popular-card__subtitle">{b.subtitle}</p>
              ) : b.categoryLabel ? (
                <p className="home-popular-card__subtitle">{b.categoryLabel}</p>
              ) : null}
            </TrackedOrganicBusinessLink>
          </li>
        );
      })}
    </ul>
  );
}
