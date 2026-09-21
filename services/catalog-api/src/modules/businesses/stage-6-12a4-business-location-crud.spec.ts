import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BusinessPermission, PrismaClient, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { BusinessLocationService } from './business-location.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertPrimaryBusinessLocationParity,
  assertPrimaryGeoParity,
} from './business-location-parity.test-util';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';

describe('Stage 6.12A.4 — BusinessLocation management API', () => {
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

  function buildBusinessesService(ownerId = fixtureOwnerId) {
    const cityScope = {
      resolveCityId: jest.fn().mockResolvedValue(uralskCityId),
    } as unknown as CityScopeService;
    const subDeps = createMockSubcategoryDeps();
    return new BusinessesService(
      prisma as unknown as PrismaService,
      cityScope,
      asBusinessAccessService(createMockBusinessAccess({ ownerId })),
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

  async function createFixtureBusiness(slugPrefix: string) {
    const slug = `${slugPrefix}-${randomBytes(5).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: `A12A4 ${slugPrefix}`,
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

  it('lists locations with primary first and deterministic secondary order', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('a12a4-list');
    const svc = buildLocationService();
    const secondary = await svc.createLocation(owner(), business.id, {
      cityId: aktobeCityId,
      address: 'Aktobe branch',
    });
    const listed = await svc.listLocations(owner(), business.id);
    expect(listed.items.length).toBeGreaterThanOrEqual(2);
    expect(listed.items[0]?.isPrimary).toBe(true);
    expect(listed.items.some((i) => i.id === secondary.id)).toBe(true);
    await prisma.business.delete({ where: { id: business.id } });
  });

  it('get location rejects wrong businessId scope', async () => {
    if (skip) return;
    const a = await createFixtureBusiness('a12a4-scope-a');
    const b = await createFixtureBusiness('a12a4-scope-b');
    const primaryB = await prisma.businessLocation.findFirstOrThrow({
      where: { businessId: b.id, isPrimary: true },
    });
    const svc = buildLocationService();
    await expect(svc.getLocation(owner(), a.id, primaryB.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await prisma.business.deleteMany({ where: { id: { in: [a.id, b.id] } } });
  });

  it('creates cross-city secondary without mutating legacy Business fields', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('a12a4-create-sec');
    const before = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    const svc = buildLocationService();
    const secondary = await svc.createLocation(owner(), business.id, {
      cityId: aktobeCityId,
      address: 'Aktobe secondary',
      phone: 'aktobe-phone',
    });
    const after = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    expect(secondary.isPrimary).toBe(false);
    expect(secondary.cityId).toBe(aktobeCityId);
    expect(after.cityId).toBe(before.cityId);
    expect(after.address).toBe(before.address);
    expect(after.phone).toBe(before.phone);
    expect(await prisma.businessLocation.count({ where: { businessId: business.id } })).toBe(2);
    await prisma.business.delete({ where: { id: business.id } });
  });

  it('patches secondary without changing Business or primary', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('a12a4-patch-sec');
    const svc = buildLocationService();
    const secondary = await svc.createLocation(owner(), business.id, {
      cityId: aktobeCityId,
      address: 'Before secondary',
    });
    const primaryBefore = await prisma.businessLocation.findFirstOrThrow({
      where: { businessId: business.id, isPrimary: true },
    });
    const businessBefore = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });

    await svc.updateLocation(owner(), business.id, secondary.id, {
      address: 'After secondary',
      phone: 'sec-only-phone',
    });

    const businessAfter = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    const primaryAfter = await prisma.businessLocation.findUniqueOrThrow({
      where: { id: primaryBefore.id },
    });
    const secondaryAfter = await prisma.businessLocation.findUniqueOrThrow({
      where: { id: secondary.id },
    });
    expect(secondaryAfter.address).toBe('After secondary');
    expect(secondaryAfter.phone).toBe('sec-only-phone');
    expect(primaryAfter.address).toBe(primaryBefore.address);
    expect(businessAfter.address).toBe(businessBefore.address);
    expect(businessAfter.phone).toBe(businessBefore.phone);
    await prisma.business.delete({ where: { id: business.id } });
  });

  it('patches primary and syncs legacy Business atomically', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('a12a4-patch-primary');
    const svc = buildLocationService();
    const primary = await prisma.businessLocation.findFirstOrThrow({
      where: { businessId: business.id, isPrimary: true },
    });
    await svc.updateLocation(owner(), business.id, primary.id, {
      address: 'Primary updated via location API',
      phone: 'primary-via-api',
    });
    await assertPrimaryBusinessLocationParity(prisma, business.id);
    const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    expect(businessRow.address).toBe('Primary updated via location API');
    expect(businessRow.phone).toBe('primary-via-api');
    await prisma.business.delete({ where: { id: business.id } });
  });

  it('legacy PATCH Business still syncs primary and leaves secondaries unchanged', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('a12a4-legacy');
    const bizSvc = buildBusinessesService();
    const locSvc = buildLocationService();
    const secondary = await locSvc.createLocation(owner(), business.id, {
      cityId: aktobeCityId,
      address: 'Secondary frozen',
    });
    await bizSvc.update(business.id, owner(), { phone: 'legacy-patch-phone' });
    await assertPrimaryBusinessLocationParity(prisma, business.id);
    const secondaryAfter = await prisma.businessLocation.findUniqueOrThrow({
      where: { id: secondary.id },
    });
    expect(secondaryAfter.address).toBe('Secondary frozen');
    const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    expect(businessRow.phone).toBe('legacy-patch-phone');
    await prisma.business.delete({ where: { id: business.id } });
  });

  it('set-primary switches primary and syncs Business including cross-city cityId', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('a12a4-set-primary');
    const svc = buildLocationService();
    const secondary = await svc.createLocation(owner(), business.id, {
      cityId: aktobeCityId,
      address: 'Aktobe will become primary',
      phone: 'aktobe-primary-phone',
      latitude: 50.2839,
      longitude: 57.167,
    });
    await svc.setPrimaryLocation(owner(), business.id, secondary.id);
    const primaries = await prisma.businessLocation.findMany({
      where: { businessId: business.id, isPrimary: true },
    });
    expect(primaries).toHaveLength(1);
    expect(primaries[0]?.id).toBe(secondary.id);
    const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    expect(businessRow.cityId).toBe(aktobeCityId);
    expect(businessRow.address).toBe('Aktobe will become primary');
    await assertPrimaryBusinessLocationParity(prisma, business.id);
    await assertPrimaryGeoParity(prisma, business.id);
    await prisma.business.delete({ where: { id: business.id } });
  });

  it('set-primary on already-primary location is idempotent', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('a12a4-idempotent');
    const svc = buildLocationService();
    const primary = await prisma.businessLocation.findFirstOrThrow({
      where: { businessId: business.id, isPrimary: true },
    });
    const before = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    await svc.setPrimaryLocation(owner(), business.id, primary.id);
    const after = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    expect(after.cityId).toBe(before.cityId);
    expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime());
    await prisma.business.delete({ where: { id: business.id } });
  });

  it('rejects invalid city on create', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('a12a4-bad-city');
    const svc = buildLocationService();
    await expect(
      svc.createLocation(owner(), business.id, {
        cityId: 'nonexistent-city-id',
        address: 'Nowhere',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await prisma.business.delete({ where: { id: business.id } });
  });

  it('rejects invalid coordinates on create', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('a12a4-bad-coords');
    const svc = buildLocationService();
    await expect(
      svc.createLocation(owner(), business.id, {
        cityId: uralskCityId,
        address: 'Bad coords',
        latitude: 95,
        longitude: 51.3865,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await prisma.business.delete({ where: { id: business.id } });
  });

  async function upsertManagerUser(userId: string, phoneSuffix: string) {
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        phone: `+7700${phoneSuffix}`,
        role: UserRole.USER,
      },
      update: {},
    });
  }

  it('manager without BUSINESS_PROFILE_EDIT cannot create location', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('a12a4-mgr-deny');
    const managerId = `mgr-deny-${randomBytes(3).toString('hex')}`;
    await upsertManagerUser(managerId, '111001');
    await prisma.businessMembership.create({
      data: {
        userId: managerId,
        businessId: business.id,
        role: 'MANAGER',
        status: 'ACTIVE',
        permissions: [],
      },
    });
    const membership = new BusinessMembershipService(
      prisma as unknown as PrismaService,
      {} as never,
      {} as never,
    );
    const access = new BusinessAccessService(
      prisma as unknown as PrismaService,
      {} as CityScopeService,
      membership,
    );
    const svc = new BusinessLocationService(
      prisma as unknown as PrismaService,
      access,
      primaryLocation,
    );
    const manager = {
      id: managerId,
      sub: managerId,
      phone: '+7',
      role: UserRole.BUSINESS,
    };
    await expect(
      svc.createLocation(manager, business.id, {
        cityId: aktobeCityId,
        address: 'Denied',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await prisma.businessMembership.deleteMany({ where: { businessId: business.id, userId: managerId } });
    await prisma.user.delete({ where: { id: managerId } }).catch(() => undefined);
    await prisma.business.delete({ where: { id: business.id } });
  });

  it('manager with BUSINESS_PROFILE_EDIT can create location', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('a12a4-mgr-allow');
    const managerId = `mgr-allow-${randomBytes(3).toString('hex')}`;
    await upsertManagerUser(managerId, '111002');
    await prisma.businessMembership.create({
      data: {
        userId: managerId,
        businessId: business.id,
        role: 'MANAGER',
        status: 'ACTIVE',
        permissions: [BusinessPermission.BUSINESS_PROFILE_EDIT],
      },
    });
    const membership = new BusinessMembershipService(
      prisma as unknown as PrismaService,
      {} as never,
      {} as never,
    );
    const access = new BusinessAccessService(
      prisma as unknown as PrismaService,
      {} as CityScopeService,
      membership,
    );
    const svc = new BusinessLocationService(
      prisma as unknown as PrismaService,
      access,
      primaryLocation,
    );
    const manager = {
      id: managerId,
      sub: managerId,
      phone: '+7',
      role: UserRole.BUSINESS,
    };
    const created = await svc.createLocation(manager, business.id, {
      cityId: aktobeCityId,
      address: 'Manager created',
    });
    expect(created.isPrimary).toBe(false);
    await prisma.businessMembership.deleteMany({
      where: { businessId: business.id, userId: managerId },
    });
    await prisma.user.delete({ where: { id: managerId } }).catch(() => undefined);
    await prisma.business.delete({ where: { id: business.id } });
  });

  it('set-primary rollback leaves old primary and Business unchanged', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('a12a4-rollback');
    const locSvc = buildLocationService();
    const secondary = await locSvc.createLocation(owner(), business.id, {
      cityId: aktobeCityId,
      address: 'Rollback secondary',
    });
    const brokenPrimary = new BusinessPrimaryLocationService();
    jest
      .spyOn(brokenPrimary, 'syncBusinessFromPrimaryLocationRecord')
      .mockRejectedValueOnce(new Error('switch failed'));

    const access = asBusinessAccessService(createMockBusinessAccess({ ownerId: fixtureOwnerId }));
    const svc = new BusinessLocationService(
      prisma as unknown as PrismaService,
      access,
      brokenPrimary,
    );

    await expect(svc.setPrimaryLocation(owner(), business.id, secondary.id)).rejects.toThrow(
      'switch failed',
    );

    const primaries = await prisma.businessLocation.findMany({
      where: { businessId: business.id, isPrimary: true },
    });
    expect(primaries).toHaveLength(1);
    expect(primaries[0]?.cityId).toBe(uralskCityId);
    const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    expect(businessRow.cityId).toBe(uralskCityId);
    await assertPrimaryBusinessLocationParity(prisma, business.id);
    await prisma.business.delete({ where: { id: business.id } });
  });
});
