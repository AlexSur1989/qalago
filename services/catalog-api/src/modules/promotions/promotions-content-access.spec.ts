import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BusinessPermission, PromotionStatus, UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { PrismaService } from '../../prisma/prisma.service';
import { asAuditLogService, createMockAuditLog } from '../../test-utils/mock-audit-log';
import { PromotionsService } from './promotions.service';

describe('PromotionsService — content access (BIZ.5)', () => {
  const user = { id: 'u1', sub: 'u1', role: UserRole.BUSINESS, phone: '+1' } as AuthUser;

  function buildService() {
    const findUnique = jest.fn().mockResolvedValue({
      id: 'p1',
      businessId: 'b1',
      status: PromotionStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(),
    });
    const promotionUpdate = jest.fn().mockResolvedValue({ id: 'p9', businessId: 'b-owned' });
    const prisma = {
      promotion: { findUnique, update: promotionUpdate, create: jest.fn() },
      promotionBranchAvailability: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) =>
        fn({
          promotion: {
            create: jest.fn().mockResolvedValue({ id: 'p-new', businessId: 'b1' }),
            update: promotionUpdate,
          },
        }),
      ),
    } as unknown as PrismaService;
    const businessAccess = {
      assertBusinessPermission: jest.fn().mockResolvedValue(undefined),
    } as unknown as BusinessAccessService;
    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        limits: { maxPromotionDurationDays: 30 },
      }),
      assertCanCreatePromotion: jest.fn().mockResolvedValue(undefined),
      resolvePromotionDates: jest.fn().mockReturnValue({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-02-01'),
      }),
      assertCanActivatePromotion: jest.fn().mockResolvedValue(undefined),
    } as unknown as PlanLimitsService;
    const service = new PromotionsService(
      prisma,
      {} as CityScopeService,
      planLimits,
      businessAccess,
      asAuditLogService(createMockAuditLog()),
    );
    return { service, businessAccess, planLimits, findUnique };
  }

  it('create requires PROMOTIONS_EDIT and plan check', async () => {
    const { service, businessAccess, planLimits } = buildService();
    await service.create(user, {
      businessId: 'b1',
      title: 'Sale',
      discountText: '10%',
    });
    expect(businessAccess.assertBusinessPermission).toHaveBeenCalledWith(
      user,
      'b1',
      BusinessPermission.PROMOTIONS_EDIT,
    );
    expect(planLimits.assertCanCreatePromotion).toHaveBeenCalledWith('b1', true);
  });

  it('update scopes access to promotion.businessId', async () => {
    const { service, businessAccess, findUnique } = buildService();
    findUnique.mockResolvedValue({
      id: 'p9',
      businessId: 'b-owned',
      status: PromotionStatus.DRAFT,
      startDate: null,
      endDate: null,
    });
    await service.update(user, 'p9', { title: 'New title' });
    expect(businessAccess.assertBusinessPermission).toHaveBeenCalledWith(
      user,
      'b-owned',
      BusinessPermission.PROMOTIONS_EDIT,
    );
  });

  it('update missing promotion → NotFound', async () => {
    const { service, findUnique } = buildService();
    findUnique.mockResolvedValue(null);
    await expect(service.update(user, 'missing', { title: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('create propagates plan limit failure', async () => {
    const { service, planLimits } = buildService();
    (planLimits.assertCanCreatePromotion as jest.Mock).mockRejectedValue(
      new ForbiddenException('limit'),
    );
    await expect(
      service.create(user, { businessId: 'b1', title: 'X', discountText: '1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
