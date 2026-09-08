import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SystemAccessService } from './system-access.service';

describe('SystemAccessService (Stage 5M.4)', () => {
  const prisma = {
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    city: {
      findUnique: jest.fn(),
    },
  };

  let service: SystemAccessService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SystemAccessService(prisma as never);
  });

  const superAdmin = {
    id: 'sa-1',
    sub: 'sa-1',
    role: UserRole.SUPER_ADMIN,
    phone: '+1',
  };

  const admin = {
    id: 'a-1',
    sub: 'a-1',
    role: UserRole.ADMIN,
    phone: '+2',
  };

  it('assertSuperAdmin allows SUPER_ADMIN', () => {
    expect(() => service.assertSuperAdmin(superAdmin)).not.toThrow();
  });

  it('assertSuperAdmin rejects ADMIN', () => {
    expect(() => service.assertSuperAdmin(admin)).toThrow(ForbiddenException);
  });

  it('assertCanDemoteSuperAdmin rejects last super admin', async () => {
    prisma.user.count.mockResolvedValue(0);
    await expect(service.assertCanDemoteSuperAdmin('only-sa')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('assertCanDemoteSuperAdmin allows when another super admin exists', async () => {
    prisma.user.count.mockResolvedValue(1);
    await expect(service.assertCanDemoteSuperAdmin('sa-1')).resolves.toBeUndefined();
  });

  it('validateCityAdminAssignment requires city', async () => {
    await expect(service.validateCityAdminAssignment(null)).rejects.toThrow(
      BadRequestException,
    );
  });
});
