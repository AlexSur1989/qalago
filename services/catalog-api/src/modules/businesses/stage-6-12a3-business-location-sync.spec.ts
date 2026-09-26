import { randomBytes } from 'crypto';
import { UserRole } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { POSTGIS_TEST_ROLLBACK, withPostgisIntegrationTransaction } from './postgis-integration-test.util';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { specCreateInitialPrimary, testPrimaryPhysical, createTestBusinessWithPrimary } from './business-with-primary.test-fixture';

describe('Stage 6.12A.3 — primary location compatibility sync', () => {
  const prisma = new PrismaClient();
  const primaryLocation = new BusinessPrimaryLocationService();
  let skip = false;
  let fixtureOwnerId = '';

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
      if (!user) skip = true;
      else fixtureOwnerId = user.id;
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function buildBusinessesService(ownerId = 'owner-1') {
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

  it('admin create produces exactly one primary location with field parity (transaction rollback)', async () => {
    if (skip) return;
    const city = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
    const category = await prisma.category.findFirst({ select: { id: true } });
    if (!city || !category) return;

    const admin = { id: fixtureOwnerId, sub: fixtureOwnerId, phone: '+7', role: UserRole.ADMIN };

    try {
      await withPostgisIntegrationTransaction(prisma, async (tx) => {
        const localSvc = new BusinessesService(
          { ...prisma, $transaction: async (fn: (t: typeof tx) => unknown) => fn(tx) } as never,
          {
            resolveCityId: jest.fn().mockResolvedValue(city.id),
          } as never,
          asBusinessAccessService(createMockBusinessAccess()),
          {
            createActiveOwnerMembership: jest.fn(),
          } as never,
          {} as PlanLimitsService,
          {} as BusinessPublicContentService,
          asAuditLogService(createMockAuditLog()),
          createMockSubcategoryDeps().businessSubcategories,
          createMockSubcategoryDeps().subcategories,
          {} as never,
          primaryLocation,
        );

        const business = await localSvc.create(admin, {
          title: 'A12A3 Admin Create',
          categoryId: category.id,
          citySlug: 'uralsk',
          address: 'Admin addr 1',
          phone: '+77001234567',
        });

        const locations = await tx.businessLocation.findMany({ where: { businessId: business.id } });
        expect(locations).toHaveLength(1);
        expect(locations[0]?.isPrimary).toBe(true);
        expect(locations[0]?.address).toBe('Admin addr 1');
        expect(locations[0]?.phone).toBe('+77001234567');
        throw new Error(POSTGIS_TEST_ROLLBACK);
      });
    } finally {
      await prisma.business.deleteMany({ where: { title: 'A12A3 Admin Create' } });
    }
  });

  it('PATCH physical fields sync primary; brand-only PATCH does not touch location updatedAt unnecessarily', async () => {
    if (skip) return;
    const city = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
    const category = await prisma.category.findFirst({ select: { id: true } });
    if (!city || !category) return;

    const slug = `a12a3-patch-${randomBytes(5).toString('hex')}`;
    const owner = { id: fixtureOwnerId, sub: fixtureOwnerId, phone: '+7', role: UserRole.BUSINESS };
    const svc = buildBusinessesService(fixtureOwnerId);

    const business = await prisma.business.create({
      data: {
        title: 'Patch sync',
        slug,
        categoryId: category.id,
        cityId: city.id,
        phone: '111',
        ownerId: owner.id,
        status: 'ACTIVE',
      },
    });
    await specCreateInitialPrimary(primaryLocation, prisma, business.id, business.cityId, 'Before');
    const primaryBefore = await prisma.businessLocation.findFirstOrThrow({
      where: { businessId: business.id, isPrimary: true },
    });

    try {
      await svc.update(business.id, owner, { phone: '222' });
      const primaryAfterPhone = await prisma.businessLocation.findFirstOrThrow({
        where: { id: primaryBefore.id },
      });
      expect(primaryAfterPhone.phone).toBe('222');

      const updatedAtBeforeTitle = primaryAfterPhone.updatedAt;
      await svc.update(business.id, owner, { title: 'Patch sync renamed' });
      const primaryAfterTitle = await prisma.businessLocation.findFirstOrThrow({
        where: { id: primaryBefore.id },
      });
      expect(primaryAfterTitle.phone).toBe('222');
      expect(primaryAfterTitle.updatedAt.getTime()).toBe(updatedAtBeforeTitle.getTime());
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('legacy PATCH updates only primary when secondary location exists', async () => {
    if (skip) return;
    const city = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
    const category = await prisma.category.findFirst({ select: { id: true } });
    if (!city || !category) return;

    const slug = `a12a3-multi-${randomBytes(5).toString('hex')}`;
    const owner = { id: fixtureOwnerId, sub: fixtureOwnerId, phone: '+7', role: UserRole.BUSINESS };
    const svc = buildBusinessesService(fixtureOwnerId);

    const business = await prisma.business.create({
      data: {
        title: 'Multi branch',
        slug,
        categoryId: category.id,
        cityId: city.id,
        phone: 'primary-phone',
        ownerId: owner.id,
        status: 'ACTIVE',
      },
    });
    await specCreateInitialPrimary(primaryLocation, prisma, business.id, business.cityId, 'Primary addr');
    const secondary = await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: city.id,
        phone: 'secondary-phone',
        isPrimary: false,
      },
    });

    try {
      await svc.update(business.id, owner, { address: 'Primary addr updated' });
      const primary = await prisma.businessLocation.findFirstOrThrow({
        where: { businessId: business.id, isPrimary: true },
      });
      const secondaryAfter = await prisma.businessLocation.findUniqueOrThrow({
        where: { id: secondary.id },
      });
      expect(primary.address).toBe('Primary addr updated');
      expect(secondaryAfter.address).toBe('Branch addr');
      expect(secondaryAfter.phone).toBe('secondary-phone');
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('coordinate update keeps primary BusinessLocation geography aligned with coordinates', async () => {
    if (skip) return;
    const city = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
    const category = await prisma.category.findFirst({ select: { id: true } });
    if (!city || !category) return;

    const slug = `a12a3-geo-${randomBytes(5).toString('hex')}`;
    const owner = { id: fixtureOwnerId, sub: fixtureOwnerId, phone: '+7', role: UserRole.BUSINESS };
    const svc = buildBusinessesService(fixtureOwnerId);

    const business = await prisma.business.create({
      data: {
        title: 'Geo sync',
        slug,
        categoryId: category.id,
        cityId: city.id,
        ownerId: owner.id,
        status: 'ACTIVE',
      },
    });
    await specCreateInitialPrimary(primaryLocation, prisma, business.id, business.cityId, 'Geo addr');

    try {
      await svc.update(business.id, owner, { latitude: 51.2278, longitude: 51.3865 });
      const drift = await prisma.$queryRaw<Array<{ n: bigint }>>`
        SELECT COUNT(*)::bigint AS n
        FROM "BusinessLocation" bl
        WHERE bl."businessId" = ${business.id} AND bl."isPrimary" = true
          AND bl."latitude" IS NOT NULL AND bl."longitude" IS NOT NULL
          AND bl."location" IS NOT NULL
          AND ST_Distance(
            bl."location",
            ST_SetSRID(ST_MakePoint(bl."longitude"::float8, bl."latitude"::float8), 4326)::geography
          ) > 0.5`;
      expect(Number(drift[0]?.n ?? 0)).toBe(0);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('transaction rolls back Business update when primary sync fails', async () => {
    if (skip) return;
    const city = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
    const category = await prisma.category.findFirst({ select: { id: true } });
    if (!city || !category) return;

    const slug = `a12a3-rollback-${randomBytes(5).toString('hex')}`;
    const owner = { id: fixtureOwnerId, sub: fixtureOwnerId, phone: '+7', role: UserRole.BUSINESS };

    const business = await prisma.business.create({
      data: {
        title: 'Rollback test',
        slug,
        categoryId: category.id,
        cityId: city.id,
        phone: 'before-rollback',
        ownerId: owner.id,
        status: 'ACTIVE',
      },
    });
    await specCreateInitialPrimary(primaryLocation, prisma, business.id, business.cityId, 'Rollback addr');

    const brokenPrimary = new BusinessPrimaryLocationService();
    jest.spyOn(brokenPrimary, 'syncPrimaryFromBusinessRecord').mockRejectedValueOnce(new Error('sync failed'));

    const subDeps = createMockSubcategoryDeps();
    const svc = new BusinessesService(
      prisma as never,
      {
        resolveCityId: jest.fn().mockResolvedValue(city.id),
      } as never,
      asBusinessAccessService(createMockBusinessAccess({ ownerId: fixtureOwnerId })),
      { createActiveOwnerMembership: jest.fn() } as never,
      {} as PlanLimitsService,
      {} as BusinessPublicContentService,
      asAuditLogService(createMockAuditLog()),
      subDeps.businessSubcategories,
      subDeps.subcategories,
      {} as never,
      brokenPrimary,
    );

    await expect(svc.update(business.id, owner, { phone: 'after-rollback' })).rejects.toThrow('sync failed');

    const reloaded = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    expect(reloaded.phone).toBe('before-rollback');

    await prisma.business.delete({ where: { id: business.id } });
  });

  it('sync fails safely when Business has no primary location', async () => {
    if (skip) return;
    const city = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
    const category = await prisma.category.findFirst({ select: { id: true } });
    if (!city || !category) return;

    const slug = `a12a3-missing-${randomBytes(5).toString('hex')}`;

    try {
      await withPostgisIntegrationTransaction(prisma, async (tx) => {
        const business = await tx.business.create({
          data: {
            title: 'Missing primary',
            slug,
            categoryId: category.id,
            cityId: city.id,
            ownerId: fixtureOwnerId,
            status: 'ACTIVE',
          },
        });
        await expect(
          primaryLocation.syncPrimaryFromBusinessRecord(tx, business),
        ).rejects.toThrow(/no primary BusinessLocation/i);
        throw new Error(POSTGIS_TEST_ROLLBACK);
      });
    } finally {
      await prisma.business.deleteMany({ where: { slug: { startsWith: 'a12a3-missing-' } } });
    }
  });
});
