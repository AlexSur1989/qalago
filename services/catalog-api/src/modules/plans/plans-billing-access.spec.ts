import 'reflect-metadata';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BusinessPermission, BusinessPlanTier, PlanPaymentStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PlansService } from './plans.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';

describe('PlansService billing access (BIZ.7)', () => {
  const owner = {
    id: 'owner-1',
    sub: 'owner-1',
    phone: '+7700',
    role: 'BUSINESS' as const,
  };
  const manager = {
    id: 'mgr-1',
    sub: 'mgr-1',
    phone: '+7701',
    role: 'USER' as const,
  };

  function buildService(options?: {
    assertBusinessPermission?: jest.Mock;
    assertOwner?: jest.Mock;
    planPayments?: unknown[];
    nodeEnv?: string;
    mockCheckoutEnabled?: boolean;
  }) {
    const businessAccess = {
      assertBusinessPermission:
        options?.assertBusinessPermission ??
        jest.fn().mockResolvedValue({ id: 'b1' }),
      assertOwner:
        options?.assertOwner ?? jest.fn().mockResolvedValue({ id: 'b1' }),
      resolveAccess: jest.fn(),
    };

    const prisma = {
      planPayment: {
        findMany: jest.fn().mockResolvedValue(options?.planPayments ?? []),
      },
      business: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    } as unknown as PrismaService;

    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({ businessId: 'b1' }),
      getCatalogItem: jest.fn(),
      isPaidTier: jest.fn(),
    } as unknown as PlanLimitsService;

    const config = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return options?.nodeEnv ?? 'development';
        if (key === 'app.mockPlanCheckoutEnabled') {
          return options?.mockCheckoutEnabled ?? true;
        }
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new PlansService(
      prisma,
      planLimits,
      { create: jest.fn() } as never,
      businessAccess as never,
      asAuditLogService(createMockAuditLog()),
      config,
      { resolveAdminCityId: jest.fn(), assertCityInAdminScope: jest.fn() } as never,
      { assertPermission: jest.fn() } as never,
    );

    return { service, businessAccess, prisma };
  }

  it('getBusinessPlan requires PAYMENTS_VIEW', async () => {
    const assertBusinessPermission = jest.fn().mockResolvedValue({ id: 'b1' });
    const { service, businessAccess } = buildService({ assertBusinessPermission });
    await service.getBusinessPlan(manager, 'b1');
    expect(businessAccess.assertBusinessPermission).toHaveBeenCalledWith(
      manager,
      'b1',
      BusinessPermission.PAYMENTS_VIEW,
    );
  });

  it('listPlanPayments scoped to businessId in query', async () => {
    const rows = [
      {
        id: 'pay-1',
        businessId: 'b1',
        tier: BusinessPlanTier.BASIC,
        amountKzt: 4900,
        status: PlanPaymentStatus.COMPLETED,
        isMock: true,
        paidAt: new Date(),
        expiresAt: new Date(),
        createdAt: new Date(),
      },
    ];
    const { service, prisma } = buildService({ planPayments: rows });
    const result = await service.listPlanPayments(owner, 'b1');
    expect(result.items).toEqual(rows);
    expect(prisma.planPayment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: 'b1' } }),
    );
  });

  it('listPlanPayments denied without PAYMENTS_VIEW', async () => {
    const assertBusinessPermission = jest
      .fn()
      .mockRejectedValue(new ForbiddenException('Insufficient permissions'));
    const { service } = buildService({ assertBusinessPermission });
    await expect(service.listPlanPayments(manager, 'b2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('mockCheckout requires owner (manager with PAYMENTS_VIEW cannot checkout)', async () => {
    const assertOwner = jest
      .fn()
      .mockRejectedValue(new ForbiddenException('Owner access required'));
    const { service } = buildService({ assertOwner });
    await expect(
      service.mockCheckout(manager, 'b1', BusinessPlanTier.PREMIUM),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('mockCheckout hidden in production', async () => {
    const { service } = buildService({
      nodeEnv: 'production',
      mockCheckoutEnabled: true,
    });
    await expect(
      service.mockCheckout(owner, 'b1', BusinessPlanTier.BASIC),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
