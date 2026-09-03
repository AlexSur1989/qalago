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
  };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      city: { findFirst: jest.fn() },
    };
    service = new CityScopeService(
      prisma as unknown as PrismaService,
      { get: jest.fn().mockReturnValue('uralsk') } as unknown as ConfigService,
    );
  });

  it('forces CITY_ADMIN to managed city', async () => {
    prisma.user.findUnique.mockResolvedValue({ managedCityId: 'city-aktobe' });

    await expect(
      service.resolveAdminCityId(
        { id: 'u1', role: UserRole.CITY_ADMIN, phone: '+7', sub: 'u1' },
        'uralsk',
      ),
    ).resolves.toBe('city-aktobe');
  });

  it('rejects CITY_ADMIN without managed city', async () => {
    prisma.user.findUnique.mockResolvedValue({ managedCityId: null });

    await expect(
      service.resolveAdminCityId(
        { id: 'u1', role: UserRole.CITY_ADMIN, phone: '+7', sub: 'u1' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
