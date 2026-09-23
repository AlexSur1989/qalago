/** Mocks `business.count` alongside `findMany` for catalog list tests (6.11B.5+). */
export function withBusinessListCount<T extends Record<string, unknown>>(
  prisma: T,
  total: number,
): T {
  const business = (prisma.business ?? {}) as Record<string, unknown>;
  return {
    ...prisma,
    business: {
      ...business,
      count: jest.fn().mockResolvedValue(total),
    },
    $queryRaw: (prisma as { $queryRaw?: jest.Mock }).$queryRaw ?? jest.fn().mockResolvedValue([]),
    businessLocation: (prisma as { businessLocation?: { findMany: jest.Mock } }).businessLocation ?? {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
}
