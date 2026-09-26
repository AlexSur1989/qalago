import type { Prisma, PrismaClient } from '@prisma/client';
import { pickPrimaryBusinessLocation } from './primary-business-location.util';

export type PrimaryCityPresentation = {
  id: string;
  slug: string;
  nameRu: string;
  nameKk: string | null;
  timezone: string;
};

const primaryCitySelect = {
  id: true,
  slug: true,
  nameRu: true,
  nameKk: true,
  timezone: true,
} satisfies Prisma.CitySelect;

type PrimaryLocationWithCity = {
  businessId: string;
  cityId: string;
  isPrimary: boolean;
  createdAt: Date;
  id: string;
  city: PrimaryCityPresentation;
};

/**
 * Primary BusinessLocation city for admin/aggregate responses (A.9.4.5D).
 */
export async function loadPrimaryCityPresentationByBusinessId(
  db: Pick<PrismaClient, 'businessLocation'>,
  businessIds: readonly string[],
): Promise<Map<string, PrimaryCityPresentation>> {
  const uniqueIds = [...new Set(businessIds.filter(Boolean))];
  const map = new Map<string, PrimaryCityPresentation>();
  if (uniqueIds.length === 0) {
    return map;
  }

  const rows = await db.businessLocation.findMany({
    where: { businessId: { in: uniqueIds } },
    select: {
      id: true,
      businessId: true,
      cityId: true,
      isPrimary: true,
      createdAt: true,
      city: { select: primaryCitySelect },
    },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });

  const byBusiness = new Map<string, PrimaryLocationWithCity[]>();
  for (const row of rows) {
    const list = byBusiness.get(row.businessId) ?? [];
    list.push(row);
    byBusiness.set(row.businessId, list);
  }

  for (const [businessId, locations] of byBusiness) {
    const primary = pickPrimaryBusinessLocation(locations);
    if (primary?.city) {
      map.set(businessId, primary.city);
    }
  }

  return map;
}

export async function loadPrimaryCityIdByBusinessId(
  db: Pick<PrismaClient, 'businessLocation'>,
  businessId: string,
): Promise<string | null> {
  const map = await loadPrimaryCityPresentationByBusinessId(db, [businessId]);
  const city = map.get(businessId);
  return city?.id ?? null;
}
