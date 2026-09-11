import {
  AdCampaignStatus,
  AdModerationStatus,
  MonetizationProductType,
  OrderStatus,
} from '@prisma/client';
import { ProductPurchaseStateService } from './product-purchase-state.service';

describe('ProductPurchaseStateService (Stage 6.7D)', () => {
  const access = {
    assertCanManageBusiness: jest.fn().mockResolvedValue(undefined),
  };
  const purchaseIntegrity = {
    resolveProductSchedule: jest.fn(),
  };
  const campaignStatus = {
    requiresCreative: jest.fn().mockReturnValue(false),
  };

  const prisma = {
    business: { findUniqueOrThrow: jest.fn() },
    monetizationProduct: { findMany: jest.fn() },
    adCampaign: { findMany: jest.fn() },
    order: { findMany: jest.fn() },
    adInventoryReservation: { findMany: jest.fn() },
  };

  const service = new ProductPurchaseStateService(
    prisma as never,
    access as never,
    purchaseIntegrity as never,
    campaignStatus as never,
  );

  const user = { id: 'u1', sub: 'u1', role: 'BUSINESS' as never, phone: '+7' };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.business.findUniqueOrThrow.mockResolvedValue({
      id: 'biz-1',
      cityId: 'city-1',
      categoryId: 'cat-1',
    });
    prisma.monetizationProduct.findMany.mockResolvedValue([
      {
        id: 'p1',
        code: 'TOP_CATEGORY',
        type: MonetizationProductType.TOP_CATEGORY,
      },
    ]);
    prisma.adCampaign.findMany.mockResolvedValue([]);
    prisma.adInventoryReservation.findMany.mockResolvedValue([]);
  });

  it('returns PENDING_PAYMENT with CONTINUE_PAYMENT when awaiting order exists', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'ord-1',
        items: [{ product: { code: 'TOP_CATEGORY' } }],
      },
    ]);

    const states = await service.listForBusiness(user, 'biz-1');
    expect(states[0].state).toBe('PENDING_PAYMENT');
    expect(states[0].primaryAction).toBe('CONTINUE_PAYMENT');
    expect(states[0].pendingOrderId).toBe('ord-1');
  });

  it('returns ACTIVE with RENEW when campaign is live', async () => {
    prisma.order.findMany.mockResolvedValue([]);
    const now = new Date();
    prisma.adCampaign.findMany.mockResolvedValue([
      {
        id: 'camp-1',
        productId: 'p1',
        status: AdCampaignStatus.ACTIVE,
        startAt: new Date(now.getTime() - 3600_000),
        endAt: new Date(now.getTime() + 86400_000),
        creative: null,
        product: { code: 'TOP_CATEGORY' },
        campaignPlacements: [],
      },
    ]);

    const states = await service.listForBusiness(user, 'biz-1');
    expect(states[0].state).toBe('ACTIVE');
    expect(states[0].primaryAction).toBe('RENEW');
    expect(states[0].activeUntil).toBeTruthy();
  });

  it('returns PENDING_APPROVAL for VIP awaiting moderation', async () => {
    campaignStatus.requiresCreative.mockReturnValue(true);
    prisma.order.findMany.mockResolvedValue([]);
    prisma.adCampaign.findMany.mockResolvedValue([
      {
        productId: 'p1',
        status: AdCampaignStatus.PENDING_MODERATION,
        startAt: new Date(),
        endAt: new Date(Date.now() + 86400_000),
        creative: { moderationStatus: AdModerationStatus.PENDING },
        product: { code: 'VIP_BANNER' },
        campaignPlacements: [],
      },
    ]);
    prisma.monetizationProduct.findMany.mockResolvedValue([
      {
        id: 'p1',
        code: 'VIP_BANNER',
        type: MonetizationProductType.VIP_BANNER,
      },
    ]);

    const states = await service.listForBusiness(user, 'biz-1');
    expect(states[0].state).toBe('PENDING_APPROVAL');
  });
});
