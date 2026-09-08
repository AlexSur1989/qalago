import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  BusinessMembershipRole,
  BusinessMembershipStatus,
  UserRole,
} from '@prisma/client';
import { BusinessAccessService } from './business-access.service';
import { BusinessMembershipService } from './business-membership.service';
import { CityScopeService } from './city-scope.service';

describe('BusinessAccessService (Stage 5M.1 dual-read)', () => {
  const uralskCityId = 'city-uralsk';
  const aktobeCityId = 'city-aktobe';
  const businessUralsk = {
    id: 'biz-uralsk',
    ownerId: 'owner-1',
    cityId: uralskCityId,
    categoryId: 'cat-1',
  };
  const businessAktobe = {
    id: 'biz-aktobe',
    ownerId: 'owner-2',
    cityId: aktobeCityId,
    categoryId: 'cat-1',
  };
  const businessOrphanOwner = {
    id: 'biz-orphan',
    ownerId: null,
    cityId: uralskCityId,
    categoryId: 'cat-1',
  };

  let prisma: {
    business: { findUnique: jest.Mock };
    businessMembership: { findFirst: jest.Mock; findUnique: jest.Mock };
  };
  let cityScope: CityScopeService;
  let membership: BusinessMembershipService;
  let service: BusinessAccessService;

  beforeEach(() => {
    prisma = {
      business: { findUnique: jest.fn() },
      businessMembership: { findFirst: jest.fn(), findUnique: jest.fn() },
    };
    cityScope = new CityScopeService(prisma as never, {} as never);
    jest.spyOn(cityScope, 'assertBusinessInAdminScope').mockImplementation(async (_user, cityId) => {
      if (cityId === aktobeCityId) {
        throw new ForbiddenException('Not allowed to manage businesses in this city');
      }
    });
    membership = new BusinessMembershipService(prisma as never);
    service = new BusinessAccessService(prisma as never, cityScope, membership);
  });

  const legacyOwner = {
    id: 'owner-1',
    sub: 'owner-1',
    role: UserRole.BUSINESS,
    phone: '+1',
  } as const;
  const membershipOwner = {
    id: 'member-owner',
    sub: 'member-owner',
    role: UserRole.USER,
    phone: '+1b',
  } as const;
  const otherOwner = {
    id: 'owner-x',
    sub: 'owner-x',
    role: UserRole.BUSINESS,
    phone: '+2',
  } as const;
  const cityAdmin = {
    id: 'admin-city',
    sub: 'admin-city',
    role: UserRole.CITY_ADMIN,
    phone: '+3',
  } as const;
  const admin = { id: 'admin', sub: 'admin', role: UserRole.ADMIN, phone: '+4' } as const;
  const user = { id: 'user-1', sub: 'user-1', role: UserRole.USER, phone: '+5' } as const;

  function mockActiveOwnerMembership(userId: string, businessId: string) {
    prisma.businessMembership.findFirst.mockResolvedValue({
      id: 'mem-1',
      userId,
      businessId,
      role: BusinessMembershipRole.OWNER,
      status: BusinessMembershipStatus.ACTIVE,
    });
  }

  function mockMembership(
    userId: string,
    businessId: string,
    role: BusinessMembershipRole,
    status: BusinessMembershipStatus,
  ) {
    prisma.businessMembership.findFirst.mockResolvedValue({
      id: 'mem-1',
      userId,
      businessId,
      role,
      status,
    });
  }

  it('1. legacy ownerId owner → allow', async () => {
    prisma.business.findUnique.mockResolvedValue(businessUralsk);
    await expect(service.assertCanManageBusiness(legacyOwner, businessUralsk.id)).resolves.toEqual(
      businessUralsk,
    );
    expect(prisma.businessMembership.findFirst).not.toHaveBeenCalled();
  });

  it('2. ACTIVE OWNER membership → allow', async () => {
    prisma.business.findUnique.mockResolvedValue(businessOrphanOwner);
    mockActiveOwnerMembership(membershipOwner.id, businessOrphanOwner.id);
    await expect(
      service.assertCanManageBusiness(membershipOwner, businessOrphanOwner.id),
    ).resolves.toEqual(businessOrphanOwner);
  });

  it('3. INVITED OWNER → deny', async () => {
    prisma.business.findUnique.mockResolvedValue(businessOrphanOwner);
    prisma.businessMembership.findFirst.mockResolvedValue(null);
    await expect(
      service.assertCanManageBusiness(membershipOwner, businessOrphanOwner.id),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('4. SUSPENDED OWNER → deny', async () => {
    prisma.business.findUnique.mockResolvedValue(businessOrphanOwner);
    prisma.businessMembership.findFirst.mockResolvedValue(null);
    await expect(
      service.assertCanManageBusiness(membershipOwner, businessOrphanOwner.id),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('5. REVOKED OWNER → deny', async () => {
    prisma.business.findUnique.mockResolvedValue(businessOrphanOwner);
    prisma.businessMembership.findFirst.mockResolvedValue(null);
    await expect(
      service.assertCanManageBusiness(membershipOwner, businessOrphanOwner.id),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('6. ACTIVE MANAGER → deny in 5M.1', async () => {
    prisma.business.findUnique.mockResolvedValue(businessOrphanOwner);
    mockMembership(
      'manager-1',
      businessOrphanOwner.id,
      BusinessMembershipRole.MANAGER,
      BusinessMembershipStatus.ACTIVE,
    );
    const manager = { id: 'manager-1', sub: 'manager-1', role: UserRole.USER, phone: '+6' };
    await expect(
      service.assertCanManageBusiness(manager, businessOrphanOwner.id),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('7. unrelated BUSINESS user → deny', async () => {
    prisma.business.findUnique.mockResolvedValue(businessAktobe);
    prisma.businessMembership.findFirst.mockResolvedValue(null);
    await expect(service.assertCanManageBusiness(legacyOwner, businessAktobe.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('8. USER without membership → deny', async () => {
    prisma.business.findUnique.mockResolvedValue(businessUralsk);
    prisma.businessMembership.findFirst.mockResolvedValue(null);
    await expect(service.assertCanManageBusiness(user, businessUralsk.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('9. CITY_ADMIN same city → allow', async () => {
    prisma.business.findUnique.mockResolvedValue(businessUralsk);
    await expect(service.assertCanManageBusiness(cityAdmin, businessUralsk.id)).resolves.toEqual(
      businessUralsk,
    );
  });

  it('10. CITY_ADMIN other city → deny', async () => {
    prisma.business.findUnique.mockResolvedValue(businessAktobe);
    await expect(
      service.assertCanManageBusiness(cityAdmin, businessAktobe.id),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('11. ADMIN → allow', async () => {
    prisma.business.findUnique.mockResolvedValue(businessAktobe);
    await expect(service.assertCanManageBusiness(admin, businessAktobe.id)).resolves.toEqual(
      businessAktobe,
    );
  });

  it('12. membership lookup uses current DB state', async () => {
    prisma.business.findUnique.mockResolvedValue(businessOrphanOwner);
    mockActiveOwnerMembership(membershipOwner.id, businessOrphanOwner.id);
    await service.assertCanManageBusiness(membershipOwner, businessOrphanOwner.id);
    expect(prisma.businessMembership.findFirst).toHaveBeenCalledWith({
      where: {
        userId: membershipOwner.id,
        businessId: businessOrphanOwner.id,
        status: BusinessMembershipStatus.ACTIVE,
      },
    });
  });

  it('throws when business not found', async () => {
    prisma.business.findUnique.mockResolvedValue(null);
    await expect(service.assertCanManageBusiness(otherOwner, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('analytics view uses same scope as manage', async () => {
    prisma.business.findUnique.mockResolvedValue(businessAktobe);
    await expect(
      service.assertCanViewBusinessAnalytics(cityAdmin, businessAktobe.id),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
