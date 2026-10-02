import { TrackedPromotionLink } from '@/components/analytics/TrackedPromotionLink';
import { PublicMediaImage, normalizePublicMediaSrc } from '@/components/public/PublicMediaImage';
import { canonicalBusinessPagePath } from '@/lib/business-page-paths';
import type { CityPromotionPreviewDto } from '@/lib/promotions-api';
import type { AppLocale } from '@/lib/locale';
import { getApiOrigin } from '@/lib/public-config';

const API_ORIGIN = getApiOrigin();

export function OrganicPromotionCard({
  locale,
  citySlug,
  promo,
  imageAlt,
  showDescription = false,
  showPeriod = false,
}: {
  locale: AppLocale;
  citySlug: string;
  promo: CityPromotionPreviewDto;
  imageAlt: string;
  showDescription?: boolean;
  showPeriod?: boolean;
}) {
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
  const period =
    showPeriod && (promo.startDate || promo.endDate)
      ? formatPromotionPeriod(promo.startDate, promo.endDate, locale)
      : null;

  return (
    <TrackedPromotionLink
      href={href}
      className="home-promo-card"
      businessId={promo.business.id}
      promotionId={promo.id}
      businessLocationId={promo.contextLocationId}
    >
      <div className="home-promo-card__media">
        {cover ? (
          <PublicMediaImage src={cover} alt={imageAlt} width={80} height={80} sizes="80px" />
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
        {showDescription && promo.description ? (
          <p className="home-promo-card__description">{promo.description}</p>
        ) : null}
        {period ? <p className="home-promo-card__period">{period}</p> : null}
      </div>
    </TrackedPromotionLink>
  );
}

function formatPromotionPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
  locale: AppLocale,
): string {
  const loc = locale === 'kk' ? 'kk-KZ' : 'ru-RU';
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' });
  if (start && end) return `${fmt(start)} — ${fmt(end)}`;
  if (end) return fmt(end);
  if (start) return fmt(start);
  return '';
}
