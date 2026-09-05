import { UserRole } from '@prisma/client';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MonetizationAccessService } from './monetization-access.service';

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

  const service = new MonetizationAccessService(prisma, cityScope);

  beforeEach(() => jest.clearAllMocks());

  it('39. CITY_ADMIN cannot access other city order', async () => {
    prisma.order.findUnique = jest.fn().mockResolvedValue({
      id: 'ord-1',
      business: { ownerId: 'owner-1', cityId: 'city-other' },
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
      business: { ownerId: 'other-owner', cityId: 'city-1' },
      items: [],
      payments: [],
    });

    await expect(
      service.assertOrderAccess(
        { id: 'user-1', role: UserRole.BUSINESS, phone: '+7700', sub: 'user-1' },
        'ord-1',
      ),
    ).rejects.toMatchObject({ response: { code: 'BUSINESS_NOT_OWNED' } });
  });
});
