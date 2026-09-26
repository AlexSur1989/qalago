import { ForbiddenException } from '@nestjs/common';
import { BusinessPermission, PrismaClient, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { AdminService } from './admin.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { BusinessLocationService } from '../businesses/business-location.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { specCreateInitialPrimary } from '../businesses/business-with-primary.test-fixture';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Stage 6.12A.9.4.5A — CITY_ADMIN dual model (runtime DB):
 * Admin visibility: any BL in city; owner-equivalent: primary BL city only.
 */
describe('Stage 6.12A.9.4.5A — CITY_ADMIN primary BL authorization', () => {
  const prisma = new PrismaClient();
  const primaryLocation = new BusinessPrimaryLocationService();
  let skip = false;
  let cityAId = '';
  let cityBId = '';
  let categoryId = '';
  let ownerId = '';
  let staffAId = '';
  let staffBId = '';
  let managerId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const uralsk = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const aktobe = await prisma.city.findFirst({ where: { slug: 'aktobe' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      const owner = await prisma.user.findFirst({ select: { id: true } });
      if (!uralsk || !aktobe || !category || !owner) {
        skip = true;
        return;
      }
      cityAId = uralsk.id;
      cityBId = aktobe.id;
      categoryId = category.id;
      ownerId = owner.id;
      staffAId = `a95a-staff-a-${randomBytes(4).toString('hex')}`;
      staffBId = `a95a-staff-b-${randomBytes(4).toString('hex')}`;
      managerId = `a95a-mgr-${randomBytes(4).toString('hex')}`;
      await prisma.user.createMany({
        data: [
          { id: staffAId, phone: `+7700${randomBytes(3).toString('hex')}1`, role: UserRole.CITY_ADMIN },
          { id: staffBId, phone: `+7700${randomBytes(3).toString('hex')}2`, role: UserRole.CITY_ADMIN },
          { id: managerId, phone: `+7700${randomBytes(3).toString('hex')}3`, role: UserRole.USER },
        ],
        skipDuplicates: true,
      });
      await prisma.staffCityScope.createMany({
        data: [
          { userId: staffAId, cityId: cityAId },
          { userId: staffBId, cityId: cityBId },
        ],
        skipDuplicates: true,
      });
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.staffCityScope.deleteMany({ where: { userId: { in: [staffAId, staffBId] } } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { id: { in: [staffAId, staffBId, managerId] } } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  const cityAdminA = () =>
    ({ id: staffAId, sub: staffAId, phone: '+7', role: UserRole.CITY_ADMIN }) as const;
  const cityAdminB = () =>
    ({ id: staffBId, sub: staffBId, phone: '+7', role: UserRole.CITY_ADMIN }) as const;
  const owner = () =>
    ({ id: ownerId, sub: ownerId, phone: '+7', role: UserRole.BUSINESS }) as const;
  const manager = () =>
    ({ id: managerId, sub: managerId, phone: '+7', role: UserRole.USER }) as const;

  function buildAccessService() {
    const cityScope = new CityScopeService(prisma as unknown as PrismaService, {
      get: () => 'uralsk',
    } as never);
    const membership = new BusinessMembershipService(
      prisma as unknown as PrismaService,
      asAuditLogService(createMockAuditLog()),
      {} as never,
    );
    return new BusinessAccessService(prisma as unknown as PrismaService, cityScope, membership);
  }

  function buildAdminService() {
    const cityScope = new CityScopeService(prisma as unknown as PrismaService, {
      get: () => 'uralsk',
    } as never);
    return new AdminService(
      prisma as never,
      cityScope,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  }

  function buildLocationService() {
    return new BusinessLocationService(
      prisma as unknown as PrismaService,
      asBusinessAccessService(createMockBusinessAccess({ ownerId })),
      primaryLocation,
    );
  }

  async function createMultiCityBusiness(slugPrefix: string) {
    const slug = `${slugPrefix}-${randomBytes(5).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: 'A95A multi-city',
        slug,
        categoryId,
        cityId: cityAId,
        ownerId,
        status: 'ACTIVE',
      },
    });
    await specCreateInitialPrimary(primaryLocation, prisma, business.id, cityAId, 'L1 primary A', {
      latitude: 51.2278,
      longitude: 51.3865,
    });
    const l2 = await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: cityBId,
        address: 'L2 secondary B',
        isPrimary: false,
      },
    });
    return { business, l2, slug };
  }

  it('Admin A and B both list business when respective branch exists (ANY-BL visibility)', async () => {
    if (skip) return;
    const { business, slug } = await createMultiCityBusiness('a95a-list');
    const admin = buildAdminService();
    try {
      const listA = await admin.listBusinesses(cityAdminA(), { citySlug: 'uralsk' });
      expect(listA.items.some((b) => b.id === business.id)).toBe(true);
      const listB = await admin.listBusinesses(cityAdminB(), { citySlug: 'aktobe' });
      expect(listB.items.some((b) => b.id === business.id)).toBe(true);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
      await prisma.business.deleteMany({ where: { slug } }).catch(() => undefined);
    }
  });

  it('owner-equivalent: Admin A pass, Admin B deny while L1 primary in A', async () => {
    if (skip) return;
    const { business } = await createMultiCityBusiness('a95a-gate');
    const access = buildAccessService();
    try {
      await expect(access.resolveAccess(cityAdminA(), business.id)).resolves.toMatchObject({
        accessRole: 'CITY_ADMIN',
      });
      await expect(access.resolveAccess(cityAdminB(), business.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(access.resolveAccess(owner(), business.id)).resolves.toMatchObject({
        accessRole: 'OWNER',
      });
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('after promote L2: Admin B pass, Admin A deny; Business.cityId mirror syncs to B', async () => {
    if (skip) return;
    const { business, l2 } = await createMultiCityBusiness('a95a-promote');
    const locSvc = buildLocationService();
    const access = buildAccessService();
    try {
      await locSvc.setPrimaryLocation(owner(), business.id, l2.id);
      const row = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
      expect(row.cityId).toBe(cityBId);
      await expect(access.resolveAccess(cityAdminB(), business.id)).resolves.toMatchObject({
        accessRole: 'CITY_ADMIN',
      });
      await expect(access.resolveAccess(cityAdminA(), business.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('MANAGER permissions unchanged (not elevated by CITY_ADMIN rules)', async () => {
    if (skip) return;
    const { business } = await createMultiCityBusiness('a95a-mgr');
    await prisma.businessMembership.create({
      data: {
        userId: managerId,
        businessId: business.id,
        role: 'MANAGER',
        status: 'ACTIVE',
        permissions: [BusinessPermission.CATALOG_EDIT],
      },
    });
    const access = buildAccessService();
    try {
      await expect(
        access.assertBusinessPermission(manager(), business.id, BusinessPermission.CATALOG_EDIT),
      ).resolves.toBeTruthy();
      await expect(access.assertOwner(manager(), business.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    } finally {
      await prisma.businessMembership.deleteMany({
        where: { businessId: business.id, userId: managerId },
      });
      await prisma.business.delete({ where: { id: business.id } });
    }
  });
});
