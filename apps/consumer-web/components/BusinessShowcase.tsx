import { PublicMediaImage, normalizePublicMediaSrc } from '@/components/public/PublicMediaImage';
import type { BusinessPublicDetailDto } from '@/lib/catalog-api';
import type { AppLocale, UiLabels } from '@/lib/locale';
import { subcategoryDisplayName } from '@/lib/locale';
import { getApiOrigin } from '@/lib/public-config';
import { resolvePublicMediaUrl, externalMapNavigationUrl } from '@/lib/media-url';
import {
  detailPhysicalAddress,
  detailPhysicalContacts,
} from '@/lib/business-detail-display';
import {
  buildInstagramHref,
  buildTelHref,
  buildWebsiteHref,
  buildWhatsAppHref,
} from '@/lib/contact-url';
import { formatReviewDate } from '@/lib/format-public-date';
import { hasWorkHours, workHoursRows } from '@/lib/work-hours-display';
import { BusinessBranchesSection } from '@/components/BusinessBranchesSection';
import type { PublicBusinessLocation } from '@/lib/public-business-location';
import type { PublicLocale } from '@/lib/public-locale';

type Props = {
  business: BusinessPublicDetailDto;
  locale: AppLocale;
  labels: UiLabels;
  routeLocale: PublicLocale;
  businessSlug: string;
  branches: PublicBusinessLocation[];
  activeLocationId: string | null;
};

function externalLinkProps(href: string) {
  return { href, target: '_blank' as const, rel: 'noopener noreferrer' };
}

const API_ORIGIN = getApiOrigin();

function formatPrice(price: number, locale: AppLocale): string {
  return new Intl.NumberFormat(locale === 'kk' ? 'kk-KZ' : 'ru-RU').format(price);
}

