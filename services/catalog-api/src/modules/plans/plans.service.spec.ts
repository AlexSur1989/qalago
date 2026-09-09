import { BusinessPlanTier } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlansService } from './plans.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';

describe('PlansService — subscription vs paid visibility (Stage 4C.1)', () => {
  const notifications = { create: jest.fn().mockResolvedValue(undefined) };

  function createService(
    txOverrides: Record<string, unknown> = {},
    planLimitsOverrides: Partial<PlanLimitsService> = {},
    configOverrides: Record<string, unknown> = {},
  ) {
    const tx = {
      business: {
        update: jest.fn().mockResolvedValue({
          id: 'b1',
          planTier: BusinessPlanTier.PREMIUM,
          planExpiresAt: new Date('2099-01-01'),
          isFeatured: false,
          featuredSlot: null,
        }),
      },
      planPayment: { create: jest.fn() },
      adCampaign: { create: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn() },
      monetizationOrder: { create: jest.fn(), updateMany: jest.fn() },
      ...txOverrides,
    };

    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
      business: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'b1',
          ownerId: 'owner-1',
          title: 'Cafe',
        }),
      },
      promotion: { updateMany: jest.fn() },
    } as unknown as PrismaService;

    const planLimits = {
      getCatalogItem: jest.fn().mockImplementation((tier: BusinessPlanTier) => ({
        nameRu: tier,
        priceKzt: tier === BusinessPlanTier.FREE ? 0 : 9900,
        periodDays: 30,
      })),
      isPaidTier: jest.fn().mockImplementation((tier: BusinessPlanTier) => tier !== BusinessPlanTier.FREE),
      getBusinessPlanContext: jest.fn().mockResolvedValue({ businessId: 'b1' }),
      ...planLimitsOverrides,
    } as unknown as PlanLimitsService;

    const config = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        if (key === 'NODE_ENV') return configOverrides.nodeEnv ?? 'test';
        if (key === 'app.mockPlanCheckoutEnabled') {
          return configOverrides.mockPlanCheckoutEnabled ?? true;
        }
        return defaultValue;
      }),
    } as unknown as ConfigService;

    const service = new PlansService(
      prisma,
      planLimits,
      notifications as never,
      asBusinessAccessService(createMockBusinessAccess()),
      asAuditLogService(createMockAuditLog()),
      config,
    );
    return { service, tx, prisma };
  }

  beforeEach(() => jest.clearAllMocks());

  it.each([
    BusinessPlanTier.BASIC,
    BusinessPlanTier.PREMIUM,
    BusinessPlanTier.VIP,
  ])('%s activation does not set isFeatured or featuredSlot', async (tier) => {
    const { service, tx } = createService();
    await service.setBusinessTier('b1', tier, { isMock: true, skipPayment: false });

    expect(tx.business.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          planTier: tier,
        }),
      }),
    );
    const updateData = tx.business.update.mock.calls[0][0].data;
    expect(updateData).not.toHaveProperty('isFeatured');
    expect(updateData).not.toHaveProperty('featuredSlot');
  });

  it.each([
    BusinessPlanTier.PREMIUM,
    BusinessPlanTier.VIP,
  ])('%s activation does not create AdCampaign', async (tier) => {
    const { service, tx } = createService();
    await service.setBusinessTier('b1', tier, { isMock: true, skipPayment: false });

    expect(tx.adCampaign.create).not.toHaveBeenCalled();
    expect(tx.adCampaign.updateMany).not.toHaveBeenCalled();
    expect(tx.adCampaign.deleteMany).not.toHaveBeenCalled();
  });

  it('does not archive promotions on tier change', async () => {
    const { service, prisma } = createService();
    await service.setBusinessTier('b1', BusinessPlanTier.BASIC, { isMock: true, skipPayment: false });
    expect(prisma.promotion.updateMany).not.toHaveBeenCalled();
  });

  it('blocks mock checkout in production', async () => {
    const { service } = createService({}, {}, { nodeEnv: 'production', mockPlanCheckoutEnabled: true });
    await expect(
      service.mockCheckout(
        { id: 'owner-1', phone: '+77001234567', role: 'BUSINESS' } as never,
        'b1',
        BusinessPlanTier.PREMIUM,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows mock checkout in development when enabled', async () => {
    const { service } = createService({}, {}, { nodeEnv: 'development', mockPlanCheckoutEnabled: true });
    await expect(
      service.mockCheckout(
        { id: 'owner-1', phone: '+77001234567', role: 'BUSINESS' } as never,
        'b1',
        BusinessPlanTier.PREMIUM,
      ),
    ).resolves.toBeDefined();
  });
});
