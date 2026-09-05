import { AnalyticsEventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IMPRESSION_DEDUPE_WINDOW_MS } from './constants/monetization.constants';
import { AdEventsService } from './ad-events.service';

describe('AdEventsService', () => {
  const prisma = {
    adPlacement: { findUnique: jest.fn() },
    adCampaign: { findUnique: jest.fn(), update: jest.fn() },
    analyticsEvent: { findFirst: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  const service = new AdEventsService(prisma);

  const placement = { id: 'pl-1', code: 'HOME_FEATURED' };
  const campaign = {
    id: 'camp-1',
    businessId: 'biz-1',
    campaignPlacements: [{ placementId: 'pl-1' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.adPlacement.findUnique = jest.fn().mockResolvedValue(placement);
    prisma.adCampaign.findUnique = jest.fn().mockResolvedValue(campaign);
    prisma.analyticsEvent.findFirst = jest.fn().mockResolvedValue(null);
    prisma.analyticsEvent.create = jest.fn().mockResolvedValue({});
    prisma.adCampaign.update = jest.fn().mockResolvedValue({});
    prisma.$transaction = jest
      .fn()
      .mockImplementation((ops: unknown[]) =>
        Promise.all(ops as Promise<unknown>[]),
      );
  });

  it('21. AD_IMPRESSION dedupes within 30min window', async () => {
    prisma.analyticsEvent.findFirst = jest.fn().mockResolvedValue({ id: 'dup' });

    const result = await service.trackEvent({
      campaignId: 'camp-1',
      placementCode: 'HOME_FEATURED',
      sessionId: 'sess-1',
      type: 'AD_IMPRESSION',
    });

    expect(result).toEqual({ recorded: false, duplicate: true });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.analyticsEvent.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: AnalyticsEventType.AD_IMPRESSION,
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
      }),
    );
    const call = (prisma.analyticsEvent.findFirst as jest.Mock).mock.calls[0][0];
    const since: Date = call.where.createdAt.gte;
    expect(Date.now() - since.getTime()).toBeLessThanOrEqual(
      IMPRESSION_DEDUPE_WINDOW_MS + 1000,
    );
  });

  it('22. AD_IMPRESSION increments qualifiedImpressions', async () => {
    await service.trackEvent({
      campaignId: 'camp-1',
      placementCode: 'HOME_FEATURED',
      sessionId: 'sess-1',
      type: 'AD_IMPRESSION',
    });

    expect(prisma.adCampaign.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          qualifiedImpressions: { increment: 1 },
        }),
      }),
    );
  });

  it('23. AD_IMPRESSION position=1 updates lastTopPositionAt', async () => {
    await service.trackEvent({
      campaignId: 'camp-1',
      placementCode: 'HOME_FEATURED',
      sessionId: 'sess-1',
      type: 'AD_IMPRESSION',
      position: 1,
    });

    expect(prisma.adCampaign.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastTopPositionAt: expect.any(Date),
        }),
      }),
    );
  });

  it('24. AD_CLICK increments clickCount', async () => {
    await service.trackEvent({
      campaignId: 'camp-1',
      placementCode: 'HOME_FEATURED',
      sessionId: 'sess-1',
      type: 'AD_CLICK',
    });

    expect(prisma.adCampaign.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { clickCount: { increment: 1 } },
      }),
    );
  });

  it('25. action events store AnalyticsEvent only', async () => {
    await service.trackEvent({
      campaignId: 'camp-1',
      placementCode: 'HOME_FEATURED',
      sessionId: 'sess-1',
      type: 'AD_CARD_OPEN',
    });

    expect(prisma.adCampaign.update).not.toHaveBeenCalled();
    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: AnalyticsEventType.AD_CARD_OPEN }),
      }),
    );
  });

  it('26. rejects invalid sessionId', async () => {
    await expect(
      service.trackEvent({
        campaignId: 'camp-1',
        placementCode: 'HOME_FEATURED',
        sessionId: '',
        type: 'AD_CLICK',
      }),
    ).rejects.toMatchObject({
      response: { code: 'INVALID_SESSION_ID' },
    });
  });

  it('27. rejects campaign/placement mismatch', async () => {
    prisma.adCampaign.findUnique = jest.fn().mockResolvedValue({
      ...campaign,
      campaignPlacements: [],
    });

    await expect(
      service.trackEvent({
        campaignId: 'camp-1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        type: 'AD_CLICK',
      }),
    ).rejects.toMatchObject({
      response: { code: 'CAMPAIGN_PLACEMENT_MISMATCH' },
    });
  });

  it('28. rejects invalid event type', async () => {
    await expect(
      service.trackEvent({
        campaignId: 'camp-1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        type: 'AD_SERVED' as 'AD_CLICK',
      }),
    ).rejects.toMatchObject({
      response: { code: 'INVALID_EVENT_TYPE' },
    });
  });

  it('29. concurrent impression mock — transaction bundles update+create', async () => {
    await service.trackEvent({
      campaignId: 'camp-1',
      placementCode: 'HOME_FEATURED',
      sessionId: 'sess-1',
      type: 'AD_IMPRESSION',
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect((prisma.$transaction as jest.Mock).mock.calls[0][0]).toHaveLength(2);
  });
});
