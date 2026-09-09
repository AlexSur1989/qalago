import { UserRole } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';

describe('BusinessesService — membership foundation (Stage 5M.1)', () => {
  const cityScope = {
    resolveCityId: jest.fn().mockResolvedValue('city-uralsk'),
  } as unknown as CityScopeService;

  const membership = {
    createActiveOwnerMembership: jest.fn().mockResolvedValue({ id: 'mem-1' }),
  } as unknown as BusinessMembershipService;

  function createService() {
    const tx = {
      business: {
        create: jest.fn().mockResolvedValue({
          id: 'biz-new',
          ownerId: 'owner-1',
          title: 'New Cafe',
        }),
      },
      user: { update: jest.fn().mockResolvedValue({}) },
      businessMembership: { upsert: jest.fn() },
    };

    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
      business: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      category: { findUnique: jest.fn().mockResolvedValue({ id: 'cat-1' }) },
    } as unknown as PrismaService;

    const service = new BusinessesService(
      prisma,
      cityScope,
      asBusinessAccessService(createMockBusinessAccess()),
      membership,
      {} as PlanLimitsService,
      {} as BusinessPublicContentService,
      asAuditLogService(createMockAuditLog()),
    );

    return { service, prisma, tx, membership };
  }

  it('create business sets ownerId and ACTIVE OWNER membership atomically', async () => {
    const { service, tx } = createService();
    const user = { id: 'owner-1', sub: 'owner-1', phone: '+7', role: UserRole.USER };

    await service.create(user, {
      title: 'New Cafe',
      categoryId: 'cat-1',
      citySlug: 'uralsk',
      address: 'Street 1',
    });

    expect(tx.business.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ownerId: 'owner-1' }),
      }),
    );
    expect(membership.createActiveOwnerMembership).toHaveBeenCalledWith(
      tx,
      'owner-1',
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
        city: null,
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
        city: null,
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
        city: null,
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
        city: null,
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
});
