import { AuditAction, BusinessStatus, PrismaClient, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { AdminService } from './admin.service';
import { AdminBusinessLocationService } from './admin-business-location.service';
import { BusinessLocationService } from '../businesses/business-location.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { BusinessSubcategoryService } from '../businesses/business-subcategory.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { AuthUser } from '../../common/types/jwt-payload.type';
import {
  createTestBusinessWithPrimary,
  testPrimaryPhysical,
} from '../businesses/business-with-primary.test-fixture';

describe('AOP.5 — Admin catalog audit & lifecycle', () => {
  const prisma = new PrismaClient();
  const auditMock = createMockAuditLog();
  let skip = false;
  let cityId = '';
  let categoryId = '';
  let adminId = '';
  let analystId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const city = await prisma.city.findFirst({ where: { slug: 'uralsk', isActive: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      if (!city || !category) {
        skip = true;
        return;
      }
      cityId = city.id;
      categoryId = category.id;
      const suffix = randomBytes(3).toString('hex');
      adminId = `aop5-admin-${suffix}`;
      analystId = `aop5-analyst-${suffix}`;
      await prisma.user.createMany({
        data: [
          { id: adminId, phone: `+7730${suffix}0`, role: UserRole.ADMIN },
          { id: analystId, phone: `+7731${suffix}1`, role: UserRole.ANALYST },
        ],
      });
      await prisma.staffAccess.createMany({
        data: [
          { userId: adminId, staffRole: UserRole.ADMIN, isActive: true },
          { userId: analystId, staffRole: UserRole.ANALYST, isActive: true },
        ],
      });
    } catch (error) {
      skip = true;
      console.warn('AOP.5 spec skipped:', error);
    }
  });

  afterAll(async () => {
    await prisma.staffAccess.deleteMany({ where: { userId: { in: [adminId, analystId] } } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { id: { in: [adminId, analystId] } } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  const adminActor = (): AuthUser => ({
    id: adminId,
    sub: adminId,
    role: UserRole.ADMIN,
    phone: '+77000000001',
  });

  function buildAdminService() {
    const cityScope = new CityScopeService(prisma as unknown as PrismaService, {
      get: () => 'uralsk',
    } as unknown as ConfigService);
    const businessSubcategories = new BusinessSubcategoryService(prisma as unknown as PrismaService);
    return new AdminService(
      prisma as never,
      cityScope,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      asAuditLogService(auditMock),
      {} as never,
      {} as never,
      businessSubcategories,
      {} as never,
      new BusinessPrimaryLocationService(),
    );
  }

  function buildLocationAdminService() {
    const cityScope = new CityScopeService(prisma as unknown as PrismaService, {
      get: () => 'uralsk',
    } as unknown as ConfigService);
    const locations = new BusinessLocationService(
      prisma as unknown as PrismaService,
      {} as never,
      new BusinessPrimaryLocationService(),
    );
    return new AdminBusinessLocationService(
      cityScope,
      locations,
      asAuditLogService(auditMock) as never,
      prisma as unknown as PrismaService,
    );
  }

  async function createPendingBusiness(slugPrefix: string) {
    const slug = `${slugPrefix}-${randomBytes(4).toString('hex')}`;
    const { business } = await createTestBusinessWithPrimary(prisma, {
      brand: {
        title: 'AOP5 lifecycle',
        slug,
        categoryId,
        status: BusinessStatus.PENDING,
        ownerId: null,
      },
      primaryPhysical: testPrimaryPhysical(cityId, 'Addr'),
    });
    return { business, slug };
  }

  async function cleanupSlug(slug: string) {
    await prisma.business.deleteMany({ where: { slug } }).catch(() => undefined);
  }

  async function isPublicActiveBusiness(id: string) {
    const row = await prisma.business.findFirst({
      where: { id, status: BusinessStatus.ACTIVE },
      select: { id: true },
    });
    return row != null;
  }

  it('staff-created business is PENDING and not public-active', async () => {
    if (skip) return;
    const { business, slug } = await createPendingBusiness('aop5-pending');
    try {
      expect(business.status).toBe(BusinessStatus.PENDING);
      expect(await isPublicActiveBusiness(business.id)).toBe(false);
    } finally {
      await cleanupSlug(slug);
    }
  });

  it('status transition PENDING→ACTIVE audited and public-active', async () => {
    if (skip) return;
    const svc = buildAdminService();
    const { business, slug } = await createPendingBusiness('aop5-act');
    try {
      auditMock.record.mockClear();
      await svc.updateBusinessStatus(adminActor(), business.id, { status: BusinessStatus.ACTIVE });
      expect(auditMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.BUSINESS_STATUS_UPDATE,
          metadata: expect.objectContaining({
            fromStatus: BusinessStatus.PENDING,
            toStatus: BusinessStatus.ACTIVE,
          }),
        }),
      );
      expect(await isPublicActiveBusiness(business.id)).toBe(true);
    } finally {
      await cleanupSlug(slug);
    }
  });

  it('ACTIVE→BLOCKED audited and excluded from public-active', async () => {
    if (skip) return;
    const svc = buildAdminService();
    const { business, slug } = await createPendingBusiness('aop5-block');
    try {
      await svc.updateBusinessStatus(adminActor(), business.id, { status: BusinessStatus.ACTIVE });
      auditMock.record.mockClear();
      await svc.updateBusinessStatus(adminActor(), business.id, { status: BusinessStatus.BLOCKED });
      expect(auditMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.BUSINESS_STATUS_UPDATE }),
      );
      expect(await isPublicActiveBusiness(business.id)).toBe(false);
    } finally {
      await cleanupSlug(slug);
    }
  });

  it('featured update writes BUSINESS_FEATURED_UPDATE audit', async () => {
    if (skip) return;
    const svc = buildAdminService();
    const { business, slug } = await createPendingBusiness('aop5-feat');
    try {
      await svc.updateBusinessStatus(adminActor(), business.id, { status: BusinessStatus.ACTIVE });
      auditMock.record.mockClear();
      await svc.updateBusinessFeatured(adminActor(), business.id, {
        isFeatured: true,
        featuredSlot: 1,
      });
      expect(auditMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.BUSINESS_FEATURED_UPDATE }),
      );
    } finally {
      await cleanupSlug(slug);
    }
  });

  it('location create uses BUSINESS_LOCATION_CREATE audit action', async () => {
    if (skip) return;
    const locSvc = buildLocationAdminService();
    const { business, slug } = await createPendingBusiness('aop5-loc');
    try {
      auditMock.record.mockClear();
      await locSvc.create(adminActor(), business.id, {
        cityId,
        address: 'Branch 2',
      });
      expect(auditMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.BUSINESS_LOCATION_CREATE }),
      );
    } finally {
      await cleanupSlug(slug);
    }
  });

  it('ownerless business stays ownerless after catalog status change', async () => {
    if (skip) return;
    const svc = buildAdminService();
    const { business, slug } = await createPendingBusiness('aop5-ownerless');
    try {
      await svc.updateBusinessStatus(adminActor(), business.id, { status: BusinessStatus.ACTIVE });
      const row = await prisma.business.findUnique({ where: { id: business.id } });
      expect(row?.ownerId).toBeNull();
      const membership = await prisma.businessMembership.findFirst({
        where: { businessId: business.id, userId: adminId },
      });
      expect(membership).toBeNull();
    } finally {
      await cleanupSlug(slug);
    }
  });
});
