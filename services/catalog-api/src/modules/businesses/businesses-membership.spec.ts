import { UserRole } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';

describe('BusinessesService — membership foundation (Stage 5M.1)', () => {
  const cityScope = {
    resolveCityId: jest.fn().mockResolvedValue('city-uralsk'),
  } as unknown as CityScopeService;

  const membership = {
    createActiveOwnerMembership: jest.fn().mockResolvedValue({ id: 'mem-1' }),
  } as unknown as BusinessMembershipService;

  const primaryLocation = {
    createBusinessWithInitialPrimary: jest.fn().mockResolvedValue({
      business: {
        id: 'biz-new',
        ownerId: 'owner-1',
        title: 'New Cafe',
      },
      primaryLocation: { id: 'bl-primary', isPrimary: true },
    }),
  };

  function createService() {
    const tx = {
      user: { update: jest.fn().mockResolvedValue({}) },
      businessMembership: { upsert: jest.fn() },
    };

    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
      business: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      businessLocation: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'bl-1',
            businessId: 'b1',
            cityId: 'city-uralsk',
            isPrimary: true,
            createdAt: new Date(0),
            city: {
              id: 'city-uralsk',
              slug: 'uralsk',
              nameRu: 'Уральск',
              nameKk: null,
              timezone: 'Asia/Oral',
            },
          },
        ]),
      },
      category: { findUnique: jest.fn().mockResolvedValue({ id: 'cat-1' }) },
    } as unknown as PrismaService;

    const subDeps = createMockSubcategoryDeps();
    const service = new BusinessesService(
      prisma,
      cityScope,
      asBusinessAccessService(createMockBusinessAccess()),
      membership,
      {} as PlanLimitsService,
      {} as BusinessPublicContentService,
      asAuditLogService(createMockAuditLog()),
      subDeps.businessSubcategories,
      subDeps.subcategories,
      {} as never,
      primaryLocation as never,
    );

    return { service, prisma, tx, membership, primaryLocation };
  }

  it('create business sets ownerId and ACTIVE OWNER membership atomically for admin', async () => {
    const { service, tx, primaryLocation } = createService();
    const user = { id: 'admin-1', sub: 'admin-1', phone: '+7', role: UserRole.ADMIN };

    await service.create(user, {
      title: 'New Cafe',
      categoryId: 'cat-1',
      citySlug: 'uralsk',
      address: 'Street 1',
    });

    expect(primaryLocation.createBusinessWithInitialPrimary).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        brand: expect.objectContaining({ ownerId: 'admin-1' }),
      }),
    );
    expect(membership.createActiveOwnerMembership).toHaveBeenCalledWith(
      tx,
      'admin-1',
      'biz-new',
    );
  });

  it('findMy includes legacy ownerId when no membership row exists', async () => {
    const { service, prisma } = createService();
    prisma.business.findMany = jest.fn().mockResolvedValue([
      {
        id: 'b1',
        ownerId: 'owner-1',
        title: 'Cafe',
        memberships: [],
        category: null,
      },
    ]);

    const result = await service.findMy({
      id: 'owner-1',
      sub: 'owner-1',
      phone: '+7',
      role: UserRole.BUSINESS,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].access.role).toBe('OWNER');
  });

  it('findMy excludes REVOKED OWNER even when ownerId matches', async () => {
    const { service, prisma } = createService();
    prisma.business.findMany = jest.fn().mockResolvedValue([
      {
        id: 'b1',
        ownerId: 'owner-1',
        title: 'Cafe',
        memberships: [{ role: 'OWNER', status: 'REVOKED', permissions: [] }],
        category: null,
      },
    ]);

    const result = await service.findMy({
      id: 'owner-1',
      sub: 'owner-1',
      phone: '+7',
      role: UserRole.USER,
    });

    expect(result.items).toHaveLength(0);
  });

  it('findMy includes ACTIVE MANAGER membership businesses', async () => {
    const { service, prisma } = createService();
    prisma.business.findMany = jest.fn().mockResolvedValue([
      {
        id: 'b1',
        ownerId: 'owner-1',
        title: 'Cafe',
        memberships: [{ role: 'MANAGER', status: 'ACTIVE', permissions: ['CATALOG_EDIT'] }],
        category: null,
      },
    ]);

    const result = await service.findMy({ id: 'mgr-1', sub: 'mgr-1', phone: '+7', role: UserRole.USER });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].access.role).toBe('MANAGER');
  });

  it('findMy returns items with access context', async () => {
    const { service, prisma } = createService();
    prisma.business.findMany = jest.fn().mockResolvedValue([
      {
        id: 'b1',
        ownerId: 'owner-1',
        title: 'Cafe',
        memberships: [
          {
            role: 'MANAGER',
            permissions: ['CATALOG_EDIT'],
            status: 'ACTIVE',
          },
        ],
        category: null,
      },
    ]);

    const result = await service.findMy({
      id: 'mgr-1',
      sub: 'mgr-1',
      phone: '+7',
      role: UserRole.USER,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].access.role).toBe('MANAGER');
    expect(result.items[0].access.permissions).toContain('CATALOG_EDIT');
  });

  it('findMy excludes SUSPENDED MANAGER', async () => {
    const { service, prisma } = createService();
    prisma.business.findMany = jest.fn().mockResolvedValue([
      {
        id: 'b1',
        ownerId: 'owner-1',
        title: 'Cafe',
        memberships: [{ role: 'MANAGER', status: 'SUSPENDED', permissions: ['CATALOG_EDIT'] }],
        category: null,
      },
    ]);

    const result = await service.findMy({ id: 'mgr-1', sub: 'mgr-1', phone: '+7', role: UserRole.USER });
    expect(result.items).toHaveLength(0);
  });

  it('findMy excludes INVITED MANAGER', async () => {
    const { service, prisma } = createService();
    prisma.business.findMany = jest.fn().mockResolvedValue([
      {
        id: 'b1',
        ownerId: 'owner-1',
        title: 'Cafe',
        memberships: [{ role: 'MANAGER', status: 'INVITED', permissions: [] }],
        category: null,
      },
    ]);

    const result = await service.findMy({ id: 'mgr-1', sub: 'mgr-1', phone: '+7', role: UserRole.USER });
    expect(result.items).toHaveLength(0);
  });
});
