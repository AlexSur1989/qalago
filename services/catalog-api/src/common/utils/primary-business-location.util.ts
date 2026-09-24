import type { Prisma, PrismaClient } from '@prisma/client';

type LocationRow = {
  id: string;
  cityId: string;
  isPrimary: boolean;
  createdAt: Date;
};

export function pickPrimaryBusinessLocation<T extends LocationRow>(
  locations: readonly T[],
): T | null {
  if (locations.length === 0) return null;
  const primaries = locations.filter((row) => row.isPrimary);
  if (primaries.length === 1) return primaries[0]!;
  if (primaries.length > 1) {
    return [...primaries].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
    )[0]!;
  }
  return [...locations].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  )[0]!;
}

export async function findPrimaryBusinessLocationCityId(
  db: Pick<PrismaClient, 'businessLocation'> | Prisma.TransactionClient,
  businessId: string,
): Promise<string | null> {
  if (!db.businessLocation?.findMany) {
    return null;
  }
  const locations = await db.businessLocation.findMany({
    where: { businessId },
    select: { id: true, cityId: true, isPrimary: true, createdAt: true },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });
  return pickPrimaryBusinessLocation(locations)?.cityId ?? null;
}
