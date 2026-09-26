import { Prisma } from '@prisma/client';

/**
 * Stage 6.12A.7.9.3A — BusinessLocation.cityId is authoritative for public discovery city C.
 *
 * Do not encode parent Business city as physical presence.
 */

const WGS84_LAT = { gte: -90, lte: 90 } as const;
const WGS84_LNG = { gte: -180, lte: 180 } as const;

/**
 * Branch stored coordinates suitable for map display (matches legacy Business guard + PostGIS readiness).
 * Geography `location` is DB-trigger-derived from valid lat/lng pairs.
 */
export const businessLocationMapReadyCoordinateWhere: Prisma.BusinessLocationWhereInput = {
  latitude: { not: null, ...WGS84_LAT },
  longitude: { not: null, ...WGS84_LNG },
  NOT: {
    AND: [{ latitude: 0 }, { longitude: 0 }],
  },
};

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

/** forMap without bbox: at least one map-ready branch in city C (A.9.3.2b). */
export function businessMapReadyBranchInCityScope(cityId: string): Prisma.BusinessWhereInput {
  return {
    locations: {
      some: {
        cityId,
        ...businessLocationMapReadyCoordinateWhere,
      },
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
