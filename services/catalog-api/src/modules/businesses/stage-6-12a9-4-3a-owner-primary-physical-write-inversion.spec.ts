import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BusinessPermission, PrismaClient, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { lockBusinessAggregateForUpdate } from '../../common/utils/business-location-invariant.util';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { BusinessesService } from './businesses.service';
import { BusinessLocationService } from './business-location.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertPrimaryBusinessLocationParity,
  assertPrimaryGeoParity,
} from './business-location-parity.test-util';

function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('Stage 6.12A.9.4.3A — owner primary physical write inversion', () => {
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

  const owner = () =>
    ({ id: fixtureOwnerId, sub: fixtureOwnerId, phone: '+7', role: UserRole.BUSINESS }) as const;

  function buildBusinessesService(ownerId = fixtureOwnerId, managerPermissions?: BusinessPermission[]) {
    const cityScope = {
      resolveCityId: jest.fn(async (q: { citySlug?: string; cityId?: string }) => {
        if (q.cityId) return q.cityId;
        const city = await prisma.city.findFirst({ where: { slug: q.citySlug ?? 'uralsk' } });
        return city?.id ?? 'missing-city';
      }),
    } as unknown as CityScopeService;
    const subDeps = createMockSubcategoryDeps();
    return new BusinessesService(
      prisma as never,
      cityScope,
      asBusinessAccessService(createMockBusinessAccess({ ownerId, managerPermissions })),
      { createActiveOwnerMembership: jest.fn() } as never,
      {} as PlanLimitsService,
      {} as BusinessPublicContentService,
      asAuditLogService(createMockAuditLog()),
      subDeps.businessSubcategories,
      subDeps.subcategories,
      {} as never,
      primaryLocation,
    );
  }

  function buildLocationService(ownerId = fixtureOwnerId) {
    return new BusinessLocationService(
      prisma as unknown as PrismaService,
      asBusinessAccessService(createMockBusinessAccess({ ownerId })),
      primaryLocation,
    );
  }

  async function createSlug(prefix: string) {
    return `${prefix}-${randomBytes(5).toString('hex')}`;
  }

  it('secondary branch safety: owner PATCH physical updates primary only', async () => {
    if (skip) return;
    const slug = await createSlug('a943a-secondary');
    const svc = buildBusinessesService();
    const locSvc = buildLocationService();
    const business = await prisma.business.create({
      data: {
        title: 'A943A secondary safety',
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Primary addr',
        ownerId: fixtureOwnerId,
        status: 'ACTIVE',
      },
    });
    await primaryLocation.createInitialPrimary(prisma, business);
    const secondary = await locSvc.createLocation(owner(), business.id, {
      cityId: aktobeCityId,
      address: 'Secondary addr',
    });

    try {
      await svc.update(business.id, owner(), { address: 'Primary addr patched' });
      const primary = await prisma.businessLocation.findFirstOrThrow({
        where: { businessId: business.id, isPrimary: true },
      });
      const secondaryAfter = await prisma.businessLocation.findUniqueOrThrow({
        where: { id: secondary.id },
      });
      expect(primary.address).toBe('Primary addr patched');
      expect(secondaryAfter.address).toBe('Secondary addr');

      await locSvc.updateLocation(owner(), business.id, secondary.id, {
        address: 'Secondary addr patched',
      });
      const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
      expect(businessRow.address).toBe('Primary addr patched');
      await assertPrimaryBusinessLocationParity(prisma, business.id);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('set-primary regression: mirror follows promoted primary; PATCH updates new primary', async () => {
    if (skip) return;
    const slug = await createSlug('a943a-set-primary');
    const svc = buildBusinessesService();
    const locSvc = buildLocationService();
    const business = await prisma.business.create({
      data: {
        title: 'A943A set-primary',
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Physical A',
        latitude: 51.2278,
        longitude: 51.3865,
        ownerId: fixtureOwnerId,
        status: 'ACTIVE',
      },
    });
    await primaryLocation.createInitialPrimary(prisma, business);
    const l2 = await locSvc.createLocation(owner(), business.id, {
      cityId: aktobeCityId,
      address: 'Physical B',
      latitude: 50.2839,
      longitude: 57.167,
    });

    try {
      await locSvc.setPrimaryLocation(owner(), business.id, l2.id);
      const afterPromote = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
      expect(afterPromote.address).toBe('Physical B');

      await svc.update(business.id, owner(), { address: 'Physical B patched' });
      const l1 = await prisma.businessLocation.findFirstOrThrow({
        where: { businessId: business.id, isPrimary: false },
      });
      const l2After = await prisma.businessLocation.findUniqueOrThrow({ where: { id: l2.id } });
      expect(l1.address).toBe('Physical A');
      expect(l2After.address).toBe('Physical B patched');
      const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
      expect(businessRow.address).toBe('Physical B patched');
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('multi-city validation uses primary BL cityId, not legacy Business.cityId', async () => {
    if (skip) return;
    const slug = await createSlug('a943a-multicity');
    const svc = buildBusinessesService();
    const business = await prisma.business.create({
      data: {
        title: 'A943A multicity',
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Uralsk mirror',
        latitude: 51.2278,
        longitude: 51.3865,
        ownerId: fixtureOwnerId,
        status: 'ACTIVE',
      },
    });
    await primaryLocation.createInitialPrimary(prisma, business);
    const primary = await prisma.businessLocation.findFirstOrThrow({
      where: { businessId: business.id, isPrimary: true },
    });
    await prisma.businessLocation.update({
      where: { id: primary.id },
      data: {
        cityId: aktobeCityId,
        latitude: 50.2839,
        longitude: 57.167,
        address: 'Aktobe branch',
      },
    });

    try {
      await expect(
        svc.update(business.id, owner(), { latitude: 51.2278, longitude: 51.3865 }),
      ).rejects.toBeInstanceOf(BadRequestException);

      await svc.update(business.id, owner(), { latitude: 50.29, longitude: 57.17 });
      const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
      expect(Number(businessRow.latitude)).toBeCloseTo(50.29, 4);
      await assertPrimaryBusinessLocationParity(prisma, business.id);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('invalid coordinates for primary BL city roll back with 400', async () => {
    if (skip) return;
    const slug = await createSlug('a943a-invalid-coords');
    const svc = buildBusinessesService();
    const business = await prisma.business.create({
      data: {
        title: 'A943A invalid coords',
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Before invalid',
        latitude: 51.2278,
        longitude: 51.3865,
        ownerId: fixtureOwnerId,
        status: 'ACTIVE',
      },
    });
    await primaryLocation.createInitialPrimary(prisma, business);

    try {
      await expect(
        svc.update(business.id, owner(), { latitude: 50.2839, longitude: 57.167 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      const reloaded = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
      expect(reloaded.address).toBe('Before invalid');
      const primary = await prisma.businessLocation.findFirstOrThrow({
        where: { businessId: business.id, isPrimary: true },
      });
      expect(primary.address).toBe('Before invalid');
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('mixed business-level and physical PATCH commits atomically', async () => {
    if (skip) return;
    const slug = await createSlug('a943a-mixed');
    const svc = buildBusinessesService();
    const business = await prisma.business.create({
      data: {
        title: 'Before mixed',
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Mixed addr',
        phone: '111',
        ownerId: fixtureOwnerId,
        status: 'ACTIVE',
      },
    });
    await primaryLocation.createInitialPrimary(prisma, business);

    try {
      await svc.update(business.id, owner(), {
        title: 'After mixed',
        address: 'Mixed addr updated',
        phone: '222',
      });
      const row = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
      const primary = await prisma.businessLocation.findFirstOrThrow({
        where: { businessId: business.id, isPrimary: true },
      });
      expect(row.title).toBe('After mixed');
      expect(row.address).toBe('Mixed addr updated');
      expect(row.phone).toBe('222');
      expect(primary.address).toBe('Mixed addr updated');
      expect(primary.phone).toBe('222');
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('permissions: hours-only manager vs physical profile fields', async () => {
    if (skip) return;
    const slug = await createSlug('a943a-perms');
    const hoursOnly = buildBusinessesService(fixtureOwnerId, [BusinessPermission.BUSINESS_HOURS_EDIT]);
    const business = await prisma.business.create({
      data: {
        title: 'A943A perms',
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Perm addr',
        ownerId: fixtureOwnerId,
        status: 'ACTIVE',
      },
    });
    await primaryLocation.createInitialPrimary(prisma, business);
    const manager = {
      id: 'manager-1',
      sub: 'manager-1',
      phone: '+7',
      role: UserRole.BUSINESS,
    } as const;

    try {
      await hoursOnly.update(business.id, manager, { workHours: { mon: '9-18' } });
      await expect(
        hoursOnly.update(business.id, manager, { address: 'Blocked' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        hoursOnly.update(business.id, manager, { locationSource: 'MANUAL' as never }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('concurrent owner physical PATCH vs set-primary preserves invariants', async () => {
    if (skip) return;
    const slug = await createSlug('a943a-concurrent');
    const svc = buildBusinessesService();
    const locSvc = buildLocationService();
    const business = await prisma.business.create({
      data: {
        title: 'A943A concurrent',
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'L1 primary',
        latitude: 51.2278,
        longitude: 51.3865,
        ownerId: fixtureOwnerId,
        status: 'ACTIVE',
      },
    });
    await primaryLocation.createInitialPrimary(prisma, business);
    const l2 = await locSvc.createLocation(owner(), business.id, {
      cityId: aktobeCityId,
      address: 'L2 secondary',
      latitude: 50.2839,
      longitude: 57.167,
    });

    const lockHeld = createDeferred();
    const releaseLock = createDeferred<void>();

    const lockTx = prisma.$transaction(async (tx) => {
      await lockBusinessAggregateForUpdate(tx, business.id);
      lockHeld.resolve(undefined);
      await releaseLock.promise;
    });

    await lockHeld.promise;

    const patchPromise = svc.update(business.id, owner(), {
      address: 'L1 patched under contention',
    });
    const promotePromise = locSvc.setPrimaryLocation(owner(), business.id, l2.id);

    await new Promise((r) => setTimeout(r, 100));
    releaseLock.resolve(undefined);
    await lockTx;

    await Promise.allSettled([patchPromise, promotePromise]);

    const primaries = await prisma.businessLocation.findMany({
      where: { businessId: business.id, isPrimary: true },
    });
    expect(primaries).toHaveLength(1);
    await assertPrimaryBusinessLocationParity(prisma, business.id);
    await assertPrimaryGeoParity(prisma, business.id);

    const winner = primaries[0]!;
    const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    expect(businessRow.address).toBe(winner.address);

    await prisma.business.delete({ where: { id: business.id } });
  });
});
