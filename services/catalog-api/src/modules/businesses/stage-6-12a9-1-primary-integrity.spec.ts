import { BadRequestException } from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import {
  collectPrimaryIntegrityReport,
} from '../../common/utils/business-primary-integrity-audit.util';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { BusinessLocationService } from './business-location.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertPrimaryBusinessLocationParity,
} from './business-location-parity.test-util';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';

describe('Stage 6.12A.9.1 — Single-primary integrity hardening', () => {
  const prisma = new PrismaClient();
  const primaryLocation = new BusinessPrimaryLocationService();
  let skip = false;
  let fixtureOwnerId = '';
  let uralskCityId = '';
  let aktobeCityId = '';
  let categoryId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const table = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'BusinessLocation'
        ) AS exists`;
      skip = !table[0]?.exists;
      const user = await prisma.user.findFirst({ select: { id: true } });
      const uralsk = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const aktobe = await prisma.city.findFirst({ where: { slug: 'aktobe' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      if (!user || !uralsk || !aktobe || !category) skip = true;
      else {
        fixtureOwnerId = user.id;
        uralskCityId = uralsk.id;
        aktobeCityId = aktobe.id;
        categoryId = category.id;
      }
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function buildLocationService(ownerId = fixtureOwnerId) {
    return new BusinessLocationService(
      prisma as unknown as PrismaService,
      asBusinessAccessService(createMockBusinessAccess({ ownerId })),
      primaryLocation,
    );
  }

  async function createFixtureBusiness(slugPrefix: string) {
    const slug = `${slugPrefix}-${randomBytes(5).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: `A12A9.1 ${slugPrefix}`,
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Uralsk primary addr',
        phone: 'primary-phone',
        ownerId: fixtureOwnerId,
        status: 'ACTIVE',
        latitude: 51.2278,
        longitude: 51.3865,
      },
    });
    await primaryLocation.createInitialPrimary(prisma, business);
    return business;
  }

  const owner = () =>
    ({ id: fixtureOwnerId, sub: fixtureOwnerId, phone: '+7', role: UserRole.BUSINESS }) as const;

  it('rejects deletion of primary branch via production BusinessLocationService', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('a91-del-primary');
    const svc = buildLocationService();
    const secondary = await svc.createLocation(owner(), business.id, {
      cityId: aktobeCityId,
      address: 'Secondary survives',
    });
    const primary = await prisma.businessLocation.findFirstOrThrow({
      where: { businessId: business.id, isPrimary: true },
    });

    await expect(svc.deleteLocation(owner(), business.id, primary.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(svc.deleteLocation(owner(), business.id, primary.id)).rejects.toThrow(
      /Primary branch cannot be deleted/i,
    );

    const primaries = await prisma.businessLocation.findMany({
      where: { businessId: business.id, isPrimary: true },
    });
    expect(primaries).toHaveLength(1);
    expect(primaries[0]?.id).toBe(primary.id);

    const secondaryAfter = await prisma.businessLocation.findUniqueOrThrow({
      where: { id: secondary.id },
    });
    expect(secondaryAfter.id).toBe(secondary.id);

    const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    expect(businessRow.id).toBe(business.id);

    await prisma.business.delete({ where: { id: business.id } });
  });

  it('concurrent set-primary promotions end with exactly one primary and synced Business', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('a91-concurrent');
    const svc = buildLocationService();
    const l2 = await svc.createLocation(owner(), business.id, {
      cityId: aktobeCityId,
      address: 'Concurrent L2',
      phone: 'l2-phone',
      latitude: 50.2839,
      longitude: 57.167,
    });
    const l3 = await svc.createLocation(owner(), business.id, {
      cityId: aktobeCityId,
      address: 'Concurrent L3',
      phone: 'l3-phone',
      latitude: 50.29,
      longitude: 57.17,
    });

    const results = await Promise.allSettled([
      svc.setPrimaryLocation(owner(), business.id, l2.id),
      svc.setPrimaryLocation(owner(), business.id, l3.id),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    const primaries = await prisma.businessLocation.findMany({
      where: { businessId: business.id, isPrimary: true },
    });
    expect(primaries).toHaveLength(1);
    expect([l2.id, l3.id]).toContain(primaries[0]?.id);

    await assertPrimaryBusinessLocationParity(prisma, business.id);
    const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    const winner = primaries[0]!;
    expect(businessRow.address).toBe(winner.id === l2.id ? 'Concurrent L2' : 'Concurrent L3');

    await prisma.business.delete({ where: { id: business.id } });
  });

  it('read-only primary integrity auditor detects zero-primary invalid fixture', async () => {
    if (skip) return;
    const slug = `a91-zero-primary-${randomBytes(5).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: 'A91 zero primary fixture',
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Invalid no primary',
        ownerId: fixtureOwnerId,
        status: 'PENDING',
      },
    });

    try {
      await prisma.businessLocation.createMany({
        data: [
          { businessId: business.id, cityId: uralskCityId, address: 'Branch A', isPrimary: false },
          { businessId: business.id, cityId: uralskCityId, address: 'Branch B', isPrimary: false },
        ],
      });

      const report = await collectPrimaryIntegrityReport(prisma);
      expect(report.pass).toBe(false);
      expect(report.invalidBusinesses.some((row) => row.businessId === business.id)).toBe(true);
      const invalid = report.invalidBusinesses.find((row) => row.businessId === business.id);
      expect(invalid?.locationCount).toBe(2);
      expect(invalid?.primaryCount).toBe(0);
    } finally {
      await prisma.businessLocation.deleteMany({ where: { businessId: business.id } });
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('read-only primary integrity auditor passes on current database aggregate rules', async () => {
    if (skip) return;
    const report = await collectPrimaryIntegrityReport(prisma);
    expect(report.businessesWithLocationsZeroPrimary).toBe(0);
    expect(report.businessesMultiPrimary).toBe(0);
    expect(report.invalidBusinesses).toHaveLength(0);
    expect(report.pass).toBe(true);
  });
});
