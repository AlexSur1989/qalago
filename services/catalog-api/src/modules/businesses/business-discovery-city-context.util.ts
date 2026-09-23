import { PrismaClient } from '@prisma/client';

/**
 * Stage 6.12A.7.9.3A — deterministic city-scoped discovery context (non-geo lists).
 *
 * Selection per business in city C:
 * 1) primary branch in C if exists
 * 2) else first branch in C by isPrimary DESC, createdAt ASC, id ASC
 */
export async function resolveCityContextLocationIds(
  prisma: Pick<PrismaClient, 'businessLocation'>,
  cityId: string,
  businessIds: readonly string[],
): Promise<Map<string, string>> {
  if (businessIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.businessLocation.findMany({
    where: {
      businessId: { in: [...businessIds] },
      cityId,
    },
    select: {
      id: true,
      businessId: true,
      isPrimary: true,
      createdAt: true,
    },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });

  const map = new Map<string, string>();
  for (const row of rows) {
    if (!map.has(row.businessId)) {
      map.set(row.businessId, row.id);
    }
  }
  return map;
}
