import { BusinessStatus, type Prisma } from '@prisma/client';

/** Business physical geo fields that visibility sync must never write (A.9.4.4A). */
export const FORBIDDEN_VISIBILITY_SYNC_BUSINESS_GEO_KEYS = [
  'address',
  'latitude',
  'longitude',
  'locationSource',
] as const;

export type VisibilitySyncBusinessRow = {
  id: string;
  title: string;
  slug: string;
  status: BusinessStatus;
  /** Primary BusinessLocation city (A.9.4.5D). */
  primaryCityId: string | null;
};

export type VisibilitySyncCityRow = {
  id: string;
  slug: string;
  nameRu: string;
};

export type VisibilitySyncPlannedUpdate = {
  businessId: string;
  data: Prisma.BusinessUpdateInput;
  logLine: string;
};

export type VisibilitySyncPlan = {
  updates: VisibilitySyncPlannedUpdate[];
  activated: number;
  skippedUnknownCitySlugs: string[];
};

/**
 * Plans status-only updates for dev visibility sync.
 * Does not read or write coordinates; location repair is out of scope.
 */
export function planVisibilitySyncUpdates(
  businesses: readonly VisibilitySyncBusinessRow[],
  cityById: ReadonlyMap<string, VisibilitySyncCityRow>,
): VisibilitySyncPlan {
  const updates: VisibilitySyncPlannedUpdate[] = [];
  const skippedUnknownCitySlugs: string[] = [];
  let activated = 0;

  for (const business of businesses) {
    const city = business.primaryCityId ? cityById.get(business.primaryCityId) : undefined;
    if (!city) {
      skippedUnknownCitySlugs.push(business.slug);
      continue;
    }

    if (business.status === BusinessStatus.ACTIVE) {
      continue;
    }

    const data: Prisma.BusinessUpdateInput = { status: BusinessStatus.ACTIVE };
    assertVisibilitySyncBusinessUpdateData(data);

    updates.push({
      businessId: business.id,
      data,
      logLine: `[${city.slug}] ACTIVE: ${business.title} (was ${business.status})`,
    });
    activated += 1;
  }

  return { updates, activated, skippedUnknownCitySlugs };
}

/** Guardrail: visibility sync update payloads must be status-only. */
export function assertVisibilitySyncBusinessUpdateData(data: Prisma.BusinessUpdateInput): void {
  for (const key of FORBIDDEN_VISIBILITY_SYNC_BUSINESS_GEO_KEYS) {
    if (key in data && (data as Record<string, unknown>)[key] !== undefined) {
      throw new Error(
        `Visibility sync must not write Business.${key} (A.9.4.4A geo writer retirement)`,
      );
    }
  }
  if ('location' in data && (data as Record<string, unknown>).location !== undefined) {
    throw new Error('Visibility sync must not write Business.location (A.9.4.4A)');
  }
}
