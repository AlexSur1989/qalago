import type { BusinessPublicDetailDto } from '@/lib/catalog-api';
import type { AppLocale, UiLabels } from '@/lib/locale';
import { subcategoryDisplayName } from '@/lib/locale';
import { resolvePublicMediaUrl, externalMapNavigationUrl } from '@/lib/media-url';
import {
  detailPhysicalAddress,
  detailPhysicalContacts,
} from '@/lib/business-detail-display';

type Props = {
  business: BusinessPublicDetailDto;
  locale: AppLocale;
  labels: UiLabels;
};

function externalLinkProps(href: string) {
  return { href, target: '_blank' as const, rel: 'noopener noreferrer' };
}

export function BusinessShowcase({ business, locale, labels }: Props) {
  const address = detailPhysicalAddress(business);
  const contacts = detailPhysicalContacts(business);
  const ep = business.effectivePhysical;
  const cover =
    resolvePublicMediaUrl(business.effectiveMedia?.coverImageUrl) ??
    resolvePublicMediaUrl(business.coverImageUrl);
  const gallery = business.effectiveMedia?.galleryPreview.items ?? [];
  const catalogItems = business.effectiveCatalog?.items ?? [];
  const promotions = business.effectivePromotions?.items ?? [];
  const reviews = business.reviewsPreview?.items ?? [];
  const reviewTotal = business.reviewCount ?? business.reviewsPreview?.totalCount ?? 0;
  const rating = business.averageRating;

  const instagram = ep?.instagram?.trim() || null;
  const whatsapp = contacts.whatsapp?.trim() || null;
  const phone = contacts.phone?.trim() || null;
  const website = contacts.website?.trim() || null;

  const lat = ep?.latitude;
  const lng = ep?.longitude;
  const hasMapCoords = typeof lat === 'number' && typeof lng === 'number';

  return (
    <article className="business-showcase">
      <header className="business-showcase__hero">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={labels.businessCoverAlt}
            className="business-showcase__cover"
            width={960}
            height={420}
          />
        ) : null}
        <h1 className="page-title business-showcase__title">{business.title}</h1>
        {business.category ? (
          <p className="business-showcase__category">{business.category.title}</p>
        ) : null}
        {business.subcategories?.length ? (
          <p className="business-showcase__subcats">
            {business.subcategories
              .map((s) => subcategoryDisplayName(s, locale))
              .join(' · ')}
          </p>
        ) : null}
        {rating != null && reviewTotal > 0 ? (
          <p className="business-showcase__rating" aria-label={labels.ratingLabel}>
            ★ {rating.toFixed(1)} ({reviewTotal})
          </p>
        ) : null}
        {business.shortDesc ? (
          <p className="business-showcase__short">{business.shortDesc}</p>
        ) : null}
        {!business.shortDesc && business.description ? (
          <p className="business-showcase__short">{business.description}</p>
        ) : null}
      </header>

      <section className="business-showcase__section" aria-labelledby="biz-contacts">
        <h2 id="biz-contacts" className="business-showcase__heading">
          {labels.businessContactsTitle}
        </h2>
        <p>{address}</p>
        {phone ? <p>{phone}</p> : null}
        {whatsapp ? <p>{whatsapp}</p> : null}
        {instagram ? (
          <p>
            <a {...externalLinkProps(instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace(/^@/, '')}`)}>
              {instagram}
            </a>
          </p>
        ) : null}
        {website ? (
          <p>
            <a {...externalLinkProps(website.startsWith('http') ? website : `https://${website}`)}>
              {website}
            </a>
          </p>
        ) : null}
      </section>

      {hasMapCoords ? (
        <section className="business-showcase__section" aria-labelledby="biz-location">
          <h2 id="biz-location" className="business-showcase__heading">
            {labels.businessLocationTitle}
          </h2>
          <p>
            <a {...externalLinkProps(externalMapNavigationUrl(lat!, lng!))}>
              {labels.businessOpenMap}
            </a>
          </p>
        </section>
      ) : null}

      {gallery.length > 0 ? (
        <section className="business-showcase__section" aria-labelledby="biz-gallery">
          <h2 id="biz-gallery" className="business-showcase__heading">
            {labels.businessGalleryTitle}
          </h2>
          <ul className="business-showcase__gallery">
            {gallery.map((item) => {
              const src = resolvePublicMediaUrl(item.imageUrl);
              if (!src) return null;
              return (
                <li key={item.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" loading="lazy" width={160} height={120} />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {catalogItems.length > 0 ? (
        <section className="business-showcase__section" aria-labelledby="biz-catalog">
          <h2 id="biz-catalog" className="business-showcase__heading">
            {labels.businessServicesTitle}
          </h2>
          <ul className="business-showcase__list">
            {catalogItems.map((item) => (
              <li key={item.id} className="business-showcase__list-item">
                <strong>{item.title}</strong>
                {item.price != null ? (
                  <span className="business-showcase__price"> — {item.price}</span>
                ) : null}
                {item.description ? (
                  <p className="business-showcase__muted">{item.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {promotions.length > 0 ? (
        <section className="business-showcase__section" aria-labelledby="biz-promos">
          <h2 id="biz-promos" className="business-showcase__heading">
            {labels.businessPromotionsTitle}
          </h2>
          <ul className="business-showcase__list">
            {promotions.map((item) => (
              <li key={item.id} className="business-showcase__list-item">
                <strong>{item.title}</strong>
                {item.discountText ? (
                  <span className="business-showcase__accent"> {item.discountText}</span>
                ) : null}
                {item.description ? (
                  <p className="business-showcase__muted">{item.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="business-showcase__section" aria-labelledby="biz-reviews">
        <h2 id="biz-reviews" className="business-showcase__heading">
          {labels.businessReviewsTitle}
        </h2>
        {reviews.length === 0 ? (
          <p className="business-showcase__muted">{labels.businessNoReviews}</p>
        ) : (
          <ul className="business-showcase__list">
            {reviews.map((review) => (
              <li key={review.id} className="business-showcase__list-item">
                <strong aria-label={labels.ratingLabel}>★ {review.rating}</strong>
                {review.user?.name ? (
                  <span className="business-showcase__muted"> — {review.user.name}</span>
                ) : null}
                {review.text ? <p>{review.text}</p> : null}
              </li>
            ))}
          </ul>
        )}
        {reviewTotal > reviews.length ? (
          <p className="business-showcase__muted">
            +{reviewTotal - reviews.length} {labels.businessReadMoreReviews}
          </p>
        ) : null}
      </section>
    </article>
  );
}
