import { Prisma } from '@prisma/client';

/**
 * Stage 6.12A.7.9.3A — BusinessLocation.cityId is authoritative for public discovery city C.
 * Business.cityId remains legacy/parent metadata (onboarding, admin) — not physical presence.
 *
 * Do not encode `Business.cityId = C OR branch.cityId = C` as the production predicate.
 */

/** @deprecated Pre-A.7.9.3A parent-city filter; tests/docs only. */
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

/** Canonical public catalog city membership (A.7.9.3A+). */
export function businessCatalogDiscoveryCityScope(
  cityId: string,
): Prisma.BusinessWhereInput {
  return businessPhysicalPresenceInCityScope(cityId);
}

/** EXISTS branch-in-city for raw SQL on Business alias `b`. */
export function catalogBusinessPhysicalPresenceInCityExistsSql(
  cityId: string,
  businessRef: Prisma.Sql = Prisma.sql`b.id`,
): Prisma.Sql {
  return Prisma.sql`EXISTS (
    SELECT 1
    FROM "BusinessLocation" bl_city
    WHERE bl_city."businessId" = ${businessRef}
      AND bl_city."cityId" = ${cityId}
  )`;
}
