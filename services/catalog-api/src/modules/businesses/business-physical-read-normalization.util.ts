import type { BusinessLocation, Prisma, PrismaClient } from '@prisma/client';
import {
  buildEffectivePhysicalDto,
  type BusinessContactDefaults,
  type EffectivePhysicalDto,
  resolveActiveBusinessLocationForDetail,
} from './business-effective-physical.util';

/** Top-level public fields normalized from effective BusinessLocation context (A.9.3.1). */
export type PublicPhysicalReadProjection = Pick<
  EffectivePhysicalDto,
  | 'cityId'
  | 'address'
  | 'latitude'
  | 'longitude'
  | 'phone'
  | 'whatsapp'
  | 'instagram'
  | 'website'
  | 'workHours'
>;

export type PublicPhysicalReadBusinessSource = BusinessContactDefaults & {
  contextLocationId?: string | null;
};

/** Runtime list/favorite rows after BL physical projection (A.9.4.4B). */
export type WithPublicPhysicalGeoFields<T> = T &
  Pick<PublicPhysicalReadProjection, 'address' | 'latitude' | 'longitude'>;

export function businessRowToContactDefaults(
  business: PublicPhysicalReadBusinessSource,
): BusinessContactDefaults {
  return {
    phone: business.phone ?? null,
    whatsapp: business.whatsapp ?? null,
    instagram: business.instagram ?? null,
    website: business.website ?? null,
    workHours: business.workHours ?? null,
  };
}

/** @deprecated Use businessRowToContactDefaults — runtime must not read Business geo columns (A.9.4.4B). */
export function businessRowToPhysicalFallback(
  business: PublicPhysicalReadBusinessSource,
): BusinessContactDefaults {
  return businessRowToContactDefaults(business);
}

export function effectivePhysicalToPublicProjection(
  effective: EffectivePhysicalDto,
): PublicPhysicalReadProjection {
  return {
    cityId: effective.cityId,
    address: effective.address,
    latitude: effective.latitude,
    longitude: effective.longitude,
    phone: effective.phone,
    whatsapp: effective.whatsapp,
    instagram: effective.instagram,
    website: effective.website,
    workHours: effective.workHours,
  };
}

/**
 * Projects legacy-compatible top-level physical fields for one business row.
 * Does not mutate the input object.
 */
export function projectPublicPhysicalReadFields(
  business: PublicPhysicalReadBusinessSource,
  locations: BusinessLocation[],
  contextLocationId?: string | null,
): PublicPhysicalReadProjection {
  const { location } = resolveActiveBusinessLocationForDetail(
    locations,
    contextLocationId ?? undefined,
  );
  const effective = buildEffectivePhysicalDto(businessRowToContactDefaults(business), location);
  return effectivePhysicalToPublicProjection(effective);
}

/** Applies projection onto a list/detail row (new object). Optional keys only overwritten when present on `target`. */
export function applyPublicPhysicalReadProjection<
  T extends Record<string, unknown> & PublicPhysicalReadBusinessSource,
>(
  target: T,
  business: PublicPhysicalReadBusinessSource,
  locations: BusinessLocation[],
  contextLocationId?: string | null,
): WithPublicPhysicalGeoFields<T> {
  const projection = projectPublicPhysicalReadFields(business, locations, contextLocationId);
  const next: Record<string, unknown> = { ...target };

  if ('cityId' in target) {
    next.cityId = projection.cityId;
  }
  next.address = projection.address;
  next.latitude = projection.latitude;
  next.longitude = projection.longitude;
  if ('phone' in target) {
    next.phone = projection.phone;
  }
  if ('whatsapp' in target) {
    next.whatsapp = projection.whatsapp;
  }
  if ('instagram' in target) {
    next.instagram = projection.instagram;
  }
  if ('website' in target) {
    next.website = projection.website;
  }
  if ('workHours' in target) {
    next.workHours = projection.workHours;
  }

  return next as WithPublicPhysicalGeoFields<T>;
}

/** Detail: top-level physical fields must match `effectivePhysical` (same resolution). */
export function applyPublicPhysicalReadFromEffectivePhysical<
  T extends BusinessContactDefaults & { effectivePhysical: EffectivePhysicalDto },
>(row: T): T & Pick<PublicPhysicalReadProjection, 'address' | 'latitude' | 'longitude'> {
  const projection = effectivePhysicalToPublicProjection(row.effectivePhysical);
  return {
    ...row,
    ...( 'cityId' in row ? { cityId: row.effectivePhysical.cityId } : {} ),
    address: projection.address,
    latitude: projection.latitude,
    longitude: projection.longitude,
    phone: projection.phone,
    whatsapp: projection.whatsapp,
    instagram: projection.instagram,
    website: projection.website,
    workHours: projection.workHours as T['workHours'],
  } as T & Pick<PublicPhysicalReadProjection, 'address' | 'latitude' | 'longitude'>;
}

export function readContextLocationIdFromListItem(
  item: PublicPhysicalReadBusinessSource,
): string | undefined {
  const trimmed = item.contextLocationId?.trim();
  return trimmed ? trimmed : undefined;
}

export async function loadBusinessLocationsGroupedByBusinessId(
  prisma: Pick<PrismaClient, 'businessLocation'>,
  businessIds: readonly string[],
): Promise<Map<string, BusinessLocation[]>> {
  const uniqueIds = [...new Set(businessIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  if (typeof prisma.businessLocation?.findMany !== 'function') {
    return new Map();
  }

  const rows = await prisma.businessLocation.findMany({
    where: { businessId: { in: uniqueIds } },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });

  const map = new Map<string, BusinessLocation[]>();
  for (const row of rows) {
    const list = map.get(row.businessId) ?? [];
    list.push(row);
    map.set(row.businessId, list);
  }
  return map;
}

export function normalizePublicBusinessListItems<
  T extends { id: string } & PublicPhysicalReadBusinessSource,
>(
  items: readonly T[],
  locationsByBusinessId: ReadonlyMap<string, BusinessLocation[]>,
): WithPublicPhysicalGeoFields<T>[] {
  return items.map((item) => {
    const locations = locationsByBusinessId.get(item.id) ?? [];
    const contextLocationId = readContextLocationIdFromListItem(item);
    return applyPublicPhysicalReadProjection(item, item, locations, contextLocationId);
  }) as WithPublicPhysicalGeoFields<T>[];
}

/** Favorites / nested business: primary branch only (Business-grain). */
export function normalizeFavoriteBusinessPhysical<
  T extends { id: string } & PublicPhysicalReadBusinessSource,
>(business: T, locations: BusinessLocation[]): WithPublicPhysicalGeoFields<T> {
  return applyPublicPhysicalReadProjection(business, business, locations, undefined);
}

export type BusinessLocationPhysicalReadSelect = {
  id: true;
  businessId: true;
  cityId: true;
  address: true;
  latitude: true;
  longitude: true;
  phone: true;
  whatsapp: true;
  instagram: true;
  website: true;
  workHours: true;
  isPrimary: true;
  createdAt: true;
};

export const businessLocationPhysicalReadSelect = {
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
  isPrimary: true,
  createdAt: true,
} satisfies Prisma.BusinessLocationSelect;
