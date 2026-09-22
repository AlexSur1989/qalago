import type { AppLocale } from '@/lib/locale';
import type { BusinessImageRow, BusinessLocationRow, CityRow } from '@/lib/api';
import { cityDisplayName } from '@/lib/localized-content';

export const MEDIA_SCOPE_BRAND = 'brand' as const;

export type MediaScopeSelection = typeof MEDIA_SCOPE_BRAND | string;

export type ListBusinessImagesQuery = {
  scope?: 'all' | 'brand';
  locationId?: string;
};

export function isBrandMediaScope(scope: MediaScopeSelection): scope is typeof MEDIA_SCOPE_BRAND {
  return scope === MEDIA_SCOPE_BRAND;
}

export function buildListBusinessImagesQuery(
  scope: MediaScopeSelection,
): ListBusinessImagesQuery {
  if (isBrandMediaScope(scope)) {
    return { scope: 'brand' };
  }
  return { locationId: scope };
}

export function buildAttachBusinessImageBody(
  imageUrl: string,
  scope: MediaScopeSelection,
  asCover: boolean,
): { imageUrl: string; asCover?: boolean; locationId?: string } {
  if (isBrandMediaScope(scope)) {
    return { imageUrl, ...(asCover ? { asCover: true } : {}) };
  }
  return { imageUrl, locationId: scope };
}

export function canSetBusinessCover(scope: MediaScopeSelection): boolean {
  return isBrandMediaScope(scope);
}

export function compareBusinessImagesForPublish(a: BusinessImageRow, b: BusinessImageRow): number {
  return (
    a.sortOrder - b.sortOrder ||
    (a.createdAt ?? '').localeCompare(b.createdAt ?? '') ||
    a.id.localeCompare(b.id)
  );
}

export function buildGlobalPhotoPublishIndexMap(
  images: BusinessImageRow[],
): Map<string, number> {
  const sorted = [...images].sort(compareBusinessImagesForPublish);
  return new Map(sorted.map((row, index) => [row.id, index]));
}

export function formatBranchMediaLabel(
  locale: AppLocale,
  location: BusinessLocationRow,
  cities: CityRow[],
  primarySuffix: string,
): string {
  const city = cities.find((row) => row.id === location.cityId);
  const cityLabel = city ? cityDisplayName(city, locale) : '';
  const address = location.address.trim();
  const parts = [address, cityLabel].filter(Boolean);
  const base = parts.join(', ');
  if (location.isPrimary) {
    return `${base} — ${primarySuffix}`;
  }
  return base || address;
}

/** If selected branch no longer exists, fall back to brand scope. */
export function normalizeMediaScopeAfterLocationsLoad(
  scope: MediaScopeSelection,
  locations: BusinessLocationRow[],
): MediaScopeSelection {
  if (isBrandMediaScope(scope)) {
    return MEDIA_SCOPE_BRAND;
  }
  if (locations.some((row) => row.id === scope)) {
    return scope;
  }
  return MEDIA_SCOPE_BRAND;
}

export function buildListBusinessImagesPath(
  businessId: string,
  query: ListBusinessImagesQuery,
): string {
  const params = new URLSearchParams();
  if (query.scope) {
    params.set('scope', query.scope);
  }
  if (query.locationId) {
    params.set('locationId', query.locationId);
  }
  const qs = params.toString();
  return `/uploads/business/${encodeURIComponent(businessId)}/images${qs ? `?${qs}` : ''}`;
}
