import {
  BusinessMembershipRole,
  BusinessMembershipStatus,
} from '@prisma/client';
import { BusinessMembershipService } from './business-membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';

describe('BusinessMembershipService.hasActiveOwnerAccess (Stage 5N.1)', () => {
  const auditLog = createMockAuditLog();

  function createService(getMembership: jest.Mock) {
    const prisma = {} as PrismaService;
    const planLimits = { assertCanAddManager: jest.fn().mockResolvedValue(undefined) };
    const service = new BusinessMembershipService(
      prisma,
      asAuditLogService(auditLog),
      planLimits as never,
    );
    jest.spyOn(service, 'getMembership').mockImplementation(getMembership);
    return service;
  }

  it('allows legacy ownerId when no membership row exists', async () => {
    const service = createService(jest.fn().mockResolvedValue(null));
    await expect(service.hasActiveOwnerAccess('u1', 'b1', 'u1')).resolves.toBe(true);
  });

  it('allows ACTIVE OWNER membership even without ownerId', async () => {
    const service = createService(
      jest.fn().mockResolvedValue({
        role: BusinessMembershipRole.OWNER,
        status: BusinessMembershipStatus.ACTIVE,
      }),
    );
    await expect(service.hasActiveOwnerAccess('u1', 'b1', null)).resolves.toBe(true);
  });

  it('denies REVOKED OWNER even when ownerId matches', async () => {
    const service = createService(
      jest.fn().mockResolvedValue({
        role: BusinessMembershipRole.OWNER,
        status: BusinessMembershipStatus.REVOKED,
      }),
    );
    await expect(service.hasActiveOwnerAccess('u1', 'b1', 'u1')).resolves.toBe(false);
  });

  it('denies SUSPENDED OWNER even when ownerId matches', async () => {
    const service = createService(
      jest.fn().mockResolvedValue({
        role: BusinessMembershipRole.OWNER,
        status: BusinessMembershipStatus.SUSPENDED,
      }),
    );
    await expect(service.hasActiveOwnerAccess('u1', 'b1', 'u1')).resolves.toBe(false);
  });

  it('denies ACTIVE MANAGER even when ownerId matches', async () => {
    const service = createService(
      jest.fn().mockResolvedValue({
        role: BusinessMembershipRole.MANAGER,
        status: BusinessMembershipStatus.ACTIVE,
      }),
    );
    await expect(service.hasActiveOwnerAccess('u1', 'b1', 'u1')).resolves.toBe(false);
  });
});

describe('BusinessMembershipService.claimPendingInvitations (BIZ.3)', () => {
  const auditLog = createMockAuditLog();

  function createClaimService() {
    const prisma = {
      user: { findUnique: jest.fn() },
      businessInvitation: { findMany: jest.fn(), update: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) =>
        fn({
          businessMembership: { upsert: jest.fn().mockResolvedValue({ id: 'mem-1' }) },
          businessInvitation: { update: jest.fn() },
        }),
      ),
    };
    const planLimits = {
      assertCanAddManager: jest.fn().mockResolvedValue(undefined),
    };
    const service = new BusinessMembershipService(
      prisma as never,
      asAuditLogService(auditLog),
      planLimits as never,
    );
    jest.spyOn(service, 'getMembership').mockResolvedValue(null);
    return { service, prisma, planLimits };
  }

  it('claims only pending phone invitations matching user phone', async () => {
    const { service, prisma } = createClaimService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      phone: '+77001112233',
      role: 'USER',
    });
    prisma.businessInvitation.findMany.mockResolvedValue([
      {
        id: 'inv-1',
        businessId: 'biz-1',
        phone: '+77001112233',
        permissions: ['CATALOG_EDIT'],
      },
    ]);

    await service.claimPendingInvitations('u1', '+77001112233');
    expect(prisma.businessInvitation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          phone: '+77001112233',
          tokenHash: null,
          status: 'PENDING',
        }),
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('skips claim when plan manager limit exceeded', async () => {
    const { service, prisma, planLimits } = createClaimService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      phone: '+77001112233',
      role: 'USER',
    });
    prisma.businessInvitation.findMany.mockResolvedValue([
      { id: 'inv-1', businessId: 'biz-1', phone: '+77001112233', permissions: [] },
    ]);
    planLimits.assertCanAddManager.mockRejectedValue(new Error('limit'));

    await service.claimPendingInvitations('u1', '+77001112233');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
