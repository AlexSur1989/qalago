import { UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { PrismaService } from '../../prisma/prisma.service';
import { asAuditLogService, createMockAuditLog } from '../../test-utils/mock-audit-log';
import { PromotionsService } from './promotions.service';

/**
 * BIZ.9 HOTFIX 1 — owner GET /promotions?businessId= must not select retired Business geo.
 */
describe('PromotionsService — owner list geo retirement (BIZ.9 HOTFIX 1)', () => {
  const owner = {
    sub: 'owner-1',
    id: 'owner-1',
    role: UserRole.BUSINESS,
    phone: '+77000000002',
  } as AuthUser;

  const businessId = 'b-pending-bistro';

  function buildService(options?: { promotionRows?: unknown[]; canManage?: boolean }) {
    const findMany = jest.fn().mockResolvedValue(options?.promotionRows ?? []);
    const count = jest.fn().mockResolvedValue(options?.promotionRows?.length ?? 0);
    const prisma = {
      promotion: { findMany, count },
      promotionBranchAvailability: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;

    const businessAccess = {
      assertBusinessPermission: jest.fn().mockResolvedValue(undefined),
      hasBusinessPermission: jest
        .fn()
        .mockResolvedValue(options?.canManage ?? true),
    } as unknown as BusinessAccessService;

    const cityScope = {
      resolveCityId: jest.fn(),
    } as unknown as CityScopeService;

    const planLimits = {} as unknown as PlanLimitsService;

    const service = new PromotionsService(
      prisma,
      cityScope,
      planLimits,
      businessAccess,
      asAuditLogService(createMockAuditLog()),
    );

    return { service, findMany, count, businessAccess };
  }

  beforeEach(() => jest.clearAllMocks());

  it('owner manage list uses schema-valid Business select (no cityId)', async () => {
    const { service, findMany } = buildService();
    await service.findAll({ businessId, page: 1, limit: 50 }, owner);

    expect(findMany).toHaveBeenCalled();
    const call = findMany.mock.calls[0][0] as {
      include?: { business?: { select?: Record<string, boolean> } };
    };
    const select = call.include?.business?.select ?? {};
    expect(select).toEqual({
      id: true,
      title: true,
      slug: true,
      coverImageUrl: true,
    });
    expect(select).not.toHaveProperty('cityId');
    expect(select).not.toHaveProperty('address');
    expect(select).not.toHaveProperty('latitude');
    expect(select).not.toHaveProperty('longitude');
  });

  it('owner with zero promotions returns successful empty result', async () => {
    const { service } = buildService({ promotionRows: [] });
    const result = await service.findAll({ businessId, page: 1, limit: 50 }, owner);
    expect(result.items).toEqual([]);
    expect(result.meta).toEqual(
      expect.objectContaining({ page: 1, limit: 50, total: 0, totalPages: 0 }),
    );
  });

  it('public city feed path still uses promotionFeedBusinessSelect (unchanged)', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      promotion: { findMany, count: jest.fn() },
      promotionBranchAvailability: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;

    const cityScope = {
      resolveCityId: jest.fn().mockResolvedValue('city-uralsk'),
    } as unknown as CityScopeService;

    const businessAccess = {
      hasBusinessPermission: jest.fn().mockResolvedValue(false),
    } as unknown as BusinessAccessService;

    const planLimits = {
      getBusinessPlanContext: jest.fn(),
      applyPublicPromotionLimit: jest.fn(),
    } as unknown as PlanLimitsService;

    const service = new PromotionsService(
      prisma,
      cityScope,
      planLimits,
      businessAccess,
      asAuditLogService(createMockAuditLog()),
    );

    await service.findAll(
      { citySlug: 'uralsk', page: 1, limit: 20, activeNow: true },
      undefined,
    );

    expect(findMany).toHaveBeenCalled();
    const select = (findMany.mock.calls[0][0] as { include: { business: { select: object } } })
      .include.business.select;
    expect(select).toHaveProperty('planTier', true);
    expect(select).not.toHaveProperty('cityId');
  });
});