export function BusinessShowcase({
  business,
  locale,
  labels,
  routeLocale,
  businessSlug,
  branches,
  activeLocationId,
}: Props) {
  const address = detailPhysicalAddress(business);
  const contacts = detailPhysicalContacts(business);
  const ep = business.effectivePhysical;
  const coverRaw =
    resolvePublicMediaUrl(business.effectiveMedia?.coverImageUrl) ??
    resolvePublicMediaUrl(business.coverImageUrl);
  const cover = normalizePublicMediaSrc(coverRaw, API_ORIGIN);
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

  const workHoursRaw = ep?.workHours ?? null;
  const hoursRows = workHoursRows(workHoursRaw, locale);
  const showWorkHours = hasWorkHours(workHoursRaw);

  const tagline = business.shortDesc?.trim() || null;
  const longDescription = business.description?.trim() || null;
  const showLongDescription =
    longDescription != null &&
    longDescription.length > 0 &&
    longDescription !== tagline;

  const hasContactActions = Boolean(phone || whatsapp || instagram || website);

  return (
    <article className="business-showcase">
      <header className="business-showcase__hero">
        {cover ? (
          <PublicMediaImage
            src={cover}
            alt={labels.businessCoverAlt}
            className="business-showcase__cover"
            width={960}
            height={420}
            sizes="(max-width: 768px) 100vw, 960px"
            priority
          />
        ) : null}
        <div className="business-showcase__identity">
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
          {reviewTotal > 0 && rating != null ? (
            <p className="business-showcase__rating">
              <span aria-hidden>★</span>{' '}
              <span aria-label={labels.ratingLabel}>
                {rating.toFixed(1)} · {reviewTotal}
              </span>
            </p>
          ) : (
            <p className="business-showcase__rating business-showcase__rating--muted">
              {labels.businessNoRatingYet}
            </p>
          )}
          {tagline ? <p className="business-showcase__tagline">{tagline}</p> : null}
        </div>
      </header>

      <BusinessBranchesSection
        locale={routeLocale}
        businessSlug={businessSlug}
        branches={branches}
        activeLocationId={activeLocationId}
        labels={{
          branchesTitle: labels.businessBranchesTitle,
          primaryBadge: labels.businessPrimaryBranchBadge,
          selectedBranch: labels.businessSelectedBranch,
        }}
      />

      {showLongDescription ? (
        <section className="business-showcase__section" aria-labelledby="biz-description">
          <h2 id="biz-description" className="business-showcase__heading">
            {labels.businessDescriptionTitle}
          </h2>
          <div className="business-showcase__prose">{longDescription}</div>
        </section>
      ) : null}

      <section className="business-showcase__section" aria-labelledby="biz-contacts">
        <h2 id="biz-contacts" className="business-showcase__heading">
          {labels.businessContactsTitle}
        </h2>
        <p className="business-showcase__address">{address}</p>
        {hasContactActions ? (
          <ul className="business-showcase__actions">
            {phone ? (
              <li>
                <a className="business-showcase__action" href={buildTelHref(phone)}>
                  {labels.businessContactPhone}
                </a>
              </li>
            ) : null}
            {whatsapp ? (
              <li>
                <a
                  className="business-showcase__action"
                  {...externalLinkProps(buildWhatsAppHref(whatsapp))}
                >
                  {labels.businessContactWhatsApp}
                </a>
              </li>
            ) : null}
            {instagram ? (
              <li>
                <a
                  className="business-showcase__action"
                  {...externalLinkProps(buildInstagramHref(instagram))}
                >
                  {labels.businessContactInstagram}
                </a>
              </li>
            ) : null}
            {website ? (
              <li>
                <a
                  className="business-showcase__action"
                  {...externalLinkProps(buildWebsiteHref(website))}
                >
                  {labels.businessContactWebsite}
                </a>
              </li>
            ) : null}
          </ul>
        ) : null}
      </section>

      {showWorkHours ? (
        <section className="business-showcase__section" aria-labelledby="biz-hours">
          <h2 id="biz-hours" className="business-showcase__heading">
            {labels.businessWorkHoursTitle}
          </h2>
          <table className="business-hours">
            <tbody>
              {hoursRows.map((row) => (
                <tr key={row.dayKey}>
                  <th scope="row">{row.label}</th>
                  <td className={row.isClosed ? 'business-hours__closed' : undefined}>
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {hasMapCoords ? (
        <section className="business-showcase__section" aria-labelledby="biz-location">
          <h2 id="biz-location" className="business-showcase__heading">
            {labels.businessLocationTitle}
          </h2>
          <p>
            <a
              className="business-showcase__action business-showcase__action--inline"
              {...externalLinkProps(externalMapNavigationUrl(lat!, lng!))}
            >
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
              const src = normalizePublicMediaSrc(
                resolvePublicMediaUrl(item.imageUrl),
                API_ORIGIN,
              );
              if (!src) return null;
              return (
                <li key={item.id}>
                  <PublicMediaImage
                    src={src}
                    alt=""
                    width={160}
                    height={120}
                    sizes="(max-width: 768px) 33vw, 160px"
                  />
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
          <ul className="business-showcase__cards">
            {catalogItems.map((item) => {
              const image = normalizePublicMediaSrc(
                resolvePublicMediaUrl(item.imageUrl),
                API_ORIGIN,
              );
              return (
                <li key={item.id} className="business-showcase__card">
                  {image ? (
                    <PublicMediaImage
                      src={image}
                      alt=""
                      width={72}
                      height={72}
                      sizes="72px"
                      className="business-showcase__card-media"
                    />
                  ) : null}
                  <div className="business-showcase__card-body">
                    <p className="business-showcase__card-title">{item.title}</p>
                    {item.price != null ? (
                      <p className="business-showcase__price">
                        {formatPrice(item.price, locale)} ₸
                      </p>
                    ) : null}
                    {item.description ? (
                      <p className="business-showcase__muted">{item.description}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {promotions.length > 0 ? (
        <section className="business-showcase__section" aria-labelledby="biz-promos">
          <h2 id="biz-promos" className="business-showcase__heading">
            {labels.businessPromotionsTitle}
          </h2>
          <ul className="business-showcase__cards">
            {promotions.map((item) => {
              const image = normalizePublicMediaSrc(
                resolvePublicMediaUrl(item.imageUrl),
                API_ORIGIN,
              );
              return (
                <li key={item.id} className="business-showcase__card">
                  {image ? (
                    <PublicMediaImage
                      src={image}
                      alt=""
                      width={72}
                      height={72}
                      sizes="72px"
                      className="business-showcase__card-media"
                    />
                  ) : null}
                  <div className="business-showcase__card-body">
                    <p className="business-showcase__card-title">{item.title}</p>
                    {item.discountText ? (
                      <p className="business-showcase__accent">{item.discountText}</p>
                    ) : null}
                    {item.description ? (
                      <p className="business-showcase__muted">{item.description}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
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
          <ul className="business-showcase__reviews">
            {reviews.map((review) => {
              const dateLabel = formatReviewDate(review.createdAt, locale);
              const ownerReply = review.ownerReply?.trim();
              return (
                <li key={review.id} className="business-showcase__review">
                  <div className="business-showcase__review-head">
                    <strong aria-label={labels.ratingLabel}>★ {review.rating}</strong>
                    {review.user?.name ? (
                      <span className="business-showcase__muted"> · {review.user.name}</span>
                    ) : null}
                    {dateLabel ? (
                      <time className="business-showcase__muted" dateTime={review.createdAt}>
                        {' '}
                        · {dateLabel}
                      </time>
                    ) : null}
                  </div>
                  {review.text ? <p className="business-showcase__review-text">{review.text}</p> : null}
                  {ownerReply ? (
                    <blockquote className="business-showcase__owner-reply">
                      <p className="business-showcase__owner-reply-label">
                        {labels.businessOwnerReply}
                      </p>
                      <p>{ownerReply}</p>
                    </blockquote>
                  ) : null}
                </li>
              );
            })}
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
