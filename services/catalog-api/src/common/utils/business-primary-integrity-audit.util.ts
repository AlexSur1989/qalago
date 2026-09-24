import type { PrismaClient } from '@prisma/client';

export type PrimaryIntegrityInvalidBusiness = {
  businessId: string;
  title: string;
  locationCount: number;
  primaryCount: number;
};

export type PrimaryIntegrityReport = {
  businessesTotal: number;
  businessesWithZeroLocations: number;
  businessesWithLocations: number;
  businessesExactlyOnePrimary: number;
  businessesWithLocationsZeroPrimary: number;
  businessesMultiPrimary: number;
  locationsTotal: number;
  primaryLocations: number;
  secondaryLocations: number;
  invalidBusinesses: PrimaryIntegrityInvalidBusiness[];
  pass: boolean;
};

type DbClient = Pick<PrismaClient, '$queryRaw'>;

/** READ-ONLY primary integrity audit (Stage 6.12A.9.1). No mutations. */
export async function collectPrimaryIntegrityReport(
  prisma: DbClient,
): Promise<PrimaryIntegrityReport> {
  const agg = await prisma.$queryRaw<
    Array<{
      businesses_total: number;
      businesses_with_zero_locations: number;
      businesses_with_locations: number;
      businesses_exactly_one_primary: number;
      businesses_with_locations_zero_primary: number;
      businesses_multi_primary: number;
      locations_total: number;
      primary_locations: number;
      secondary_locations: number;
    }>
  >`
    SELECT
      (SELECT COUNT(*)::int FROM "Business") AS businesses_total,
      (SELECT COUNT(*)::int FROM "Business" b
        WHERE NOT EXISTS (SELECT 1 FROM "BusinessLocation" bl WHERE bl."businessId" = b.id)
      ) AS businesses_with_zero_locations,
      (SELECT COUNT(*)::int FROM "Business" b
        WHERE EXISTS (SELECT 1 FROM "BusinessLocation" bl WHERE bl."businessId" = b.id)
      ) AS businesses_with_locations,
      (SELECT COUNT(*)::int FROM (
        SELECT b.id
        FROM "Business" b
        LEFT JOIN "BusinessLocation" bl ON bl."businessId" = b.id
        GROUP BY b.id
        HAVING SUM(CASE WHEN bl."isPrimary" THEN 1 ELSE 0 END) = 1
      ) t) AS businesses_exactly_one_primary,
      (SELECT COUNT(*)::int FROM (
        SELECT b.id
        FROM "Business" b
        JOIN "BusinessLocation" bl ON bl."businessId" = b.id
        GROUP BY b.id
        HAVING SUM(CASE WHEN bl."isPrimary" THEN 1 ELSE 0 END) = 0
      ) t) AS businesses_with_locations_zero_primary,
      (SELECT COUNT(*)::int FROM (
        SELECT b.id
        FROM "Business" b
        JOIN "BusinessLocation" bl ON bl."businessId" = b.id
        GROUP BY b.id
        HAVING SUM(CASE WHEN bl."isPrimary" THEN 1 ELSE 0 END) > 1
      ) t) AS businesses_multi_primary,
      (SELECT COUNT(*)::int FROM "BusinessLocation") AS locations_total,
      (SELECT COUNT(*)::int FROM "BusinessLocation" WHERE "isPrimary" = true) AS primary_locations,
      (SELECT COUNT(*)::int FROM "BusinessLocation" WHERE "isPrimary" = false) AS secondary_locations`;

  const invalidRows = await prisma.$queryRaw<
    Array<{
      business_id: string;
      title: string;
      location_count: number;
      primary_count: number;
    }>
  >`
    SELECT b.id AS business_id, b.title, COUNT(bl.id)::int AS location_count,
      SUM(CASE WHEN bl."isPrimary" THEN 1 ELSE 0 END)::int AS primary_count
    FROM "Business" b
    JOIN "BusinessLocation" bl ON bl."businessId" = b.id
    GROUP BY b.id, b.title
    HAVING COUNT(bl.id) >= 1
      AND SUM(CASE WHEN bl."isPrimary" THEN 1 ELSE 0 END) <> 1`;

  const row = agg[0]!;
  const invalidBusinesses = invalidRows.map((r) => ({
    businessId: r.business_id,
    title: r.title,
    locationCount: r.location_count,
    primaryCount: r.primary_count,
  }));

  const pass =
    row.businesses_with_locations_zero_primary === 0 && row.businesses_multi_primary === 0;

  return {
    businessesTotal: row.businesses_total,
    businessesWithZeroLocations: row.businesses_with_zero_locations,
    businessesWithLocations: row.businesses_with_locations,
    businessesExactlyOnePrimary: row.businesses_exactly_one_primary,
    businessesWithLocationsZeroPrimary: row.businesses_with_locations_zero_primary,
    businessesMultiPrimary: row.businesses_multi_primary,
    locationsTotal: row.locations_total,
    primaryLocations: row.primary_locations,
    secondaryLocations: row.secondary_locations,
    invalidBusinesses,
    pass,
  };
}

export function formatPrimaryIntegrityReport(report: PrimaryIntegrityReport): string {
  return JSON.stringify(
    {
      readOnly: true,
      stage: '6.12A.9.1',
      ...report,
      invalidBusinesses: report.invalidBusinesses,
    },
    null,
    2,
  );
}
