/**
 * 6.13M.4A — auth, idempotency, and advertising/plan billing isolation.
 */
import { ForbiddenException } from '@nestjs/common';
import {
  BusinessPlanTier,
  OrderStatus,
  PaymentStatus,
  PlanPaymentStatus,
  UserRole,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { StaffPolicyService } from '../../common/services/staff-policy.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../monetization/availability.service';
import { CampaignProvisioningService } from '../monetization/campaign-provisioning.service';
import { MonetizationAccessService } from '../monetization/monetization-access.service';
import { OrderService } from '../monetization/order.service';
import { PricingService } from '../monetization/pricing.service';
import { PurchaseIntegrityService } from '../monetization/purchase-integrity.service';
import {
  createMockInventoryReservationService,
  createMockPackageSnapshotService,
} from '../monetization/test-utils/mock-order-deps-6-7c';
import { PlansService } from './plans.service';
import { PlanErrorCode } from './plans.errors';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';

describe('6.13M.4A — plan billing isolation & access', () => {
  const owner = { id: 'owner-1', phone: '+77001234567', role: UserRole.BUSINESS } as never;
  const stranger = { id: 'stranger-1', phone: '+77009999999', role: UserRole.BUSINESS } as never;
  const admin = { id: 'admin-1', role: UserRole.ADMIN } as never;

  function buildPlansService(overrides?: {
    businessAccess?: ReturnType<typeof createMockBusinessAccess>;
    prisma?: Partial<PrismaService>;
  }) {
    const businessAccess = overrides?.businessAccess ?? createMockBusinessAccess();
    const prisma = {
      planPayment: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      business: {
        findUnique: jest.fn().mockResolvedValue({
          planTier: BusinessPlanTier.FREE,
          planExpiresAt: null,
        }),
      },
      ...overrides?.prisma,
    } as unknown as PrismaService;

    const planLimits = {
      getCatalogItem: jest.fn().mockReturnValue({ priceKzt: 4900, periodDays: 30 }),
      isPaidTier: jest.fn().mockReturnValue(true),
      getBusinessPlanContext: jest.fn(),
    } as unknown as PlanLimitsService;

    const service = new PlansService(
      prisma,
      planLimits,
      { create: jest.fn() } as never,
      asBusinessAccessService(businessAccess),
      asAuditLogService(createMockAuditLog()),
      { get: jest.fn() } as unknown as ConfigService,
      { resolveAdminCityId: jest.fn(), assertCityInAdminScope: jest.fn() } as unknown as CityScopeService,
      { assertPermission: jest.fn() } as unknown as StaffPolicyService,
      { assertPurchasesAllowed: jest.fn() } as never,
    );
    return { service, prisma, businessAccess };
  }

  it('A — owner cannot create purchase for business they do not manage', async () => {
    const businessAccess = createMockBusinessAccess();
    businessAccess.assertOwner = jest
      .fn()
      .mockRejectedValue(new ForbiddenException('Owner access required'));
    const { service } = buildPlansService({ businessAccess });

    await expect(
      service.createPlanPurchase(stranger, 'b-other', BusinessPlanTier.BASIC),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(businessAccess.assertOwner).toHaveBeenCalled();
  });

  it('B — cross-business idempotency key returns conflict, not foreign purchase', async () => {
    const existing = {
      id: 'pp-a',
      businessId: 'business-a',
      tier: BusinessPlanTier.BASIC,
      amountKzt: 4900,
      periodDays: 30,
      status: PlanPaymentStatus.PENDING,
      isMock: false,
      provider: 'MANUAL',
      paidAt: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const prisma = {
      planPayment: {
        findUnique: jest.fn().mockResolvedValue(existing),
        create: jest.fn(),
      },
      business: {
        findUnique: jest.fn().mockResolvedValue({
          planTier: BusinessPlanTier.FREE,
          planExpiresAt: null,
        }),
      },
    };
    const { service } = buildPlansService({ prisma: prisma as unknown as PrismaService });

    await expect(
      service.createPlanPurchase(owner, 'business-b', BusinessPlanTier.BASIC, 'shared-key'),
    ).rejects.toMatchObject({
      response: { code: PlanErrorCode.PLAN_IDEMPOTENCY_CONFLICT },
    });
    expect(prisma.planPayment.create).not.toHaveBeenCalled();
  });

  it('C — advertising confirmManualPayment does not mutate PlanPayment or Business plan fields', async () => {
    const planPaymentUpdate = jest.fn();
    const planPaymentCreate = jest.fn();
    const businessUpdate = jest.fn();

    const prisma = {
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) =>
        fn({
          payment: {
            findUniqueOrThrow: jest.fn().mockResolvedValue({ status: PaymentStatus.PENDING }),
            update: jest.fn(),
          },
          order: {
            update: jest.fn(),
            findUniqueOrThrow: jest.fn().mockResolvedValue({
              id: 'ord-1',
              orderNumber: 'QLG-1',
              status: OrderStatus.PAID,
              subtotal: 1000,
              discountAmount: 0,
              totalAmount: 1000,
              currency: 'KZT',
              createdAt: new Date(),
              paidAt: new Date(),
              items: [],
              payments: [],
            }),
          },
          business: {
            update: businessUpdate,
            findUnique: jest.fn().mockResolvedValue({ cityId: 'city-1' }),
          },
          planPayment: {
            update: planPaymentUpdate,
            create: planPaymentCreate,
            updateMany: jest.fn(),
          },
        }),
      ),
      business: { findUnique: jest.fn().mockResolvedValue({ cityId: 'city-1' }) },
      payment: { findUnique: jest.fn() },
      order: { findUnique: jest.fn() },
    } as unknown as PrismaService;

    const access = {
      assertAdminPaymentAccess: jest.fn().mockResolvedValue({
        id: 'pay-ad-1',
        status: PaymentStatus.PENDING,
        amount: 1000,
        orderId: 'ord-1',
        order: {
          id: 'ord-1',
          businessId: 'biz-1',
          status: OrderStatus.AWAITING_PAYMENT,
          totalAmount: 1000,
        },
      }),
    };

    const orderService = new OrderService(
      prisma,
      access as unknown as MonetizationAccessService,
      {} as PricingService,
      {} as AvailabilityService,
      { provisionOrderCampaigns: jest.fn() } as unknown as CampaignProvisioningService,
      asAuditLogService(createMockAuditLog()),
      {} as PurchaseIntegrityService,
      createMockPackageSnapshotService(),
      createMockInventoryReservationService(),
      { assertPermission: jest.fn() } as never,
      { buildAdminBusinessScopeWhere: jest.fn() } as never,
      { assertPurchasesAllowed: jest.fn() } as never,
    );

    await orderService.confirmManualPayment(admin, 'pay-ad-1');

    expect(planPaymentCreate).not.toHaveBeenCalled();
    expect(planPaymentUpdate).not.toHaveBeenCalled();
    expect(businessUpdate).not.toHaveBeenCalled();
  });

  it('D — plan confirm does not call order provisioning hooks', async () => {
    const pending = {
      id: 'pp-1',
      businessId: 'b1',
      tier: BusinessPlanTier.BASIC,
      amountKzt: 4900,
      periodDays: 30,
      status: PlanPaymentStatus.PENDING,
      isMock: false,
      provider: 'MANUAL',
      paidAt: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orderCreate = jest.fn();
    const tx = {
      planPayment: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
        create: jest.fn(),
      },
      business: {
        findUnique: jest.fn().mockResolvedValue({
          planTier: BusinessPlanTier.FREE,
          planExpiresAt: null,
        }),
        update: jest.fn().mockResolvedValue({ id: 'b1', planTier: BusinessPlanTier.BASIC }),
      },
      order: { create: orderCreate },
      payment: { create: jest.fn() },
      adCampaign: { create: jest.fn() },
    };

    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
      planPayment: {
        findUnique: jest.fn().mockResolvedValue(pending),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          ...pending,
          status: PlanPaymentStatus.COMPLETED,
          paidAt: new Date(),
          expiresAt: new Date(),
        }),
      },
    } as unknown as PrismaService;

    const { service } = buildPlansService({ prisma });
    await service.confirmPlanPayment(admin, 'pp-1');

    expect(orderCreate).not.toHaveBeenCalled();
    expect(tx.adCampaign.create).not.toHaveBeenCalled();
    expect(tx.planPayment.create).not.toHaveBeenCalled();
  });
});
