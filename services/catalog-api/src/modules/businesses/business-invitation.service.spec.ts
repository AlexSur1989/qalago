import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  BusinessInvitationStatus,
  BusinessMembershipRole,
  BusinessMembershipStatus,
  BusinessPermission,
  BusinessStatus,
  UserRole,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { BusinessInvitationService } from './business-invitation.service';
import { hashInviteToken, generateInviteToken } from '../../common/utils/invite-token.util';

describe('BusinessInvitationService (Stage 6.2B6)', () => {
  const user = { id: 'u1', sub: 'u1', role: UserRole.USER, phone: null };
  const rawToken = generateInviteToken();
  const tokenHash = hashInviteToken(rawToken);

  let prisma: {
    businessInvitation: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    businessMembership: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let auditLog: { record: jest.Mock };
  let rateLimit: { assertAllowed: jest.Mock };
  let service: BusinessInvitationService;

  beforeEach(() => {
    prisma = {
      businessInvitation: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      businessMembership: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => unknown) => fn(prisma)),
    };
    auditLog = { record: jest.fn().mockResolvedValue({ id: 'audit-1' }) };
    rateLimit = { assertAllowed: jest.fn() };
    service = new BusinessInvitationService(
      prisma as never,
      auditLog as never,
      rateLimit as never,
      { get: () => 'http://localhost:3003' } as unknown as ConfigService,
    );
  });

  it('resolve returns minimal public data', async () => {
    prisma.businessInvitation.findFirst.mockResolvedValue({
      status: BusinessInvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 60_000),
      email: 'manager@example.com',
      business: { title: 'Cafe Qala' },
    });

    const result = await service.resolveByToken(rawToken);
    expect(result.businessName).toBe('Cafe Qala');
    expect(result.status).toBe('PENDING');
    expect(result.recipientEmailMasked).toContain('@example.com');
  });

  it('accept creates MANAGER membership for phone-null user', async () => {
    prisma.businessInvitation.findFirst.mockResolvedValue({
      id: 'inv-1',
      businessId: 'biz-1',
      permissions: [BusinessPermission.CATALOG_EDIT],
      status: BusinessInvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 60_000),
      business: { id: 'biz-1', title: 'Cafe', cityId: 'city-1', status: BusinessStatus.ACTIVE },
    });
    prisma.businessMembership.findUnique.mockResolvedValue(null);
    prisma.businessMembership.upsert.mockResolvedValue({ id: 'mem-1' });
    prisma.businessInvitation.update.mockResolvedValue({});

    const result = await service.acceptByToken(user, rawToken);
    expect(result.membershipId).toBe('mem-1');
    expect(prisma.businessMembership.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          role: BusinessMembershipRole.MANAGER,
          status: BusinessMembershipStatus.ACTIVE,
        }),
      }),
    );
  });

  it('rejects expired invitation', async () => {
    prisma.businessInvitation.findFirst.mockResolvedValue({
      id: 'inv-1',
      businessId: 'biz-1',
      permissions: [],
      status: BusinessInvitationStatus.PENDING,
      expiresAt: new Date(Date.now() - 60_000),
      business: { id: 'biz-1', title: 'Cafe', cityId: 'city-1', status: BusinessStatus.ACTIVE },
    });
    prisma.businessMembership.findUnique.mockResolvedValue(null);

    await expect(service.acceptByToken(user, rawToken)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('does not downgrade OWNER', async () => {
    prisma.businessInvitation.findFirst.mockResolvedValue({
      id: 'inv-1',
      businessId: 'biz-1',
      permissions: [],
      status: BusinessInvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 60_000),
      business: { id: 'biz-1', title: 'Cafe', cityId: 'city-1', status: BusinessStatus.ACTIVE },
    });
    prisma.businessMembership.findUnique.mockResolvedValue({
      role: BusinessMembershipRole.OWNER,
      status: BusinessMembershipStatus.ACTIVE,
    });
    prisma.businessInvitation.update.mockResolvedValue({});

    await expect(service.acceptByToken(user, rawToken)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('resolve unknown token returns 404', async () => {
    prisma.businessInvitation.findFirst.mockResolvedValue(null);
    await expect(service.resolveByToken(rawToken)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('createEmailInvitationParams rejects invalid email', () => {
    expect(() => service.createEmailInvitationParams('not-an-email')).toThrow(
      BadRequestException,
    );
  });

  it('createEmailInvitationParams returns hash not raw token for storage', () => {
    const params = service.createEmailInvitationParams('Manager@Example.COM');
    expect(params.normalized).toBe('manager@example.com');
    expect(params.tokenHash).toBe(hashInviteToken(params.rawToken));
    expect(params.tokenHash).not.toBe(params.rawToken);
  });

  it('rejects cancelled invitation on accept', async () => {
    prisma.businessInvitation.findFirst.mockResolvedValue({
      id: 'inv-1',
      businessId: 'biz-1',
      permissions: [],
      status: BusinessInvitationStatus.REVOKED,
      expiresAt: new Date(Date.now() + 60_000),
      business: { id: 'biz-1', title: 'Cafe', cityId: 'city-1', status: BusinessStatus.ACTIVE },
    });
    prisma.businessMembership.findUnique.mockResolvedValue(null);

    await expect(service.acceptByToken(user, rawToken)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
