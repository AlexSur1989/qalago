/**
 * 6.13M.4 — production plan billing (PlanPayment lifecycle).
 */
import { BusinessPlanTier, PlanPaymentStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { StaffPolicyService } from '../../common/services/staff-policy.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlansService } from './plans.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';

describe('6.13M.4 — plan billing foundation', () => {
  const notifications = { create: jest.fn().mockResolvedValue(undefined) };
  const staffPolicy = { assertPermission: jest.fn() };
  const cityScope = {
    resolveAdminCityId: jest.fn().mockResolvedValue(null),
    assertCityInAdminScope: jest.fn().mockResolvedValue(undefined),
  };

  const owner = { id: 'owner-1', phone: '+77001234567', role: 'BUSINESS' } as never;
  const admin = { id: 'admin-1', role: 'ADMIN' } as never;

  function buildService(overrides: {
    business?: { planTier: BusinessPlanTier; planExpiresAt: Date | null };
    tx?: Record<string, unknown>;
  } = {}) {
    const businessState = overrides.business ?? {
      planTier: BusinessPlanTier.FREE,
      planExpiresAt: null,
    };

    const tx = {
      business: {
        findUnique: jest.fn().mockResolvedValue(businessState),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'b1',
            planTier: data.planTier,
            planExpiresAt: data.planExpiresAt,
            isFeatured: false,
            featuredSlot: null,
          }),
        ),
      },
      planPayment: {
        create: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      ...overrides.tx,
    };

    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
      business: {
        findUnique: jest.fn().mockResolvedValue({ ...businessState, ownerId: 'owner-1', title: 'Cafe' }),
      },
      planPayment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
    } as unknown as PrismaService;

    const planLimits = {
      getCatalogItem: jest.fn().mockImplementation((tier: BusinessPlanTier) => ({
        nameRu: tier,
        priceKzt: tier === BusinessPlanTier.BASIC ? 4900 : 9900,
        periodDays: 30,
      })),
      isPaidTier: jest.fn().mockImplementation((tier: BusinessPlanTier) => tier !== BusinessPlanTier.FREE),
      getBusinessPlanContext: jest.fn().mockResolvedValue({ businessId: 'b1' }),
      resolveEffectiveTier: jest.fn(),
    } as unknown as PlanLimitsService;

    const config = {
      get: jest.fn((_k: string, def?: unknown) => def),
    } as unknown as ConfigService;

    const service = new PlansService(
      prisma,
      planLimits,
      notifications as never,
      asBusinessAccessService(createMockBusinessAccess()),
      asAuditLogService(createMockAuditLog()),
      config,
      cityScope as unknown as CityScopeService,
      staffPolicy as unknown as StaffPolicyService,
      { assertPurchasesAllowed: jest.fn() } as never,
    );

    return { service, prisma, tx, planLimits, notifications };
  }

  beforeEach(() => jest.clearAllMocks());

  it('mock checkout creates COMPLETED PlanPayment immediately', async () => {
    const txPlanCreate = jest.fn().mockResolvedValue({ id: 'pp-1' });
    const { prisma, planLimits } = buildService({
      tx: { planPayment: { create: txPlanCreate } },
    });
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'app.mockPlanCheckoutEnabled') return true;
        return undefined;
      }),
    } as unknown as ConfigService;

    const svc = new PlansService(
      prisma,
      planLimits,
      notifications as never,
      asBusinessAccessService(createMockBusinessAccess()),
      asAuditLogService(createMockAuditLog()),
      config,
      cityScope as unknown as CityScopeService,
      staffPolicy as unknown as StaffPolicyService,
      { assertPurchasesAllowed: jest.fn() } as never,
    );

    await svc.mockCheckout(owner, 'b1', BusinessPlanTier.PREMIUM);

    expect(txPlanCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: PlanPaymentStatus.COMPLETED,
          isMock: true,
        }),
      }),
    );
  });

  it('createPlanPurchase creates PENDING with catalog snapshots', async () => {
    const { service, prisma } = buildService();
    prisma.planPayment.create = jest.fn().mockResolvedValue({
      id: 'pp-new',
      businessId: 'b1',
      tier: BusinessPlanTier.BASIC,
      amountKzt: 4900,
      periodDays: 30,
      status: PlanPaymentStatus.PENDING,
      isMock: false,
      provider: 'MANUAL',
      providerReference: null,
      paidAt: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const row = await service.createPlanPurchase(owner, 'b1', BusinessPlanTier.BASIC);
    expect(row.status).toBe(PlanPaymentStatus.PENDING);
    expect(row.amountKzt).toBe(4900);
    expect(row.periodDays).toBe(30);
    expect(row.paidAt).toBeNull();
  });

  it('rejects FREE purchase', async () => {
    const { service } = buildService();
    await expect(service.createPlanPurchase(owner, 'b1', BusinessPlanTier.FREE)).rejects.toMatchObject({
      response: { code: 'PLAN_FREE_NOT_PURCHASABLE' },
    });
  });

  it('rejects downgrade while higher tier active', async () => {
    const { service } = buildService({
      business: {
        planTier: BusinessPlanTier.VIP,
        planExpiresAt: new Date('2099-01-01'),
      },
    });
    await expect(service.createPlanPurchase(owner, 'b1', BusinessPlanTier.BASIC)).rejects.toMatchObject({
      response: { code: 'PLAN_DOWNGRADE_NOT_ALLOWED' },
    });
  });

  it('same-tier renewal extends from current expiry', async () => {
    const { service } = buildService();
    const currentExpiry = new Date('2026-11-20T12:00:00.000Z');
    const activation = new Date('2026-10-31T12:00:00.000Z');

    const expiresAt = await service.computeEntitlementExpiresAt(
      {
        business: {
          findUnique: jest.fn().mockResolvedValue({
            planTier: BusinessPlanTier.PREMIUM,
            planExpiresAt: currentExpiry,
          }),
        },
      } as never,
      'b1',
      BusinessPlanTier.PREMIUM,
      30,
      activation,
    );

    expect(expiresAt.toISOString()).toBe('2026-12-20T12:00:00.000Z');
  });

  it('upgrade uses activation time + period', async () => {
    const { service } = buildService();
    const activation = new Date('2026-10-31T12:00:00.000Z');
    const expiresAt = await service.computeEntitlementExpiresAt(
      {
        business: {
          findUnique: jest.fn().mockResolvedValue({
            planTier: BusinessPlanTier.BASIC,
            planExpiresAt: new Date('2099-01-01'),
          }),
        },
      } as never,
      'b1',
      BusinessPlanTier.PREMIUM,
      30,
      activation,
    );
    expect(expiresAt.toISOString()).toBe('2026-11-30T12:00:00.000Z');
  });

  it('idempotency retry returns existing purchase without duplicate create', async () => {
    const existing = {
      id: 'pp-idem',
      businessId: 'b1',
      tier: BusinessPlanTier.BASIC,
      amountKzt: 4900,
      periodDays: 30,
      status: PlanPaymentStatus.PENDING,
      isMock: false,
      provider: 'MANUAL',
      providerReference: null,
      paidAt: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const { service, prisma } = buildService();
    prisma.planPayment.findUnique = jest.fn().mockResolvedValue(existing);
    const createSpy = jest.fn();
    prisma.planPayment.create = createSpy;

    const row = await service.createPlanPurchase(owner, 'b1', BusinessPlanTier.BASIC, 'idem-key-1');
    expect(row.id).toBe('pp-idem');
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('confirm PENDING → COMPLETED activates tier without creating PlanPayment', async () => {
    const pending = {
      id: 'pp-pending',
      businessId: 'b1',
      tier: BusinessPlanTier.BASIC,
      amountKzt: 4900,
      periodDays: 30,
      status: PlanPaymentStatus.PENDING,
      isMock: false,
      provider: 'MANUAL',
      providerReference: null,
      paidAt: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const txPlanCreate = jest.fn();
    const { service, prisma, tx, notifications } = buildService();
    prisma.planPayment.findUnique = jest
      .fn()
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce({
        ...pending,
        status: PlanPaymentStatus.COMPLETED,
        paidAt: new Date('2026-10-31T12:00:00.000Z'),
        expiresAt: new Date('2026-11-30T12:00:00.000Z'),
      });
    prisma.planPayment.findUniqueOrThrow = jest.fn().mockResolvedValue({
      ...pending,
      status: PlanPaymentStatus.COMPLETED,
      paidAt: new Date('2026-10-31T12:00:00.000Z'),
      expiresAt: new Date('2026-11-30T12:00:00.000Z'),
    });
    tx.planPayment.updateMany = jest.fn().mockResolvedValue({ count: 1 });
    tx.planPayment.update = jest.fn().mockResolvedValue({});
    tx.planPayment.create = txPlanCreate;

    const result = await service.confirmPlanPayment(admin, 'pp-pending');
    expect(result.alreadyCompleted).toBe(false);
    expect(txPlanCreate).not.toHaveBeenCalled();
    expect(tx.business.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ planTier: BusinessPlanTier.BASIC }),
      }),
    );
    expect(notifications.create).toHaveBeenCalledTimes(1);
  });

  it('cancelPlanPayment moves PENDING to CANCELLED', async () => {
    const pending = {
      id: 'pp-cancel',
      businessId: 'b1',
      tier: BusinessPlanTier.PREMIUM,
      amountKzt: 9900,
      periodDays: 30,
      status: PlanPaymentStatus.PENDING,
      isMock: false,
      provider: 'MANUAL',
      providerReference: null,
      paidAt: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const { service, prisma } = buildService();
    prisma.planPayment.findUnique = jest.fn().mockResolvedValue(pending);
    prisma.planPayment.updateMany = jest.fn().mockResolvedValue({ count: 1 });
    prisma.planPayment.findUniqueOrThrow = jest.fn().mockResolvedValue({
      ...pending,
      status: PlanPaymentStatus.CANCELLED,
    });

    const result = await service.cancelPlanPayment(admin, 'pp-cancel');
    expect(result.payment.status).toBe(PlanPaymentStatus.CANCELLED);
  });

  it('confirmPlanPayment rejects CANCELLED payment', async () => {
    const { service, prisma } = buildService();
    prisma.planPayment.findUnique = jest.fn().mockResolvedValue({
      id: 'pp-x',
      businessId: 'b1',
      tier: BusinessPlanTier.BASIC,
      amountKzt: 4900,
      periodDays: 30,
      status: PlanPaymentStatus.CANCELLED,
      isMock: false,
      provider: 'MANUAL',
      paidAt: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.confirmPlanPayment(admin, 'pp-x')).rejects.toMatchObject({
      response: { code: 'PLAN_PAYMENT_INVALID_STATUS' },
    });
  });

  it('createPlanPurchase does not touch advertising models', async () => {
    const { service, prisma } = buildService();
    prisma.planPayment.create = jest.fn().mockResolvedValue({
      id: 'pp-only',
      businessId: 'b1',
      tier: BusinessPlanTier.VIP,
      amountKzt: 19900,
      periodDays: 30,
      status: PlanPaymentStatus.PENDING,
      isMock: false,
      provider: 'MANUAL',
      providerReference: null,
      paidAt: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await service.createPlanPurchase(owner, 'b1', BusinessPlanTier.VIP);
    expect(prisma.planPayment.create).toHaveBeenCalledTimes(1);
  });

  it('entitlement failure prevents leaving payment completed outside transaction', async () => {
    const pending = {
      id: 'pp-fail',
      businessId: 'b1',
      tier: BusinessPlanTier.BASIC,
      amountKzt: 4900,
      periodDays: 30,
      status: PlanPaymentStatus.PENDING,
      isMock: false,
      provider: 'MANUAL',
      providerReference: null,
      paidAt: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { service, prisma, tx } = buildService();
    prisma.planPayment.findUnique = jest.fn().mockResolvedValue(pending);
    tx.planPayment.updateMany = jest.fn().mockResolvedValue({ count: 1 });
    tx.business.update = jest.fn().mockRejectedValue(new Error('activation failed'));
    (prisma as unknown as { $transaction: jest.Mock }).$transaction = jest.fn(
      async (fn: (t: typeof tx) => unknown) => fn(tx),
    );

    await expect(service.confirmPlanPayment(admin, 'pp-fail')).rejects.toThrow('activation failed');
    expect(tx.planPayment.updateMany).toHaveBeenCalled();
  });

  it('expired same-tier renewal starts from activation time', async () => {
    const { service } = buildService();
    const activation = new Date('2026-10-31T12:00:00.000Z');
    const expiresAt = await service.computeEntitlementExpiresAt(
      {
        business: {
          findUnique: jest.fn().mockResolvedValue({
            planTier: BusinessPlanTier.PREMIUM,
            planExpiresAt: new Date('2026-10-01T00:00:00.000Z'),
          }),
        },
      } as never,
      'b1',
      BusinessPlanTier.PREMIUM,
      30,
      activation,
    );
    expect(expiresAt.toISOString()).toBe('2026-11-30T12:00:00.000Z');
  });

  it('confirmPlanPayment is idempotent', async () => {
    const paidAt = new Date('2026-10-01T12:00:00.000Z');
    const pending = {
      id: 'pp-1',
      businessId: 'b1',
      tier: BusinessPlanTier.BASIC,
      amountKzt: 4900,
      periodDays: 30,
      status: PlanPaymentStatus.COMPLETED,
      isMock: false,
      provider: 'MANUAL',
      providerReference: null,
      paidAt,
      expiresAt: new Date('2026-11-01'),
      createdAt: paidAt,
      updatedAt: paidAt,
    };

    const { service, prisma } = buildService();
    prisma.planPayment.findUnique = jest.fn().mockResolvedValue(pending);

    const result = await service.confirmPlanPayment(admin, 'pp-1');
    expect(result.alreadyCompleted).toBe(true);
    expect(notifications.create).not.toHaveBeenCalled();
  });
});
