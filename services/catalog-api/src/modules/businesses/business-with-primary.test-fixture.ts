import { Prisma, type PrismaClient } from '@prisma/client';
import { createBusinessWithInitialPrimaryInTx } from '../../common/utils/business-primary-location-aggregate.util';
import type { AuthoritativePrimaryPhysicalInput } from '../../common/utils/business-primary-location.util';
import type { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';

/** Post-C4 test helper: Business shell + exactly one primary BL (C4A fixture invariant). */
export function testPrimaryPhysical(
  cityId: string,
  address: string,
  partial?: Record<string, unknown>,
): AuthoritativePrimaryPhysicalInput {
  const rawLat = partial?.latitude;
  const rawLng = partial?.longitude;
  const lat =
    rawLat != null && typeof rawLat === 'number'
      ? new Prisma.Decimal(rawLat)
      : (rawLat as AuthoritativePrimaryPhysicalInput['latitude']) ?? null;
  const lng =
    rawLng != null && typeof rawLng === 'number'
      ? new Prisma.Decimal(rawLng)
      : (rawLng as AuthoritativePrimaryPhysicalInput['longitude']) ?? null;
  const { latitude: _lat, longitude: _lng, ...restPartial } = partial ?? {};
  return {
    cityId,
    address,
    latitude: lat,
    longitude: lng,
    locationSource: null,
    workHours: null,
    phone: null,
    whatsapp: null,
    instagram: null,
    website: null,
    ...(restPartial as Partial<AuthoritativePrimaryPhysicalInput>),
  };
}

export async function specPrimaryLocation(
  prisma: Pick<PrismaClient, 'businessLocation'>,
  businessId: string,
) {
  return prisma.businessLocation.findFirstOrThrow({
    where: { businessId, isPrimary: true },
  });
}

export type TestBusinessBrandInput = Prisma.BusinessUncheckedCreateInput;

/** Adds primary BL to an existing Business shell (post-C4 createInitialPrimary signature). */
export async function specCreateInitialPrimary(
  primaryLocation: BusinessPrimaryLocationService,
  client: PrismaClient | Prisma.TransactionClient,
  businessId: string,
  cityId: string,
  address: string,
  partial?: Record<string, unknown>,
) {
  return primaryLocation.createInitialPrimary(
    client as Prisma.TransactionClient,
    businessId,
    testPrimaryPhysical(cityId, address, partial),
  );
}

export async function createTestBusinessWithPrimary(
  prisma: Pick<PrismaClient, '$transaction'>,
  params: {
    brand: TestBusinessBrandInput;
    primaryPhysical: AuthoritativePrimaryPhysicalInput;
  },
) {
  return prisma.$transaction((tx) => createBusinessWithInitialPrimaryInTx(tx, params));
}
