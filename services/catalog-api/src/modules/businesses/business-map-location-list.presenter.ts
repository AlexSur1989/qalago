import type { Prisma } from '@prisma/client';
import type { CatalogMapLocationViewportRow } from './business-catalog-postgis-geo.query';
import { attachMapDiscoveryContext } from './business-discovery-context.util';

export const businessLocationMapPhysicalSelect = {
  id: true,
  businessId: true,
  cityId: true,
  address: true,
  latitude: true,
  longitude: true,
  phone: true,
  whatsapp: true,
  instagram: true,
  website: true,
  workHours: true,
} satisfies Prisma.BusinessLocationSelect;

export type BusinessLocationMapPhysicalRow = Prisma.BusinessLocationGetPayload<{
  select: typeof businessLocationMapPhysicalSelect;
}>;

type BusinessBrandListRow = {
  id: string;
  cityId: string;
  categoryId: string;
  title: string;
  slug: string;
  shortDesc: string | null;
  address: string;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  phone: string | null;
  whatsapp: string | null;
  coverImageUrl: string | null;
  status: import('@prisma/client').BusinessStatus;
  isFeatured: boolean;
  planTier: import('@prisma/client').BusinessPlanTier;
  planExpiresAt: Date | null;
  featuredSlot: number | null;
  createdAt: Date;
  category: {
    id: string;
    title: string;
    slug: string;
    icon: string | null;
  } | null;
};

/** Map list item: brand fields from Business, physical fields from BusinessLocation. */
export type MapLocationBusinessListItem = Omit<
  BusinessBrandListRow,
  'address' | 'latitude' | 'longitude' | 'phone' | 'whatsapp' | 'cityId'
> & {
  locationId: string;
  cityId: string;
  address: string;
  latitude: BusinessLocationMapPhysicalRow['latitude'];
  longitude: BusinessLocationMapPhysicalRow['longitude'];
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  workHours: BusinessLocationMapPhysicalRow['workHours'];
  distanceMeters?: number;
  /** Discovery navigation hint — same branch as `locationId` on map rows (A.7.9.1). */
  contextLocationId?: string;
  averageRating?: number | null;
  reviewCount?: number;
};

export function assembleMapLocationBusinessListItems(
  spatialRows: CatalogMapLocationViewportRow[],
  businesses: BusinessBrandListRow[],
  locations: BusinessLocationMapPhysicalRow[],
  extras?: {
    distanceMetersByLocationId?: ReadonlyMap<string, number>;
    ratingsByBusinessId?: ReadonlyMap<
      string,
      { averageRating: number | null; reviewCount: number }
    >;
  },
): MapLocationBusinessListItem[] {
  const businessById = new Map(businesses.map((b) => [b.id, b]));
  const locationById = new Map(locations.map((l) => [l.id, l]));

  const items: MapLocationBusinessListItem[] = [];
  for (const spatialRow of spatialRows) {
    const business = businessById.get(spatialRow.businessId);
    const location = locationById.get(spatialRow.locationId);
    if (!business || !location) continue;

    const rating = extras?.ratingsByBusinessId?.get(business.id);
    const distanceMeters = extras?.distanceMetersByLocationId?.has(location.id)
      ? extras.distanceMetersByLocationId.get(location.id)
      : undefined;
    const listItem = {
      id: business.id,
      locationId: location.id,
      categoryId: business.categoryId,
      title: business.title,
      slug: business.slug,
      shortDesc: business.shortDesc,
      cityId: location.cityId,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      phone: location.phone ?? business.phone,
      whatsapp: location.whatsapp ?? business.whatsapp,
      instagram: location.instagram,
      website: location.website,
      workHours: location.workHours,
      coverImageUrl: business.coverImageUrl,
      status: business.status,
      isFeatured: business.isFeatured,
      planTier: business.planTier,
      planExpiresAt: business.planExpiresAt,
      featuredSlot: business.featuredSlot,
      createdAt: business.createdAt,
      category: business.category,
      ...(distanceMeters != null ? { distanceMeters } : {}),
      ...(rating
        ? {
            averageRating: rating.averageRating,
            reviewCount: rating.reviewCount,
          }
        : {}),
    };
    items.push(
      attachMapDiscoveryContext(listItem, {
        distanceMeters: distanceMeters ?? null,
      }),
    );
  }
  return items;
}
