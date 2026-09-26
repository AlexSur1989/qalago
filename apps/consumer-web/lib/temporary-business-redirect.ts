import type { BusinessPublicDetailDto } from './catalog-api';
import type { PublicBusinessLocation } from './public-business-location';
import { activeLocationIdFromDetail } from './business-detail-display';
import { canonicalBusinessPagePath } from './business-page-paths';
import type { PublicLocale } from './public-locale';

/** Legacy /businesses/{id} → F.5 locale-prefixed canonical path (server redirect target). */
export function resolveLegacyBusinessRedirectPath(
  business: BusinessPublicDetailDto,
  branches: PublicBusinessLocation[],
  requestedLocationId: string | undefined,
  locale: PublicLocale,
): string | null {
  const slug = business.slug?.trim();
  if (!slug) return null;

  const activeId = activeLocationIdFromDetail(business, requestedLocationId);
  const branch =
    branches.find((b) => b.id === activeId) ??
    branches.find((b) => b.isPrimary) ??
    branches[0];
  if (!branch?.city.slug) return null;

  const trimmedRequest = requestedLocationId?.trim();
  const locationForQuery =
    trimmedRequest && branch.id === trimmedRequest ? trimmedRequest : activeId ?? undefined;

  return canonicalBusinessPagePath(locale, branch.city.slug, slug, locationForQuery);
}
