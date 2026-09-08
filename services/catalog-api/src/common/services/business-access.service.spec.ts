import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BusinessAccessService } from './business-access.service';
import { CityScopeService } from './city-scope.service';

describe('BusinessAccessService', () => {
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

  let prisma: { business: { findUnique: jest.Mock } };
  let cityScope: CityScopeService;
  let service: BusinessAccessService;

  beforeEach(() => {
    prisma = {
      business: {
        findUnique: jest.fn(),
      },
    };
    cityScope = new CityScopeService(prisma as never, {} as never);
    jest.spyOn(cityScope, 'assertBusinessInAdminScope').mockImplementation(async (_user, cityId) => {
      if (cityId === aktobeCityId) {
        throw new ForbiddenException('Not allowed to manage businesses in this city');
      }
    });
    jest.spyOn(cityScope, 'resolveAdminCityId').mockResolvedValue(uralskCityId);
    service = new BusinessAccessService(prisma as never, cityScope);
  });

  const owner = { id: 'owner-1', sub: 'owner-1', role: UserRole.BUSINESS, phone: '+1' } as const;
  const otherOwner = { id: 'owner-x', sub: 'owner-x', role: UserRole.BUSINESS, phone: '+2' } as const;
  const cityAdmin = { id: 'admin-city', sub: 'admin-city', role: UserRole.CITY_ADMIN, phone: '+3' } as const;
  const admin = { id: 'admin', sub: 'admin', role: UserRole.ADMIN, phone: '+4' } as const;
  const user = { id: 'user-1', sub: 'user-1', role: UserRole.USER, phone: '+5' } as const;

  it('allows BUSINESS owner for own business', async () => {
    prisma.business.findUnique.mockResolvedValue(businessUralsk);
    await expect(service.assertCanManageBusiness(owner, businessUralsk.id)).resolves.toEqual(
      businessUralsk,
    );
  });

  it('denies BUSINESS owner for other business', async () => {
    prisma.business.findUnique.mockResolvedValue(businessAktobe);
    await expect(service.assertCanManageBusiness(owner, businessAktobe.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows CITY_ADMIN for managed city business', async () => {
    prisma.business.findUnique.mockResolvedValue(businessUralsk);
    await expect(service.assertCanManageBusiness(cityAdmin, businessUralsk.id)).resolves.toEqual(
      businessUralsk,
    );
  });

  it('denies CITY_ADMIN for other city business', async () => {
    prisma.business.findUnique.mockResolvedValue(businessAktobe);
    await expect(
      service.assertCanManageBusiness(cityAdmin, businessAktobe.id),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows ADMIN for any business', async () => {
    prisma.business.findUnique.mockResolvedValue(businessAktobe);
    await expect(service.assertCanManageBusiness(admin, businessAktobe.id)).resolves.toEqual(
      businessAktobe,
    );
  });

  it('denies USER for business management', async () => {
    prisma.business.findUnique.mockResolvedValue(businessUralsk);
    await expect(service.assertCanManageBusiness(user, businessUralsk.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
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
