import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  BusinessMembershipRole,
  BusinessMembershipStatus,
  BusinessOwnershipClaimStatus,
  BusinessPlanTier,
  BusinessStatus,
  UserRole,
} from '@prisma/client';
import { OwnershipClaimsService } from './ownership-claims.service';
import { AuthUser } from '../../common/types/jwt-payload.type';

describe('OwnershipClaimsService (Stage 5N.2)', () => {
  const user: AuthUser = {
    id: 'user-claim',
    sub: 'user-claim',
    phone: '+77000000097',
    role: UserRole.USER,
  };
  const admin: AuthUser = {
    id: 'admin-1',
    sub: 'admin-1',
    phone: '+77000000001',
    role: UserRole.SUPER_ADMIN,
  };
  const cityAdmin: AuthUser = {
    id: 'city-admin-1',
    sub: 'city-admin-1',
    phone: '+77000000004',
    role: UserRole.CITY_ADMIN,
  };

  const activeBusiness = {
    id: 'biz-1',
    status: BusinessStatus.ACTIVE,
    ownerId: 'owner-existing',
    cityId: 'city-uralsk',
    planTier: BusinessPlanTier.PREMIUM,
    title: 'Existing Cafe',
    categoryId: 'cat-1',
    phone: '+77001111111',
    shortDesc: 'Desc',
  };

  const auditLog = { record: jest.fn().mockResolvedValue({}) };
  const notifications = { create: jest.fn().mockResolvedValue({}) };
  const cityScope = {
    resolveAdminCityId: jest.fn().mockResolvedValue('city-uralsk'),
    assertBusinessInAdminScope: jest.fn().mockResolvedValue(undefined),
    resolveCityId: jest.fn().mockResolvedValue('city-uralsk'),
  };
  const membership = {
    getMembership: jest.fn(),
    createActiveOwnerMembership: jest.fn().mockResolvedValue({}),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let service: OwnershipClaimsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      business: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      businessOwnershipClaim: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      businessMembership: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => unknown) => fn(prisma)),
    };

    service = new OwnershipClaimsService(
      prisma as never,
      cityScope as never,
      membership as never,
      auditLog as never,
      notifications as never,
    );
  });

  it('creates PENDING claim without membership or ownerId change', async () => {
    prisma.business.findUnique.mockResolvedValue(activeBusiness);
    membership.getMembership.mockResolvedValue(null);
    prisma.businessOwnershipClaim.findFirst.mockResolvedValue(null);
    prisma.businessOwnershipClaim.create.mockResolvedValue({
      id: 'claim-1',
      status: BusinessOwnershipClaimStatus.PENDING,
      business: { cityId: 'city-uralsk' },
    });

    await service.create(user, 'biz-1', { claimantMessage: 'Я представитель' });

    expect(prisma.businessOwnershipClaim.create).toHaveBeenCalled();
    expect(membership.createActiveOwnerMembership).not.toHaveBeenCalled();
    expect(prisma.business.update).not.toHaveBeenCalled();
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.BUSINESS_OWNERSHIP_CLAIM_SUBMIT }),
    );
  });

  it('denies claim for non-ACTIVE business', async () => {
    prisma.business.findUnique.mockResolvedValue({
      ...activeBusiness,
      status: BusinessStatus.PENDING,
    });

    await expect(service.create(user, 'biz-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('denies claim for BLOCKED business', async () => {
    prisma.business.findUnique.mockResolvedValue({
      ...activeBusiness,
      status: BusinessStatus.BLOCKED,
    });

    await expect(service.create(user, 'biz-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('denies claim when already ACTIVE OWNER', async () => {
    prisma.business.findUnique.mockResolvedValue(activeBusiness);
    membership.getMembership.mockResolvedValue({
      role: BusinessMembershipRole.OWNER,
      status: BusinessMembershipStatus.ACTIVE,
    });

    await expect(service.create(user, 'biz-1', {})).rejects.toBeInstanceOf(ConflictException);
  });

  it('denies claim for legacy owner without membership', async () => {
    prisma.business.findUnique.mockResolvedValue({
      ...activeBusiness,
      ownerId: user.id,
    });
    membership.getMembership.mockResolvedValue(null);

    await expect(service.create(user, 'biz-1', {})).rejects.toBeInstanceOf(ConflictException);
  });

  it('denies REVOKED OWNER claim', async () => {
    prisma.business.findUnique.mockResolvedValue(activeBusiness);
    membership.getMembership.mockResolvedValue({
      role: BusinessMembershipRole.OWNER,
      status: BusinessMembershipStatus.REVOKED,
    });

    await expect(service.create(user, 'biz-1', {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('denies SUSPENDED MANAGER claim', async () => {
    prisma.business.findUnique.mockResolvedValue(activeBusiness);
    membership.getMembership.mockResolvedValue({
      role: BusinessMembershipRole.MANAGER,
      status: BusinessMembershipStatus.SUSPENDED,
    });

    await expect(service.create(user, 'biz-1', {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows ACTIVE MANAGER to submit claim', async () => {
    prisma.business.findUnique.mockResolvedValue(activeBusiness);
    membership.getMembership.mockResolvedValue({
      role: BusinessMembershipRole.MANAGER,
      status: BusinessMembershipStatus.ACTIVE,
    });
    prisma.businessOwnershipClaim.findFirst.mockResolvedValue(null);
    prisma.businessOwnershipClaim.create.mockResolvedValue({
      id: 'claim-mgr',
      status: BusinessOwnershipClaimStatus.PENDING,
      business: { cityId: 'city-uralsk' },
    });

    await service.create(user, 'biz-1', {});

    expect(prisma.businessOwnershipClaim.create).toHaveBeenCalled();
  });

  it('denies duplicate pending claim', async () => {
    prisma.business.findUnique.mockResolvedValue(activeBusiness);
    membership.getMembership.mockResolvedValue(null);
    prisma.businessOwnershipClaim.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(service.create(user, 'biz-1', {})).rejects.toBeInstanceOf(ConflictException);
  });

  it('denies IDOR read', async () => {
    prisma.businessOwnershipClaim.findUnique.mockResolvedValue({
      id: 'claim-1',
      claimantUserId: 'other-user',
      business: {},
    });

    await expect(service.getOwn(user, 'claim-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('approves claim and creates OWNER when no membership', async () => {
    const unownedBusiness = { ...activeBusiness, ownerId: null };
    const claimRecord = {
      id: 'claim-1',
      status: BusinessOwnershipClaimStatus.PENDING,
      claimantUserId: user.id,
      businessId: 'biz-1',
      verificationMethod: 'MANUAL',
      business: unownedBusiness,
      claimant: { id: user.id },
      reviewedBy: null,
    };

    prisma.businessOwnershipClaim.findUnique
      .mockResolvedValueOnce(claimRecord)
      .mockResolvedValueOnce({
        ...claimRecord,
        business: unownedBusiness,
      });

    prisma.businessMembership.findUnique.mockResolvedValue(null);
    prisma.businessOwnershipClaim.updateMany.mockResolvedValue({ count: 1 });
    prisma.business.findUniqueOrThrow.mockResolvedValue({
      ...unownedBusiness,
      ownerId: user.id,
      planTier: BusinessPlanTier.PREMIUM,
    });
    prisma.businessOwnershipClaim.findUniqueOrThrow.mockResolvedValue({
      ...claimRecord,
      status: BusinessOwnershipClaimStatus.APPROVED,
    });

    const result = await service.adminApprove(admin, 'claim-1');

    expect(membership.createActiveOwnerMembership).toHaveBeenCalledWith(
      prisma,
      user.id,
      'biz-1',
    );
    expect(prisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { ownerId: user.id } }),
    );
    expect(prisma.business.findUniqueOrThrow).toHaveBeenCalled();
    expect(result.business.id).toBe('biz-1');
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.BUSINESS_OWNERSHIP_CLAIM_APPROVE }),
    );
  });

  it('approves claim without overwriting existing ownerId', async () => {
    const claimRecord = {
      id: 'claim-2',
      status: BusinessOwnershipClaimStatus.PENDING,
      claimantUserId: user.id,
      businessId: 'biz-1',
      verificationMethod: 'MANUAL',
      business: activeBusiness,
      claimant: null,
      reviewedBy: null,
    };

    prisma.businessOwnershipClaim.findUnique
      .mockResolvedValueOnce(claimRecord)
      .mockResolvedValueOnce({ ...claimRecord, business: activeBusiness });

    prisma.businessMembership.findUnique.mockResolvedValue(null);
    prisma.businessOwnershipClaim.updateMany.mockResolvedValue({ count: 1 });
    prisma.business.findUniqueOrThrow.mockResolvedValue({
      ...activeBusiness,
      ownerId: 'owner-existing',
      planTier: BusinessPlanTier.PREMIUM,
    });
    prisma.businessOwnershipClaim.findUniqueOrThrow.mockResolvedValue({
      ...claimRecord,
      status: BusinessOwnershipClaimStatus.APPROVED,
    });

    await service.adminApprove(admin, 'claim-2');

    expect(prisma.business.update).not.toHaveBeenCalled();
  });

  it('promotes ACTIVE MANAGER to OWNER on approval', async () => {
    const claimRecord = {
      id: 'claim-3',
      status: BusinessOwnershipClaimStatus.PENDING,
      claimantUserId: user.id,
      businessId: 'biz-1',
      verificationMethod: 'MANUAL',
      business: activeBusiness,
      claimant: null,
      reviewedBy: null,
    };

    prisma.businessOwnershipClaim.findUnique
      .mockResolvedValueOnce(claimRecord)
      .mockResolvedValueOnce({ ...claimRecord, business: activeBusiness });

    prisma.businessMembership.findUnique.mockResolvedValue({
      role: BusinessMembershipRole.MANAGER,
      status: BusinessMembershipStatus.ACTIVE,
    });
    prisma.businessOwnershipClaim.updateMany.mockResolvedValue({ count: 1 });
    prisma.business.findUniqueOrThrow.mockResolvedValue({
      ...activeBusiness,
      ownerId: 'owner-existing',
      planTier: BusinessPlanTier.PREMIUM,
    });
    prisma.businessOwnershipClaim.findUniqueOrThrow.mockResolvedValue({
      ...claimRecord,
      status: BusinessOwnershipClaimStatus.APPROVED,
    });

    await service.adminApprove(admin, 'claim-3');

    expect(prisma.businessMembership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: BusinessMembershipRole.OWNER }),
      }),
    );
    expect(membership.createActiveOwnerMembership).not.toHaveBeenCalled();
  });

  it('is idempotent on second approve', async () => {
    prisma.businessOwnershipClaim.findUnique.mockResolvedValue({
      id: 'claim-4',
      status: BusinessOwnershipClaimStatus.APPROVED,
      business: activeBusiness,
      claimant: null,
      reviewedBy: null,
    });

    const result = await service.adminApprove(admin, 'claim-4');

    expect(result.claim.status).toBe(BusinessOwnershipClaimStatus.APPROVED);
    expect(prisma.businessMembership.findUnique).not.toHaveBeenCalled();
  });

  it('denies approve after reject', async () => {
    prisma.businessOwnershipClaim.findUnique.mockResolvedValue({
      id: 'claim-5',
      status: BusinessOwnershipClaimStatus.REJECTED,
      business: activeBusiness,
      claimant: null,
      reviewedBy: null,
    });

    await expect(service.adminApprove(admin, 'claim-5')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects with audit and notification', async () => {
    prisma.businessOwnershipClaim.findUnique.mockResolvedValue({
      id: 'claim-6',
      status: BusinessOwnershipClaimStatus.PENDING,
      claimantUserId: user.id,
      businessId: 'biz-1',
      verificationMethod: 'MANUAL',
      business: activeBusiness,
      claimant: null,
      reviewedBy: null,
    });
    prisma.businessOwnershipClaim.updateMany.mockResolvedValue({ count: 1 });
    prisma.businessOwnershipClaim.findUniqueOrThrow.mockResolvedValue({
      status: BusinessOwnershipClaimStatus.REJECTED,
    });

    await service.adminReject(admin, 'claim-6', { rejectionReason: 'Not verified' });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.BUSINESS_OWNERSHIP_CLAIM_REJECT }),
    );
    expect(notifications.create).toHaveBeenCalled();
  });

  it('cancels pending claim', async () => {
    prisma.businessOwnershipClaim.findUnique.mockResolvedValue({
      id: 'claim-7',
      claimantUserId: user.id,
      status: BusinessOwnershipClaimStatus.PENDING,
      businessId: 'biz-1',
      business: { cityId: 'city-uralsk' },
    });
    prisma.businessOwnershipClaim.updateMany.mockResolvedValue({ count: 1 });
    prisma.businessOwnershipClaim.findUniqueOrThrow.mockResolvedValue({
      status: BusinessOwnershipClaimStatus.CANCELLED,
    });

    await service.cancel(user, 'claim-7');

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.BUSINESS_OWNERSHIP_CLAIM_CANCEL }),
    );
  });

  it('forces CITY_ADMIN to managed city on list', async () => {
    prisma.businessOwnershipClaim.findMany.mockResolvedValue([]);
    prisma.businessOwnershipClaim.count.mockResolvedValue(0);

    await expect(
      service.adminList(cityAdmin, { cityId: 'city-other' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await service.adminList(cityAdmin, {});
    expect(prisma.businessOwnershipClaim.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ business: { cityId: 'city-uralsk' } }),
      }),
    );
  });
});
