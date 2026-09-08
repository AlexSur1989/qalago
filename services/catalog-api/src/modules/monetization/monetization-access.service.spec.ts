import { UserRole } from '@prisma/client';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MonetizationAccessService } from './monetization-access.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';

describe('MonetizationAccessService RBAC', () => {
  const prisma = {
    business: { findUnique: jest.fn() },
    order: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    payment: { findUnique: jest.fn() },
  } as unknown as PrismaService;

  const cityScope = {
    assertBusinessInAdminScope: jest.fn(),
    resolveAdminCityId: jest.fn(),
  } as unknown as CityScopeService;

  const businessAccess = createMockBusinessAccess();

  const membership = {
    hasActiveOwnerAccess: jest.fn(),
  } as unknown as import('../../common/services/business-membership.service').BusinessMembershipService;

  const service = new MonetizationAccessService(
    prisma,
    cityScope,
    asBusinessAccessService(businessAccess),
    membership,
  );

  beforeEach(() => jest.clearAllMocks());

  it('39. CITY_ADMIN cannot access other city order', async () => {
    prisma.order.findUnique = jest.fn().mockResolvedValue({
      id: 'ord-1',
      business: { id: 'biz-1', ownerId: 'owner-1', cityId: 'city-other' },
      items: [],
      payments: [],
    });
    cityScope.assertBusinessInAdminScope = jest.fn().mockImplementation(() => {
      throw { response: { code: 'FORBIDDEN' } };
    });

    await expect(
      service.assertOrderAccess(
        { id: 'city-admin', role: UserRole.CITY_ADMIN, phone: '+7700', sub: 'city-admin' },
        'ord-1',
      ),
    ).rejects.toBeDefined();
    expect(cityScope.assertBusinessInAdminScope).toHaveBeenCalledWith(
      expect.anything(),
      'city-other',
    );
  });

  it('40. BUSINESS cannot confirm payments (admin only)', async () => {
    await expect(
      service.assertAdminPaymentAccess(
        { id: 'biz-user', role: UserRole.BUSINESS, phone: '+7700', sub: 'biz-user' },
        'pay-1',
      ),
    ).rejects.toMatchObject({ response: { code: 'BUSINESS_NOT_OWNED' } });
  });

  it('41. owner cannot access other business order', async () => {
    prisma.order.findUnique = jest.fn().mockResolvedValue({
      id: 'ord-1',
      business: { id: 'biz-2', ownerId: 'other-owner', cityId: 'city-1' },
      items: [],
      payments: [],
    });
    membership.hasActiveOwnerAccess = jest.fn().mockResolvedValue(false);

    await expect(
      service.assertOrderAccess(
        { id: 'user-1', role: UserRole.BUSINESS, phone: '+7700', sub: 'user-1' },
        'ord-1',
      ),
    ).rejects.toMatchObject({ response: { code: 'BUSINESS_NOT_OWNED' } });
  });
});
