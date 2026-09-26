import type { PrismaClient } from '@prisma/client';

/** BL-native physical hygiene counts (A.9.4.4C2 — authority is BusinessLocation, not Business geo). */
export type BusinessLocationBlHygieneReport = {
  emptyBlAddressCount: number;
  partialCoordinatePairCount: number;
  invalidLatitudeCount: number;
  invalidLongitudeCount: number;
  validCoordsNullGeographyCount: number;
  unexpectedGeographyWithoutCoordsCount: number;
  geographyCoordinateMismatchCount: number;
  /** Rows whose cityId does not resolve via FK (should be 0 when FK enforced). */
  invalidBlCityFkCount: number;
  pass: boolean;
};

type DbClient = Pick<PrismaClient, '$queryRaw'>;

const GEO_COORD_MISMATCH_METERS = 0.5;

export async function collectBusinessLocationBlHygieneReport(
  prisma: DbClient,
): Promise<BusinessLocationBlHygieneReport> {
  const [emptyAddress] = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*)::bigint AS n
    FROM "BusinessLocation" bl
    WHERE bl."address" IS NULL OR TRIM(bl."address") = ''`;

  const [partialPair] = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*)::bigint AS n
    FROM "BusinessLocation" bl
    WHERE (bl."latitude" IS NULL) <> (bl."longitude" IS NULL)`;

  const [invalidLat] = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*)::bigint AS n
    FROM "BusinessLocation" bl
    WHERE bl."latitude" IS NOT NULL
      AND (bl."latitude"::float8 < -90 OR bl."latitude"::float8 > 90)`;

  const [invalidLng] = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*)::bigint AS n
    FROM "BusinessLocation" bl
    WHERE bl."longitude" IS NOT NULL
      AND (bl."longitude"::float8 < -180 OR bl."longitude"::float8 > 180)`;

  const [validCoordsNullGeo] = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*)::bigint AS n
    FROM "BusinessLocation" bl
    WHERE bl."latitude" IS NOT NULL AND bl."longitude" IS NOT NULL
      AND NOT (bl."latitude"::float8 = 0 AND bl."longitude"::float8 = 0)
      AND bl."latitude"::float8 >= -90 AND bl."latitude"::float8 <= 90
      AND bl."longitude"::float8 >= -180 AND bl."longitude"::float8 <= 180
      AND bl."location" IS NULL`;

  const [unexpectedGeoNoCoords] = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*)::bigint AS n
    FROM "BusinessLocation" bl
    WHERE (bl."latitude" IS NULL OR bl."longitude" IS NULL)
      AND bl."location" IS NOT NULL`;

  const [geoMismatch] = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*)::bigint AS n
    FROM "BusinessLocation" bl
    WHERE bl."location" IS NOT NULL
      AND bl."latitude" IS NOT NULL AND bl."longitude" IS NOT NULL
      AND bl."latitude"::float8 >= -90 AND bl."latitude"::float8 <= 90
      AND bl."longitude"::float8 >= -180 AND bl."longitude"::float8 <= 180
      AND NOT (bl."latitude"::float8 = 0 AND bl."longitude"::float8 = 0)
      AND ST_Distance(
        bl."location",
        ST_SetSRID(
          ST_MakePoint(bl."longitude"::float8, bl."latitude"::float8),
          4326
        )::geography
      ) > ${GEO_COORD_MISMATCH_METERS}`;

  const [invalidCityFk] = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*)::bigint AS n
    FROM "BusinessLocation" bl
    WHERE NOT EXISTS (SELECT 1 FROM "City" c WHERE c."id" = bl."cityId")`;

  const emptyBlAddressCount = Number(emptyAddress?.n ?? 0);
  const partialCoordinatePairCount = Number(partialPair?.n ?? 0);
  const invalidLatitudeCount = Number(invalidLat?.n ?? 0);
  const invalidLongitudeCount = Number(invalidLng?.n ?? 0);
  const validCoordsNullGeographyCount = Number(validCoordsNullGeo?.n ?? 0);
  const unexpectedGeographyWithoutCoordsCount = Number(unexpectedGeoNoCoords?.n ?? 0);
  const geographyCoordinateMismatchCount = Number(geoMismatch?.n ?? 0);
  const invalidBlCityFkCount = Number(invalidCityFk?.n ?? 0);

  const pass =
    emptyBlAddressCount === 0 &&
    partialCoordinatePairCount === 0 &&
    invalidLatitudeCount === 0 &&
    invalidLongitudeCount === 0 &&
    validCoordsNullGeographyCount === 0 &&
    unexpectedGeographyWithoutCoordsCount === 0 &&
    geographyCoordinateMismatchCount === 0 &&
    invalidBlCityFkCount === 0;

  return {
    emptyBlAddressCount,
    partialCoordinatePairCount,
    invalidLatitudeCount,
    invalidLongitudeCount,
    validCoordsNullGeographyCount,
    unexpectedGeographyWithoutCoordsCount,
    geographyCoordinateMismatchCount,
    invalidBlCityFkCount,
    pass,
  };
}
