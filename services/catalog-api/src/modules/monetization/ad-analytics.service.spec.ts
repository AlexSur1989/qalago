import { UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AdAnalyticsService } from './ad-analytics.service';
import { MonetizationAccessService } from './monetization-access.service';

describe('AdAnalyticsService', () => {
  const access = {
    assertCampaignAccess: jest.fn(),
  } as unknown as MonetizationAccessService;

  const prisma = {
    analyticsEvent: { groupBy: jest.fn() },
  } as unknown as PrismaService;

  const service = new AdAnalyticsService(prisma, access);

  const owner: AuthUser = {
    id: 'user-1',
    sub: 'user-1',
    phone: '+7700',
    role: UserRole.BUSINESS,
  };

  const campaign = {
    id: 'camp-1',
    servedCount: 1000,
    qualifiedImpressions: 200,
    clickCount: 10,
    business: { ownerId: 'user-1', cityId: 'city-1' },
    product: { type: 'FEATURED_BUSINESS' },
    creative: null,
    campaignPlacements: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    access.assertCampaignAccess = jest.fn().mockResolvedValue(campaign);
    prisma.analyticsEvent.groupBy = jest.fn().mockResolvedValue([
      { type: 'AD_CARD_OPEN', _count: { _all: 5 } },
      { type: 'AD_CALL_CLICK', _count: { _all: 2 } },
    ]);
  });

  it('30. CTR = clicks/impressions*100, 0 when impressions=0', async () => {
    const result = await service.getCampaignAnalytics(owner, 'camp-1');
    expect(result.ctr).toBe(5);
    expect(result.served).toBe(1000);
    expect(result.qualifiedImpressions).toBe(200);
    expect(result.clicks).toBe(10);
  });

  it('31. CTR is 0 when impressions are 0', async () => {
    access.assertCampaignAccess = jest.fn().mockResolvedValue({
      ...campaign,
      qualifiedImpressions: 0,
      clickCount: 0,
    });
    const result = await service.getCampaignAnalytics(owner, 'camp-1');
    expect(result.ctr).toBe(0);
  });

  it('32. action counts from AnalyticsEvent groupBy', async () => {
    const result = await service.getCampaignAnalytics(owner, 'camp-1');
    expect(result.actions.AD_CARD_OPEN).toBe(5);
    expect(result.actions.AD_CALL_CLICK).toBe(2);
    expect(result.actions.AD_ROUTE_CLICK).toBe(0);
  });

  it('33. RBAC via MonetizationAccessService', async () => {
    access.assertCampaignAccess = jest.fn().mockRejectedValue({
      response: { code: 'BUSINESS_NOT_OWNED' },
    });

    await expect(service.getCampaignAnalytics(owner, 'camp-1')).rejects.toMatchObject({
      response: { code: 'BUSINESS_NOT_OWNED' },
    });
  });
});
