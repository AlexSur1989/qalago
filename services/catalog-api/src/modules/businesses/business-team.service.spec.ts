import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  BusinessInvitationStatus,
  BusinessMembershipRole,
  BusinessMembershipStatus,
  BusinessPermission,
  UserRole,
} from '@prisma/client';
import { BusinessTeamService } from './business-team.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';

describe('BusinessTeamService (Stage 5M.2)', () => {
  const businessId = 'biz-1';
  const owner = { id: 'owner-1', sub: 'owner-1', role: UserRole.BUSINESS, phone: '+1' };
  const manager = { id: 'mgr-1', sub: 'mgr-1', role: UserRole.USER, phone: '+2' };

  let prisma: {
    businessMembership: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      upsert: jest.Mock;
      update: jest.Mock;
    };
    businessInvitation: {
      findMany: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    user: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let businessAccess: { assertOwner: jest.Mock; resolveAccess: jest.Mock };
  let membership: { getMembership: jest.Mock };
  let auditLog: { record: jest.Mock };
  let invitations: {
    createEmailInvitationParams: jest.Mock;
    buildInviteUrl: jest.Mock;
    maskRecipient: jest.Mock;
  };
  let service: BusinessTeamService;

  beforeEach(() => {
    prisma = {
      businessMembership: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      businessInvitation: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      user: { findUnique: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => unknown) => fn(prisma)),
    };
    businessAccess = {
      assertOwner: jest.fn().mockResolvedValue({ id: businessId, cityId: 'city-1' }),
      resolveAccess: jest.fn().mockResolvedValue({}),
    };
    membership = { getMembership: jest.fn() };
    auditLog = { record: jest.fn().mockResolvedValue({ id: 'audit-1' }) };
    invitations = {
      createEmailInvitationParams: jest.fn().mockReturnValue({
        normalized: 'manager@example.com',
        rawToken: 'raw-token',
        tokenHash: 'hash',
        expiresAt: new Date(),
      }),
      buildInviteUrl: jest.fn().mockReturnValue('http://localhost:3003/invite/raw-token'),
      maskRecipient: jest.fn().mockReturnValue('m***@example.com'),
    };
    service = new BusinessTeamService(
      prisma as never,
      businessAccess as unknown as BusinessAccessService,
      membership as unknown as BusinessMembershipService,
      auditLog as never,
      invitations as never,
    );
  });

  it('OWNER can list team', async () => {
    await service.listTeam(owner, businessId);
    expect(businessAccess.assertOwner).toHaveBeenCalledWith(owner, businessId);
  });

  it('MANAGER cannot list team', async () => {
    businessAccess.assertOwner.mockRejectedValue(new ForbiddenException());
    await expect(service.listTeam(manager, businessId)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('invite existing user creates ACTIVE MANAGER membership', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u2', phone: '+77001112233' });
    membership.getMembership.mockResolvedValue(null);
    prisma.businessMembership.upsert.mockResolvedValue({ id: 'mem-1' });

    const result = await service.inviteManager(owner, businessId, {
      phone: '+77001112233',
      permissions: [BusinessPermission.CATALOG_EDIT],
    });

    expect(result.type).toBe('membership');
    expect(prisma.businessMembership.upsert).toHaveBeenCalled();
  });

  it('cannot invite existing OWNER as manager', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u2', phone: '+77001112233' });
    membership.getMembership.mockResolvedValue({
      role: BusinessMembershipRole.OWNER,
      status: BusinessMembershipStatus.ACTIVE,
    });

    await expect(
      service.inviteManager(owner, businessId, {
        phone: '+77001112233',
        permissions: [BusinessPermission.CATALOG_EDIT],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('invite by email creates token invitation with one-time link', async () => {
    prisma.businessInvitation.create.mockResolvedValue({ id: 'inv-email-1' });

    const result = await service.inviteManager(owner, businessId, {
      email: 'manager@example.com',
      permissions: [BusinessPermission.CATALOG_EDIT],
    });

    expect(result.type).toBe('invitation');
    expect('inviteUrl' in result && result.inviteUrl).toContain('/invite/');
    expect('rawToken' in result && result.rawToken).toBe('raw-token');
    expect(prisma.businessInvitation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'manager@example.com',
          tokenHash: 'hash',
        }),
      }),
    );
    const createArg = prisma.businessInvitation.create.mock.calls[0][0];
    expect(createArg.data).not.toHaveProperty('phone');
  });

  it('invite unknown phone creates pending invitation', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.businessInvitation.create.mockResolvedValue({ id: 'inv-1' });

    const result = await service.inviteManager(owner, businessId, {
      phone: '+77009998877',
      permissions: [BusinessPermission.PROMOTIONS_EDIT],
    });

    expect(result.type).toBe('invitation');
    expect(prisma.businessInvitation.create).toHaveBeenCalled();
  });

  it('ANALYTICS_EXPORT without ANALYTICS_VIEW rejected', async () => {
    await expect(
      service.inviteManager(owner, businessId, {
        phone: '+77001112233',
        permissions: [BusinessPermission.ANALYTICS_EXPORT],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cannot modify OWNER membership', async () => {
    prisma.businessMembership.findFirst.mockResolvedValue({
      id: 'mem-owner',
      role: BusinessMembershipRole.OWNER,
      status: BusinessMembershipStatus.ACTIVE,
    });

    await expect(
      service.updateMember(owner, businessId, 'mem-owner', {
        status: BusinessMembershipStatus.SUSPENDED,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('revoked manager cannot restore to ACTIVE', async () => {
    prisma.businessMembership.findFirst.mockResolvedValue({
      id: 'mem-mgr',
      role: BusinessMembershipRole.MANAGER,
      status: BusinessMembershipStatus.REVOKED,
    });

    await expect(
      service.updateMember(owner, businessId, 'mem-mgr', {
        status: BusinessMembershipStatus.ACTIVE,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('revoke pending invitation', async () => {
    prisma.businessInvitation.findFirst.mockResolvedValue({
      id: 'inv-1',
      phone: '+77001112233',
      status: BusinessInvitationStatus.PENDING,
    });
    prisma.businessInvitation.update.mockResolvedValue({ id: 'inv-1' });

    await service.revokeInvitation(owner, businessId, 'inv-1');
    expect(prisma.businessInvitation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: BusinessInvitationStatus.REVOKED },
      }),
    );
  });
});
