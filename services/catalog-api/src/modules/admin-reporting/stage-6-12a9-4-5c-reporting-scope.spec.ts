import { UserRole } from '@prisma/client';
import { ReportingScopeService } from './reporting-scope.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('Stage 6.12A.9.4.5C — reporting scope city semantics', () => {
  const adminUser = {
    id: 'admin-1',
    sub: 'admin-1',
    phone: '+7',
    role: UserRole.ADMIN,
  } as const;

  it('business-scoped report with explicit cityId uses filter city not Business.cityId mirror', async () => {
    const prisma = {
      business: {
        findUnique: jest.fn().mockResolvedValue({ id: 'biz-1' }),
      },
    } as unknown as PrismaService;
    const cityScope = {
      assertBusinessInAdminScope: jest.fn().mockResolvedValue(undefined),
    } as unknown as CityScopeService;
    const service = new ReportingScopeService(prisma, cityScope);

    const scope = await service.resolveScope(adminUser, {
      businessId: 'biz-1',
      cityId: 'city-filter-b',
    });

    expect(scope).toEqual({ cityIds: ['city-filter-b'], businessId: 'biz-1' });
  });

  it('businessCityWhere uses ANY-BL presence for city filter', () => {
    const prisma = {} as PrismaService;
    const cityScope = {} as CityScopeService;
    const service = new ReportingScopeService(prisma, cityScope);

    const where = service.businessCityWhere({ cityIds: ['city-b'], businessId: 'biz-1' });
    expect(where).toEqual({
      locations: { some: { cityId: { in: ['city-b'] } } },
      id: 'biz-1',
    });
  });
});
