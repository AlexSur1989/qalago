import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { AuthUser } from '../../common/types/jwt-payload.type';

describe('AdminService.getBusinessContent (Stage 6.12A.7.8.6)', () => {
  const adminUser: AuthUser = {
    id: 'admin-1',
    sub: 'admin-1',
    role: UserRole.ADMIN,
    phone: '+77001112233',
  };

  const cityScope = {
    resolveAdminCityId: jest.fn(),
    assertBusinessInAdminScope: jest.fn(),
  };

  let prisma: {
    business: { findUnique: jest.Mock };
    serviceItem: { findMany: jest.Mock };
    promotion: { findMany: jest.Mock };
    serviceItemBranchAvailability: { findMany: jest.Mock };
    promotionBranchAvailability: { findMany: jest.Mock };
    businessLocation: { findMany: jest.Mock };
  };

  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      business: { findUnique: jest.fn() },
      serviceItem: { findMany: jest.fn().mockResolvedValue([]) },
      promotion: { findMany: jest.fn().mockResolvedValue([]) },
      serviceItemBranchAvailability: { findMany: jest.fn().mockResolvedValue([]) },
      promotionBranchAvailability: { findMany: jest.fn().mockResolvedValue([]) },
      businessLocation: { findMany: jest.fn().mockResolvedValue([]) },
    };

    service = new AdminService(
      prisma as never,
      cityScope as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('returns 404 when business missing', async () => {
    prisma.business.findUnique.mockResolvedValue(null);
    await expect(service.getBusinessContent(adminUser, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('enforces city scope', async () => {
    prisma.business.findUnique.mockResolvedValue({
      id: 'b1',
      title: 'Bar',
      cityId: 'city-a',
      city: { slug: 'uralsk', nameRu: 'Уральск', nameKk: 'Орал' },
    });
    cityScope.assertBusinessInAdminScope.mockRejectedValue(new ForbiddenException('City scope'));
    await expect(service.getBusinessContent(adminUser, 'b1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('maps service items and promotions with branch scope', async () => {
    prisma.business.findUnique.mockResolvedValue({
      id: 'b1',
      title: 'Bar',
      cityId: 'city-a',
      city: { slug: 'uralsk', nameRu: 'Уральск', nameKk: 'Орал' },
    });
    cityScope.assertBusinessInAdminScope.mockResolvedValue(undefined);

    prisma.serviceItem.findMany.mockResolvedValue([
      {
        id: 'item-all',
        title: 'Shared',
        isActive: true,
        sortOrder: 1,
        group: { id: 'g1', title: 'Bar', sortOrder: 1 },
      },
      {
        id: 'item-sel',
        title: 'L2 only',
        isActive: false,
        sortOrder: 2,
        group: null,
      },
    ]);
    prisma.promotion.findMany.mockResolvedValue([
      {
        id: 'promo-1',
        title: 'Happy',
        status: 'ACTIVE',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-02-01'),
        moderationHidden: false,
      },
    ]);
    prisma.serviceItemBranchAvailability.findMany.mockResolvedValue([
      { serviceItemId: 'item-sel', locationId: 'loc-l2' },
    ]);
    prisma.promotionBranchAvailability.findMany.mockResolvedValue([]);
    prisma.businessLocation.findMany.mockResolvedValue([
      {
        id: 'loc-l2',
        address: 'пр. Абая, 88',
        isPrimary: false,
        city: { nameRu: 'Уральск', nameKk: 'Орал' },
      },
    ]);

    const result = await service.getBusinessContent(adminUser, 'b1');

    expect(result.business.title).toBe('Bar');
    expect(result.serviceItems[0]?.branchScope.mode).toBe('ALL');
    expect(result.serviceItems[1]?.branchScope.mode).toBe('SELECTED');
    expect(result.serviceItems[1]?.branchScope.branches[0]?.address).toBe('пр. Абая, 88');
    expect(result.promotions[0]?.branchScope.mode).toBe('ALL');
    expect(prisma.businessLocation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ businessId: 'b1', id: { in: ['loc-l2'] } }),
      }),
    );
  });
});
