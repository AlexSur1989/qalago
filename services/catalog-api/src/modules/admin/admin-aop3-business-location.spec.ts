import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { StaffPermission } from '@qalago/shared-types';
import { AdminBusinessLocationService } from './admin-business-location.service';
import { BusinessLocationService } from '../businesses/business-location.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { StaffAuthorizationGuard } from '../../common/guards/staff-authorization.guard';
import { StaffPolicyService } from '../../common/services/staff-policy.service';
import { StaffStepUpService } from '../../common/services/staff-step-up.service';
import { Reflector } from '@nestjs/core';
import {
  ADMIN_STAFF_ROUTE_KEY,
  STAFF_PERMISSIONS_KEY,
} from '../../common/decorators/require-staff-permission.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';
import { createTestBusinessWithPrimary, testPrimaryPhysical } from '../businesses/business-with-primary.test-fixture';

function mockReflector(permissions: StaffPermission[]) {
  return {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === STAFF_PERMISSIONS_KEY) return permissions;
      if (key === ADMIN_STAFF_ROUTE_KEY) return false;
      return undefined;
    }),
  } as unknown as Reflector;
}

describe('AOP.3 — admin BusinessLocation management', () => {
  const prisma = new PrismaClient();
  const auditMock = createMockAuditLog();
  let skip = false;
  let uralskCityId = '';
  let aktobeCityId = '';
  let categoryId = '';
  let staffAdminId = '';
  let cityAdminUralskId = '';
  let cityAdminAktobeId = '';
  let moderatorId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const uralsk = await prisma.city.findFirst({ where: { slug: 'uralsk', isActive: true } });
      const aktobe = await prisma.city.findFirst({ where: { slug: 'aktobe', isActive: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      if (!uralsk || !aktobe || !category) {
        skip = true;
        return;
      }
      uralskCityId = uralsk.id;
      aktobeCityId = aktobe.id;
      categoryId = category.id;

      const suffix = randomBytes(3).toString('hex');
      staffAdminId = `aop3-admin-${suffix}`;
      cityAdminUralskId = `aop3-city-u-${suffix}`;
      cityAdminAktobeId = `aop3-city-a-${suffix}`;
      moderatorId = `aop3-mod-${suffix}`;

      for (const row of [
        { id: staffAdminId, phone: `+7710${suffix}0`, role: UserRole.ADMIN },
        { id: cityAdminUralskId, phone: `+7711${suffix}1`, role: UserRole.CITY_ADMIN },
        { id: cityAdminAktobeId, phone: `+7712${suffix}2`, role: UserRole.CITY_ADMIN },
        { id: moderatorId, phone: `+7713${suffix}3`, role: UserRole.MODERATOR },
      ]) {
        await prisma.user.create({ data: row });
      }
      await prisma.staffAccess.createMany({
        data: [
          { userId: staffAdminId, staffRole: UserRole.ADMIN, isActive: true },
          { userId: cityAdminUralskId, staffRole: UserRole.CITY_ADMIN, isActive: true },
          { userId: cityAdminAktobeId, staffRole: UserRole.CITY_ADMIN, isActive: true },
          { userId: moderatorId, staffRole: UserRole.MODERATOR, isActive: true },
        ],
      });
      await prisma.staffCityScope.createMany({
        data: [
          { userId: cityAdminUralskId, cityId: uralskCityId },
          { userId: cityAdminAktobeId, cityId: aktobeCityId },
        ],
      });
    } catch (error) {
      skip = true;
      console.warn('AOP.3 spec skipped (dev DB fixture):', error);
    }
  });

  afterAll(async () => {
    await prisma.staffCityScope
      .deleteMany({ where: { userId: { in: [cityAdminUralskId, cityAdminAktobeId] } } })
      .catch(() => undefined);
    await prisma.staffAccess
      .deleteMany({
        where: { userId: { in: [staffAdminId, cityAdminUralskId, cityAdminAktobeId, moderatorId] } },
      })
      .catch(() => undefined);
    await prisma.user
      .deleteMany({
        where: { id: { in: [staffAdminId, cityAdminUralskId, cityAdminAktobeId, moderatorId] } },
      })
      .catch(() => undefined);
    await prisma.$disconnect();
  });

  function buildService() {
    const cityScope = new CityScopeService(prisma as unknown as PrismaService, {
      get: () => 'uralsk',
    } as unknown as ConfigService);
    const primaryLocation = new BusinessPrimaryLocationService();
    const locations = new BusinessLocationService(
      prisma as unknown as PrismaService,
      {} as never,
      primaryLocation,
    );
    const auditLog = asAuditLogService(auditMock) as AuditLogService;
    return new AdminBusinessLocationService(cityScope, locations, auditLog, prisma as unknown as PrismaService);
  }

  const adminActor = (): AuthUser => ({
    id: staffAdminId,
    sub: staffAdminId,
    role: UserRole.ADMIN,
    phone: '+77000000001',
  });

  const cityAdminUralsk = (): AuthUser => ({
    id: cityAdminUralskId,
    sub: cityAdminUralskId,
    role: UserRole.CITY_ADMIN,
    phone: '+77000000002',
  });

  async function createBusiness(slugPrefix: string) {
    const slug = `${slugPrefix}-${randomBytes(4).toString('hex')}`;
    const created = await createTestBusinessWithPrimary(prisma, {
      brand: {
        title: `AOP3 ${slugPrefix}`,
        slug,
        categoryId,
        status: 'ACTIVE',
        ownerId: null,
      },
      primaryPhysical: testPrimaryPhysical(uralskCityId, 'Primary addr 1'),
    });
    return { ...created, slug };
  }

  async function cleanupBusiness(slug: string) {
    await prisma.business.deleteMany({ where: { slug } }).catch(() => undefined);
  }

  describe('StaffAuthorizationGuard BUSINESS_EDIT', () => {
    const policy = new StaffPolicyService({} as never);
    const stepUp = new StaffStepUpService({ get: () => 600 } as never, { record: jest.fn() } as never);
    const ctx = (user: { role: UserRole; id: string }) =>
      ({
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({ getRequest: () => ({ user: { sub: user.id, ...user } }) }),
      }) as never;

    it('denies MODERATOR for BUSINESS_EDIT location mutations', () => {
      const guard = new StaffAuthorizationGuard(
        mockReflector([StaffPermission.BUSINESS_EDIT]),
        policy,
        stepUp,
      );
      expect(() => guard.canActivate(ctx({ role: UserRole.MODERATOR, id: moderatorId }))).toThrow(
        ForbiddenException,
      );
    });
  });

  it('staff creates secondary location and keeps single primary', async () => {
    if (skip) return;
    const service = buildService();
    const { business, slug } = await createBusiness('aop3-create');
    try {
      const created = await service.create(adminActor(), business.id, {
        cityId: uralskCityId,
        address: 'Secondary branch',
      });
      expect(created.isPrimary).toBe(false);

      const list = await service.list(adminActor(), business.id);
      expect(list.items).toHaveLength(2);
      expect(list.items.filter((i) => i.isPrimary)).toHaveLength(1);
    } finally {
      await cleanupBusiness(slug);
    }
  });

  it('CITY_ADMIN rejects create in out-of-scope city', async () => {
    if (skip) return;
    const service = buildService();
    const { business, slug } = await createBusiness('aop3-city-deny');
    try {
      await expect(
        service.create(cityAdminUralsk(), business.id, {
          cityId: aktobeCityId,
          address: 'Aktobe branch',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    } finally {
      await cleanupBusiness(slug);
    }
  });

  it('setPrimary promotes secondary atomically (exactly one primary)', async () => {
    if (skip) return;
    const service = buildService();
    const { business, slug } = await createBusiness('aop3-primary');
    try {
      const secondary = await service.create(adminActor(), business.id, {
        cityId: uralskCityId,
        address: 'Branch B',
      });
      const promoted = await service.setPrimary(adminActor(), business.id, secondary.id);
      expect(promoted.isPrimary).toBe(true);
      const list = await service.list(adminActor(), business.id);
      expect(list.items.filter((i) => i.isPrimary)).toHaveLength(1);
      expect(list.items.find((i) => i.id === secondary.id)?.isPrimary).toBe(true);
    } finally {
      await cleanupBusiness(slug);
    }
  });

  it('delete non-primary succeeds; cannot delete last location', async () => {
    if (skip) return;
    const service = buildService();
    const { business, slug } = await createBusiness('aop3-del');
    try {
      const secondary = await service.create(adminActor(), business.id, {
        cityId: uralskCityId,
        address: 'To delete',
      });
      await service.remove(adminActor(), business.id, secondary.id);
      const list = await service.list(adminActor(), business.id);
      expect(list.items).toHaveLength(1);

      const only = list.items[0]!;
      await expect(service.remove(adminActor(), business.id, only.id)).rejects.toThrow();
    } finally {
      await cleanupBusiness(slug);
    }
  });

  it('rejects invalid city on create', async () => {
    if (skip) return;
    const service = buildService();
    const { business, slug } = await createBusiness('aop3-badcity');
    try {
      await expect(
        service.create(adminActor(), business.id, {
          cityId: 'nonexistent-city',
          address: 'X',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    } finally {
      await cleanupBusiness(slug);
    }
  });
});
