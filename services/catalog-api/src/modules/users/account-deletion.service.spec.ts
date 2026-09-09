import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  BusinessApplicationStatus,
  BusinessMembershipRole,
  BusinessMembershipStatus,
  BusinessOwnershipClaimStatus,
  BusinessInvitationStatus,
  UserRole,
} from '@prisma/client';
import { AccountDeletionService } from './account-deletion.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AccountDeletionService', () => {
  let service: AccountDeletionService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    businessMembership: { findMany: jest.Mock; count: jest.Mock; updateMany: jest.Mock };
    business: { findMany: jest.Mock };
    favorite: { deleteMany: jest.Mock };
    notification: { deleteMany: jest.Mock };
    review: { deleteMany: jest.Mock };
    otpCode: { deleteMany: jest.Mock };
    businessApplication: { updateMany: jest.Mock };
    businessOwnershipClaim: { updateMany: jest.Mock };
    businessInvitation: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      businessMembership: { findMany: jest.fn(), count: jest.fn(), updateMany: jest.fn() },
      business: { findMany: jest.fn().mockResolvedValue([]) },
      favorite: { deleteMany: jest.fn() },
      notification: { deleteMany: jest.fn() },
      review: { deleteMany: jest.fn() },
      otpCode: { deleteMany: jest.fn() },
      businessApplication: { updateMany: jest.fn() },
      businessOwnershipClaim: { updateMany: jest.fn() },
      businessInvitation: { updateMany: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => unknown) => fn(prisma)),
    };
    service = new AccountDeletionService(prisma as unknown as PrismaService);
  });

  function mockOrdinaryUser() {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      phone: '+77001234567',
      isActive: true,
      role: UserRole.USER,
    });
    prisma.businessMembership.findMany.mockResolvedValue([]);
  }

  it('deletes ordinary user and anonymizes phone', async () => {
    mockOrdinaryUser();

    const result = await service.deleteOwnAccount('u1');

    expect(result.success).toBe(true);
    expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(prisma.review.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          isActive: false,
          name: null,
          phone: expect.stringMatching(/^deleted:u1:/),
        }),
      }),
    );
  });

  it('is idempotent for already deleted users', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      phone: 'deleted:u1:123',
      isActive: false,
      role: UserRole.USER,
    });

    const result = await service.deleteOwnAccount('u1');
    expect(result.message).toContain('already deleted');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('blocks admin roles', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'admin',
      phone: '+77001111111',
      isActive: true,
      role: UserRole.ADMIN,
    });

    await expect(service.deleteOwnAccount('admin')).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows manager deletion by revoking membership', async () => {
    mockOrdinaryUser();
    prisma.businessMembership.findMany.mockResolvedValue([
      { businessId: 'b1', role: BusinessMembershipRole.MANAGER },
    ]);

    await service.deleteOwnAccount('u1');

    expect(prisma.businessMembership.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', status: BusinessMembershipStatus.ACTIVE },
      data: { status: BusinessMembershipStatus.REVOKED },
    });
  });

  it('allows co-owner deletion when other owners exist', async () => {
    mockOrdinaryUser();
    prisma.businessMembership.findMany.mockResolvedValue([
      { businessId: 'b1', role: BusinessMembershipRole.OWNER },
    ]);
    prisma.businessMembership.count.mockResolvedValue(2);

    await expect(service.deleteOwnAccount('u1')).resolves.toEqual(
      expect.objectContaining({ success: true }),
    );
  });

  it('blocks sole owner deletion', async () => {
    mockOrdinaryUser();
    prisma.businessMembership.findMany.mockResolvedValue([
      { businessId: 'b1', role: BusinessMembershipRole.OWNER },
    ]);
    prisma.businessMembership.count.mockResolvedValue(1);

    await expect(service.deleteOwnAccount('u1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('cancels pending applications and claims', async () => {
    mockOrdinaryUser();

    await service.deleteOwnAccount('u1');

    expect(prisma.businessApplication.updateMany).toHaveBeenCalledWith({
      where: {
        applicantUserId: 'u1',
        status: { in: [BusinessApplicationStatus.DRAFT, BusinessApplicationStatus.PENDING] },
      },
      data: { status: BusinessApplicationStatus.CANCELLED },
    });
    expect(prisma.businessOwnershipClaim.updateMany).toHaveBeenCalledWith({
      where: {
        claimantUserId: 'u1',
        status: BusinessOwnershipClaimStatus.PENDING,
      },
      data: { status: BusinessOwnershipClaimStatus.CANCELLED },
    });
    expect(prisma.businessInvitation.updateMany).toHaveBeenCalledWith({
      where: {
        invitedByUserId: 'u1',
        status: BusinessInvitationStatus.PENDING,
      },
      data: { status: BusinessInvitationStatus.REVOKED },
    });
  });

  it('throws when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.deleteOwnAccount('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
