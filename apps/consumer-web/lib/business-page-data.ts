import { notFound, permanentRedirect } from 'next/navigation';
import { cachedFetchBusinessBySlug, cachedFetchCity, cachedFetchPublicBusinessLocations } from './catalog-cache';
import type { BusinessPublicDetailDto } from './catalog-api';
import type { PublicBusinessLocation } from './public-business-location';
import { canonicalBusinessPagePath } from './business-page-paths';
import { activeLocationIdFromDetail } from './business-detail-display';

export type CanonicalBusinessPageData = {
  citySlug: string;
  business: BusinessPublicDetailDto;
  branches: PublicBusinessLocation[];
  activeLocationId: string | null;
  /** Query locationId when present (branch context); canonical SEO excludes it. */
  requestedLocationId: string | undefined;
};

/** Shared loader for F.4 page + metadata (409 → permanent redirect, 404 → notFound). */
export async function loadCanonicalBusinessPageData(input: {
  citySlug: string;
  businessSlug: string;
  locationId?: string;
}): Promise<CanonicalBusinessPageData> {
  const city = await cachedFetchCity(input.citySlug);
  if (!city) notFound();

  const result = await cachedFetchBusinessBySlug(
    input.citySlug,
    input.businessSlug,
    input.locationId,
  );

  if (result.status === 'not_found') notFound();

  if (result.status === 'city_mismatch') {
    permanentRedirect(
      canonicalBusinessPagePath(
        result.payload.citySlug,
        result.payload.businessSlug,
        result.payload.locationId,
      ),
    );
  }

  const business = result.business;
  const branches = await cachedFetchPublicBusinessLocations(business.id);
  const activeLocationId = activeLocationIdFromDetail(business, input.locationId);

  return {
    citySlug: input.citySlug,
    business,
    branches,
    activeLocationId,
    requestedLocationId: input.locationId,
  };
}
