import { ConflictException } from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import {
  BusinessLocationLastDeleteBlockedCode,
  BusinessLocationPrimaryDeleteBlockedCode,
  BusinessLocationPrimaryInvariantBrokenCode,
} from '../../common/utils/business-location-invariant.util';
import { runBusinessLocationIntegrity } from '../../common/utils/business-location-integrity-repair.util';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { BusinessLocationService } from './business-location.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertPrimaryBusinessLocationParity,
} from './business-location-parity.test-util';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { specCreateInitialPrimary, testPrimaryPhysical, createTestBusinessWithPrimary } from './business-with-primary.test-fixture';

describe('Stage 6.12A.9.4.2B — BusinessLocation runtime invariant enforcement', () => {
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

  const owner = () =>
    ({ id: fixtureOwnerId, sub: fixtureOwnerId, phone: '+7', role: UserRole.BUSINESS }) as const;

  async function createSlug(prefix: string) {
    return `${prefix}-${randomBytes(5).toString('hex')}`;
  }

  it('first createLocation on zero-location Business becomes primary and syncs city/contact compatibility', async () => {
    if (skip) return;
    const slug = await createSlug('a942b-first');
    const business = await prisma.business.create({
      data: {
        title: 'A942B first location',
        slug,
        categoryId,
        cityId: uralskCityId,
        phone: 'first-phone',
        ownerId: fixtureOwnerId,
        status: 'PENDING',
      },
    });

    try {
      const svc = buildLocationService();
      const created = await svc.createLocation(owner(), business.id, {
        address: 'Branch addr',
        cityId: uralskCityId,
        phone: 'branch-phone',
      });
      expect(created.isPrimary).toBe(true);

      const audit = await runBusinessLocationIntegrity(prisma, 'DRY_RUN');
      expect(audit.zeroLocationCount).toBe(0);

      await assertPrimaryBusinessLocationParity(prisma, business.id);
      const row = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
      expect(row.phone).toBe('branch-phone');
      expect(row.cityId).toBe(uralskCityId);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('parallel first createLocation commits exactly one primary', async () => {
    if (skip) return;
    const slug = await createSlug('a942b-par');
    const business = await prisma.business.create({
      data: {
        title: 'A942B parallel first',
        slug,
        categoryId,
        cityId: uralskCityId,
        ownerId: fixtureOwnerId,
        status: 'PENDING',
      },
    });

    try {
      const svc = buildLocationService();
      const results = await Promise.allSettled([
        svc.createLocation(owner(), business.id, {
          address: 'Branch addr',
          cityId: uralskCityId,
        }),
        svc.createLocation(owner(), business.id, {
          address: 'Branch addr',
          cityId: uralskCityId,
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      expect(fulfilled.length).toBeGreaterThanOrEqual(1);

      const primaries = await prisma.businessLocation.findMany({
        where: { businessId: business.id, isPrimary: true },
      });
      expect(primaries).toHaveLength(1);

      const all = await prisma.businessLocation.findMany({ where: { businessId: business.id } });
      expect(all.length).toBeGreaterThanOrEqual(1);
      expect(all.some((row) => !row.isPrimary)).toBe(fulfilled.length > 1);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('delete sole location returns LAST_DELETE_BLOCKED', async () => {
    if (skip) return;
    const slug = await createSlug('a942b-last');
    const business = await prisma.business.create({
      data: {
        title: 'A942B last delete',
        slug,
        categoryId,
        cityId: uralskCityId,
        ownerId: fixtureOwnerId,
        status: 'ACTIVE',
      },
    });
    await specCreateInitialPrimary(primaryLocation, prisma, business.id, business.cityId, 'Only branch');

    try {
      const svc = buildLocationService();
      const primary = await prisma.businessLocation.findFirstOrThrow({
        where: { businessId: business.id, isPrimary: true },
      });
      await expect(svc.deleteLocation(owner(), business.id, primary.id)).rejects.toMatchObject({
        response: { code: BusinessLocationLastDeleteBlockedCode },
      });
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('delete primary with secondary returns PRIMARY_DELETE_BLOCKED', async () => {
    if (skip) return;
    const slug = await createSlug('a942b-delpri');
    const business = await prisma.business.create({
      data: {
        title: 'A942B del primary',
        slug,
        categoryId,
        cityId: uralskCityId,
        ownerId: fixtureOwnerId,
        status: 'ACTIVE',
      },
    });
    await specCreateInitialPrimary(primaryLocation, prisma, business.id, business.cityId, 'Primary addr');
    const svc = buildLocationService();
    await svc.createLocation(owner(), business.id, {
      address: 'Branch addr',
      cityId: aktobeCityId,
    });
    const primary = await prisma.businessLocation.findFirstOrThrow({
      where: { businessId: business.id, isPrimary: true },
    });

    try {
      await expect(svc.deleteLocation(owner(), business.id, primary.id)).rejects.toMatchObject({
        response: { code: BusinessLocationPrimaryDeleteBlockedCode },
      });
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('set-primary on zero-primary corrupt Business returns invariant broken', async () => {
    if (skip) return;
    const slug = await createSlug('a942b-zp-set');
    const business = await prisma.business.create({
      data: {
        title: 'A942B zero primary set',
        slug,
        categoryId,
        cityId: uralskCityId,
        ownerId: fixtureOwnerId,
        status: 'PENDING',
      },
    });
    const branch = await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: uralskCityId,
        isPrimary: false,
      },
    });

    try {
      const svc = buildLocationService();
      await expect(svc.setPrimaryLocation(owner(), business.id, branch.id)).rejects.toMatchObject({
        response: { code: BusinessLocationPrimaryInvariantBrokenCode },
      });
      await expect(svc.setPrimaryLocation(owner(), business.id, branch.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
    } finally {
      await prisma.businessLocation.deleteMany({ where: { businessId: business.id } });
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('concurrent set-primary ends with exactly one primary', async () => {
    if (skip) return;
    const slug = await createSlug('a942b-sp-conc');
    const business = await prisma.business.create({
      data: {
        title: 'A942B set-primary concurrent',
        slug,
        categoryId,
        cityId: uralskCityId,
        ownerId: fixtureOwnerId,
        status: 'ACTIVE',
      },
    });
    await specCreateInitialPrimary(primaryLocation, prisma, business.id, business.cityId, 'Primary base');
    const svc = buildLocationService();
    const l2 = await svc.createLocation(owner(), business.id, {
      address: 'Branch addr',
      cityId: aktobeCityId,
    });
    const l3 = await svc.createLocation(owner(), business.id, {
      address: 'Branch addr',
      cityId: aktobeCityId,
    });

    try {
      await Promise.allSettled([
        svc.setPrimaryLocation(owner(), business.id, l2.id),
        svc.setPrimaryLocation(owner(), business.id, l3.id),
      ]);

      const primaries = await prisma.businessLocation.findMany({
        where: { businessId: business.id, isPrimary: true },
      });
      expect(primaries).toHaveLength(1);
      await assertPrimaryBusinessLocationParity(prisma, business.id);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });
});
