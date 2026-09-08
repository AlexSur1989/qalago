import { UserRole } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';

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

  it('findMy includes legacy ownerId businesses', async () => {
    const { service, prisma } = createService();
    prisma.business.findMany = jest.fn().mockResolvedValue([{ id: 'b1' }]);

    await service.findMy({ id: 'owner-1', sub: 'owner-1', phone: '+7', role: UserRole.BUSINESS });

    expect(prisma.business.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ ownerId: 'owner-1' }]),
        }),
      }),
    );
  });

  it('findMy includes ACTIVE OWNER membership businesses', async () => {
    const { service, prisma } = createService();
    prisma.business.findMany = jest.fn().mockResolvedValue([]);

    await service.findMy({ id: 'owner-1', sub: 'owner-1', phone: '+7', role: UserRole.BUSINESS });

    expect(prisma.business.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { ownerId: 'owner-1' },
            {
              memberships: {
                some: {
                  userId: 'owner-1',
                  role: 'OWNER',
                  status: 'ACTIVE',
                },
              },
            },
          ],
        },
      }),
    );
  });
});
