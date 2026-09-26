import type { PrismaClient } from '@prisma/client';

/** City + contact mirror only (A.9.4.4C1 — geo mirror no longer required in production). */
export async function assertPrimaryBusinessCompatibilityParity(
  prisma: Pick<PrismaClient, '$queryRaw'>,
  businessId: string,
): Promise<void> {
  const mismatches = await prisma.$queryRaw<Array<{ field: string; n: bigint }>>`
    SELECT 'cityId' AS field, COUNT(*)::bigint AS n
    FROM "Business" b
    JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
    WHERE b."id" = ${businessId} AND b."cityId" IS DISTINCT FROM bl."cityId"
    UNION ALL
    SELECT 'phone', COUNT(*)::bigint
    FROM "Business" b
    JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
    WHERE b."id" = ${businessId} AND b."phone" IS DISTINCT FROM bl."phone"`;
  for (const row of mismatches) {
    if (Number(row.n) > 0) {
      throw new Error(`Primary compatibility mismatch on ${row.field} for business ${businessId}`);
    }
  }
}

export async function assertPrimaryBusinessLocationParity(
  prisma: Pick<PrismaClient, '$queryRaw'>,
  businessId: string,
): Promise<void> {
  const mismatches = await prisma.$queryRaw<Array<{ field: string; n: bigint }>>`
    SELECT 'cityId' AS field, COUNT(*)::bigint AS n
    FROM "Business" b
    JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
    WHERE b."id" = ${businessId} AND b."cityId" IS DISTINCT FROM bl."cityId"
    UNION ALL
    SELECT 'address', COUNT(*)::bigint
    FROM "Business" b
    JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
    WHERE b."id" = ${businessId} AND b."address" IS DISTINCT FROM bl."address"
    UNION ALL
    SELECT 'latitude', COUNT(*)::bigint
    FROM "Business" b
    JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
    WHERE b."id" = ${businessId} AND b."latitude" IS DISTINCT FROM bl."latitude"
    UNION ALL
    SELECT 'longitude', COUNT(*)::bigint
    FROM "Business" b
    JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
    WHERE b."id" = ${businessId} AND b."longitude" IS DISTINCT FROM bl."longitude"
    UNION ALL
    SELECT 'phone', COUNT(*)::bigint
    FROM "Business" b
    JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
    WHERE b."id" = ${businessId} AND b."phone" IS DISTINCT FROM bl."phone"`;
  for (const row of mismatches) {
    if (Number(row.n) > 0) {
      throw new Error(`Primary parity mismatch on ${row.field} for business ${businessId}`);
    }
  }
}

export async function assertPrimaryGeoParity(
  prisma: Pick<PrismaClient, '$queryRaw'>,
  businessId: string,
): Promise<void> {
  const drift = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*)::bigint AS n
    FROM "Business" b
    JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
    WHERE b."id" = ${businessId}
      AND b."location" IS NOT NULL AND bl."location" IS NOT NULL
      AND ST_Distance(b."location", bl."location") > 0.5`;
  if (Number(drift[0]?.n ?? 0) > 0) {
    throw new Error(`Primary geo drift for business ${businessId}`);
  }
}
