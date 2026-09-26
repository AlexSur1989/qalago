import type { Prisma, PrismaClient } from '@prisma/client';
import { findPrimaryBusinessLocationCityId } from './primary-business-location.util';

type CityDb = Pick<PrismaClient, 'businessLocation'>;

/**
 * Stage 6.12A.9.4.5C — business context city for reporting/moderation/audit (not Business.cityId mirror).
 */
export async function resolveBusinessPrimaryCityId(
  db: CityDb | Prisma.TransactionClient,
  businessId: string,
): Promise<string | null> {
  return findPrimaryBusinessLocationCityId(db, businessId);
}

export async function resolveBusinessAuditCityId(
  db: CityDb | Prisma.TransactionClient,
  businessId: string,
  explicitCityId?: string | null,
): Promise<string | null> {
  const explicit = explicitCityId?.trim();
  if (explicit) return explicit;
  return resolveBusinessPrimaryCityId(db, businessId);
}

/** Benchmark / market membership: business present in city via any BusinessLocation. */
export function businessHasLocationInCityWhere(cityId: string): Prisma.BusinessWhereInput {
  return {
    locations: { some: { cityId } },
  };
}
