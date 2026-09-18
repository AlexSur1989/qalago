import { Prisma, PrismaClient } from '@prisma/client';

/** Thrown inside interactive transactions to abort and roll back test fixtures. */
export const POSTGIS_TEST_ROLLBACK = '__POSTGIS_INTEGRATION_TEST_ROLLBACK__';

export type PostgisIntegrationDb = Pick<
  PrismaClient,
  '$transaction' | '$queryRaw' | 'business'
>;

/**
 * Runs fn inside a Prisma interactive transaction. All DB writes/reads in fn must use `tx`.
 * Abort with throw new Error(POSTGIS_TEST_ROLLBACK) to roll back without failing the test.
 */
export async function withPostgisIntegrationTransaction<T>(
  prisma: PostgisIntegrationDb,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T | undefined> {
  try {
    return await prisma.$transaction(async (tx) => fn(tx));
  } catch (e) {
    if (e instanceof Error && e.message === POSTGIS_TEST_ROLLBACK) {
      return undefined;
    }
    throw e;
  }
}

/** Slug prefixes reserved for PostGIS integration fixtures (see stage-6-11c5c / c5d specs). */
export const POSTGIS_INTEGRATION_SLUG_PREFIXES = [
  'c5c-trigger-',
  'c5d-null-loc-',
] as const;

/**
 * Safety net: remove only rows created by PostGIS integration tests (deterministic slug prefixes).
 * Does not touch seed/QA catalog rows.
 */
export async function deletePostgisIntegrationFixtures(
  prisma: Pick<PrismaClient, 'business'>,
): Promise<number> {
  const result = await prisma.business.deleteMany({
    where: {
      OR: POSTGIS_INTEGRATION_SLUG_PREFIXES.map((prefix) => ({
        slug: { startsWith: prefix },
      })),
    },
  });
  return result.count;
}
