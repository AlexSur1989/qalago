import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CityScopeService } from './city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('CityScopeService', () => {
  let service: CityScopeService;
  let prisma: {
    user: { findUnique: jest.Mock };
    city: { findFirst: jest.Mock };
    staffCityScope: { findMany: jest.Mock };
    businessLocation: { findFirst: jest.Mock };
  };

  const cityAdmin = { id: 'u1', role: UserRole.CITY_ADMIN, phone: '+7', sub: 'u1' };
  const globalAdmin = { id: 'ga', role: UserRole.ADMIN, phone: '+7', sub: 'ga' };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      city: { findFirst: jest.fn() },
      staffCityScope: { findMany: jest.fn().mockResolvedValue([]) },
      businessLocation: { findFirst: jest.fn() },
    };
    service = new CityScopeService(
      prisma as unknown as PrismaService,
      { get: jest.fn().mockReturnValue('uralsk') } as unknown as ConfigService,
    );
  });

  it('forces CITY_ADMIN to managed city', async () => {
    prisma.user.findUnique.mockResolvedValue({ managedCityId: 'city-aktobe' });

    await expect(service.resolveAdminCityId(cityAdmin)).resolves.toBe('city-aktobe');
  });

  it('rejects CITY_ADMIN without managed city', async () => {
    prisma.staffCityScope.findMany.mockResolvedValue([]);
    prisma.user.findUnique.mockResolvedValue({ managedCityId: null });

    await expect(service.resolveAdminCityId(cityAdmin)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  describe('Stage 6.12A.9.4.1A admin business scope', () => {
    beforeEach(() => {
      prisma.staffCityScope.findMany.mockResolvedValue([{ cityId: 'city-a' }, { cityId: 'city-b' }]);
    });

    it('buildAdminBusinessScopeWhere uses BusinessLocation presence', () => {
      expect(service.buildAdminBusinessScopeWhere('city-a')).toEqual({
        locations: { some: { cityId: 'city-a' } },
      });
    });

    it('global admin assertBusinessInAdminScope is no-op', async () => {
      await expect(service.assertBusinessInAdminScope(globalAdmin, 'biz-1')).resolves.toBeUndefined();
      expect(prisma.businessLocation.findFirst).not.toHaveBeenCalled();
    });

    it('CITY_ADMIN allowed when branch in scoped city (primary home city)', async () => {
      prisma.businessLocation.findFirst.mockResolvedValue({ id: 'loc-1' });
      await expect(service.assertBusinessInAdminScope(cityAdmin, 'biz-multi')).resolves.toBeUndefined();
      expect(prisma.businessLocation.findFirst).toHaveBeenCalledWith({
        where: { businessId: 'biz-multi', cityId: { in: ['city-a', 'city-b'] } },
        select: { id: true },
      });
    });

    it('CITY_ADMIN allowed when only secondary branch in scoped city', async () => {
      prisma.businessLocation.findFirst.mockResolvedValue({ id: 'loc-2' });
      await expect(service.assertBusinessInAdminScope(cityAdmin, 'biz-multi')).resolves.toBeUndefined();
    });

    it('CITY_ADMIN rejected when no branch in scoped cities', async () => {
      prisma.businessLocation.findFirst.mockResolvedValue(null);
      await expect(service.assertBusinessInAdminScope(cityAdmin, 'biz-other')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('assertBusinessParentCityInAdminScope uses parent Business.cityId only', async () => {
      await expect(
        service.assertBusinessParentCityInAdminScope(cityAdmin, 'city-a'),
      ).resolves.toBeUndefined();
      await expect(
        service.assertBusinessParentCityInAdminScope(cityAdmin, 'city-c'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.businessLocation.findFirst).not.toHaveBeenCalled();
    });

    it('assertCityInAdminScope rejects out-of-scope city id', async () => {
      await expect(service.assertCityInAdminScope(cityAdmin, 'city-c')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
