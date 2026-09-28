import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';

/**
 * Cross-city fixture (in-memory mocks only):
 * Business B — home city A (primary L1), secondary L2 in city B.
 */
describe('Stage 6.12A.9.4.1A admin branch city scope', () => {
  const cityA = 'city-a';
  const cityB = 'city-b';
  const businessId = 'biz-cross';

  const cityAdminB = {
    id: 'admin-b',
    sub: 'admin-b',
    role: UserRole.CITY_ADMIN,
    phone: '+7700',
  };

  describe('AdminService.listBusinesses filter', () => {
    let prisma: {
      business: { findMany: jest.Mock; count: jest.Mock };
    };
    let cityScope: CityScopeService;
    let service: AdminService;

    beforeEach(() => {
      prisma = {
        business: {
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
        },
      };
      const scopePrisma = {
        staffCityScope: {
          findMany: jest.fn().mockResolvedValue([{ cityId: cityB }]),
        },
        user: { findUnique: jest.fn() },
        city: { findFirst: jest.fn() },
        businessLocation: { findFirst: jest.fn() },
      };
      cityScope = new CityScopeService(
        scopePrisma as unknown as PrismaService,
        { get: () => 'uralsk' } as unknown as ConfigService,
      );
      service = new AdminService(
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
        {} as never,
      );
    });

    it('CITY_ADMIN B lists businesses with branch in city B (not parent cityId)', async () => {
      await service.listBusinesses(cityAdminB, {});
      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            locations: { some: { cityId: cityB } },
          }),
        }),
      );
      expect(prisma.business.findMany.mock.calls[0][0].where.cityId).toBeUndefined();
    });
  });

  describe('BusinessAccessService owner-route escalation guard', () => {
    const businessCross = {
      id: businessId,
      ownerId: 'owner-1',
      cityId: cityA,
      categoryId: 'cat-1',
    };

    let prisma: {
      business: { findUnique: jest.Mock };
      businessMembership: { findFirst: jest.Mock; findUnique: jest.Mock };
      staffCityScope: { findMany: jest.Mock };
      user: { findUnique: jest.Mock };
      businessLocation: { findFirst: jest.Mock };
    };
    let access: BusinessAccessService;

    beforeEach(() => {
      prisma = {
        business: { findUnique: jest.fn().mockResolvedValue(businessCross) },
        businessMembership: { findFirst: jest.fn(), findUnique: jest.fn().mockResolvedValue(null) },
        staffCityScope: {
          findMany: jest.fn().mockResolvedValue([{ cityId: cityB }]),
        },
        user: { findUnique: jest.fn() },
        businessLocation: { findFirst: jest.fn().mockResolvedValue({ id: 'loc-b' }),
        },
      };
      const cityScope = new CityScopeService(prisma as never, {} as never);
      const membership = new BusinessMembershipService(
        prisma as never,
        asAuditLogService(createMockAuditLog()),
        { assertCanAddManager: jest.fn().mockResolvedValue(undefined) } as never,
      );
      access = new BusinessAccessService(prisma as never, cityScope, membership);
    });

    it('CITY_ADMIN B denied owner-equivalent resolveAccess when primary is in city A', async () => {
      prisma.businessLocation.findFirst.mockResolvedValue({ cityId: cityA });
      await expect(access.resolveAccess(cityAdminB, businessId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.businessLocation.findFirst).toHaveBeenCalledWith({
        where: { businessId, isPrimary: true },
        select: { cityId: true },
      });
    });

    it('CITY_ADMIN A granted owner-equivalent resolveAccess when primary city matches', async () => {
      prisma.staffCityScope.findMany.mockResolvedValue([{ cityId: cityA }]);
      prisma.businessLocation.findFirst.mockResolvedValue({ cityId: cityA });
      const result = await access.resolveAccess(
        { ...cityAdminB, id: 'admin-a', sub: 'admin-a' },
        businessId,
      );
      expect(result.accessRole).toBe('CITY_ADMIN');
      expect(result.permissions.length).toBeGreaterThan(5);
    });
  });

  describe('Admin mutation re-checks businessId scope', () => {
    it('updateBusinessStatus calls assertBusinessInAdminScope with business id', async () => {
      const cityScope = {
        assertBusinessInAdminScope: jest.fn().mockResolvedValue(undefined),
        resolveAdminCityId: jest.fn(),
        buildAdminBusinessScopeWhere: jest.fn(),
      };
      const prisma = {
        business: {
          findUnique: jest.fn().mockResolvedValue({
            id: businessId,
            cityId: cityA,
            ownerId: null,
            title: 'Cross',
            status: 'ACTIVE',
          }),
          update: jest.fn().mockResolvedValue({}),
        },
      };
      const service = new AdminService(
        prisma as never,
        cityScope as never,
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
        {} as never,
      );
      await service.updateBusinessStatus(
        { id: 'ga', sub: 'ga', role: UserRole.ADMIN, phone: '+1' },
        businessId,
        { status: 'BLOCKED' as never },
      );
      expect(cityScope.assertBusinessInAdminScope).toHaveBeenCalledWith(
        expect.anything(),
        businessId,
      );
    });
  });
});
