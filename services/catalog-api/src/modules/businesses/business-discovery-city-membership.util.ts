import type { Prisma } from '@prisma/client';

/**
 * Stage 6.12A.7.9.1 — city membership policy foundation (documentation + reuse only).
 *
 * Production list/search/category/nearest/promotions filters are unchanged in A.7.9.1.
 *
 * Long-term: BusinessLocation.cityId is authoritative for physical presence in a city.
 * Business.cityId remains a legacy/parent compatibility field during migration.
 *
 * A.7.9.3 must decide safe cutover/fallback — do not permanently encode
 * `Business.cityId = C OR branch.cityId = C` as the final architecture here.
 */

/** Current production catalog city scope (legacy parent city on Business). */
export function legacyBusinessCatalogCityScope(cityId: string): Prisma.BusinessWhereInput {
  return { cityId };
}

/** Physical presence: at least one BusinessLocation in the requested city. */
export function businessPhysicalPresenceInCityScope(
  cityId: string,
): Prisma.BusinessWhereInput {
  return {
    locations: {
      some: { cityId },
    },
  };
}
