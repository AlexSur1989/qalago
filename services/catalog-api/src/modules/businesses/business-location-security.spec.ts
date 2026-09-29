import 'reflect-metadata';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BusinessPermission } from '@prisma/client';
import { BusinessLocationService } from './business-location.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';

describe('BusinessLocationService security (BIZ.8)', () => {
  const manager = {
    id: 'manager-1',
    sub: 'manager-1',
    phone: '+7700',
    role: 'USER' as const,
  };

  function buildService(options?: {
    locationRow?: unknown | null;
    managerPermissions?: BusinessPermission[];
  }) {
    const businessAccess = createMockBusinessAccess({
      managerPermissions:
        options?.managerPermissions ?? [BusinessPermission.BUSINESS_PROFILE_EDIT],
    });
    const prisma = {
      businessLocation: {
        findFirst: jest.fn().mockResolvedValue(options?.locationRow ?? null),
      },
    } as unknown as PrismaService;

    const service = new BusinessLocationService(
      prisma,
      asBusinessAccessService(businessAccess),
      {} as never,
    );
    return { service, businessAccess, prisma };
  }

  it('foreign locationId under business path → NotFound (IDOR)', async () => {
    const { service } = buildService({ locationRow: null });
    await expect(
      service.updateLocation(manager, 'b1', 'loc-foreign', { address: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('denies delete when membership permission missing (before DB)', async () => {
    const { service } = buildService({ managerPermissions: [BusinessPermission.CATALOG_EDIT] });
    await expect(
      service.deleteLocation(manager, 'b1', 'loc-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
