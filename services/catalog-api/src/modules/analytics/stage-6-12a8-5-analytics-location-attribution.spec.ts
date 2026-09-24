import { BadRequestException } from '@nestjs/common';
import { AnalyticsEventType } from '@prisma/client';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';
import {
  createMockBusinessAccess,
  asBusinessAccessService,
} from '../../test-utils/mock-business-access';
import { AdEventsService } from '../monetization/ad-events.service';

describe('Stage 6.12A.8.5 — analytics location attribution', () => {
  function createOrganicService() {
    const prisma = {
      business: { findFirst: jest.fn() },
      city: { findFirst: jest.fn() },
      promotion: { findFirst: jest.fn() },
      serviceItem: { findFirst: jest.fn() },
      businessLocation: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      analyticsEvent: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      analyticsBusinessVisitor: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const planLimits = {
      getBusinessPlanContext: jest.fn(),
      getAnalyticsCapabilities: jest.fn(),
    } as unknown as PlanLimitsService;

    const businessAccess = createMockBusinessAccess();

    return {
      prisma,
      service: new AnalyticsService(
        prisma as unknown as PrismaService,
        planLimits,
        asBusinessAccessService(businessAccess),
      ),
    };
  }

  it('1 — organic B + valid L(B) stored', async () => {
    const { prisma, service } = createOrganicService();
    prisma.business.findFirst.mockResolvedValue({ id: 'biz-b', cityId: 'city-1' });
    prisma.businessLocation.findFirst.mockImplementation(
      async (args: { select?: { cityId?: boolean; id?: boolean } }) => {
        if (args.select?.cityId) {
          return { cityId: 'city-b' };
        }
        return { id: 'loc-l2' };
      },
    );
    prisma.analyticsEvent.findUnique.mockResolvedValue(null);
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'e1' });

    await service.track({
      businessId: 'biz-b',
      type: AnalyticsEventType.VIEW_BUSINESS,
      businessLocationId: 'loc-l2',
      clientEventId: 'evt-valid-branch-1',
    });

    expect(prisma.businessLocation.findFirst).toHaveBeenCalledWith({
      where: { id: 'loc-l2', businessId: 'biz-b' },
      select: { id: true },
    });
    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessId: 'biz-b',
          businessLocationId: 'loc-l2',
          cityId: 'city-b',
        }),
      }),
    );
  });

  it('2 — organic B + L(other business) rejected', async () => {
    const { prisma, service } = createOrganicService();
    prisma.business.findFirst.mockResolvedValue({ id: 'biz-b', cityId: 'city-1' });
    prisma.businessLocation.findFirst.mockResolvedValue(null);
    prisma.analyticsEvent.findUnique.mockResolvedValue(null);

    await expect(
      service.track({
        businessId: 'biz-b',
        type: AnalyticsEventType.CALL_CLICK,
        businessLocationId: 'loc-other',
        clientEventId: 'evt-cross-biz-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.analyticsEvent.create).not.toHaveBeenCalled();
  });

  it('3 — organic without branch → location null', async () => {
    const { prisma, service } = createOrganicService();
    prisma.business.findFirst.mockResolvedValue({ id: 'biz-b', cityId: 'city-1' });
    prisma.analyticsEvent.findUnique.mockResolvedValue(null);
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'e1' });

    await service.track({
      businessId: 'biz-b',
      type: AnalyticsEventType.WHATSAPP_CLICK,
      clientEventId: 'evt-no-branch-1',
    });

    const payload = prisma.analyticsEvent.create.mock.calls[0][0].data;
    expect(payload.businessLocationId).toBeUndefined();
  });

  it('4 — SEARCH_PERFORMED with branch rejected', async () => {
    const { prisma, service } = createOrganicService();
    prisma.city.findFirst.mockResolvedValue({ id: 'city-1' });
    prisma.analyticsEvent.findUnique.mockResolvedValue(null);

    await expect(
      service.track({
        cityId: 'city-1',
        type: AnalyticsEventType.SEARCH_PERFORMED,
        searchQuery: 'coffee',
        businessLocationId: 'loc-l2',
        clientEventId: 'evt-search-branch-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('5 — FAVORITE_ADD with branch rejected', async () => {
    const { prisma, service } = createOrganicService();
    prisma.business.findFirst.mockResolvedValue({ id: 'biz-b', cityId: 'city-1' });
    prisma.analyticsEvent.findUnique.mockResolvedValue(null);

    await expect(
      service.track({
        businessId: 'biz-b',
        type: AnalyticsEventType.FAVORITE_ADD,
        businessLocationId: 'loc-l2',
        clientEventId: 'evt-fav-branch-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  describe('AdEventsService — server-derived branch', () => {
    function createAdPrisma() {
      return {
        adPlacement: { findUnique: jest.fn() },
        adCampaign: { findUnique: jest.fn(), update: jest.fn() },
        businessLocation: { findFirst: jest.fn() },
        analyticsEvent: { findFirst: jest.fn(), create: jest.fn() },
        $transaction: jest.fn(),
      };
    }

    it('7 — AD client event with explicit destination L2 stores L2', async () => {
      const prisma = createAdPrisma() as unknown as PrismaService;
      const service = new AdEventsService(prisma);
      prisma.adPlacement.findUnique = jest
        .fn()
        .mockResolvedValue({ id: 'pl-1', code: 'HOME_FEATURED' });
      prisma.adCampaign.findUnique = jest.fn().mockResolvedValue({
        id: 'camp-1',
        businessId: 'biz-b',
        destinationBusinessLocationId: 'loc-l2',
        campaignPlacements: [{ placementId: 'pl-1' }],
      });
      prisma.businessLocation.findFirst = jest.fn().mockResolvedValue({ id: 'loc-l2' });
      prisma.analyticsEvent.create = jest.fn().mockResolvedValue({});

      await service.trackEvent({
        campaignId: 'camp-1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        type: 'AD_CARD_OPEN',
      });

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            businessLocationId: 'loc-l2',
          }),
        }),
      );
    });

    it('8 — legacy city-wide ad without destination → null', async () => {
      const prisma = createAdPrisma() as unknown as PrismaService;
      const service = new AdEventsService(prisma);
      prisma.adPlacement.findUnique = jest
        .fn()
        .mockResolvedValue({ id: 'pl-1', code: 'HOME_FEATURED' });
      prisma.adCampaign.findUnique = jest.fn().mockResolvedValue({
        id: 'camp-1',
        businessId: 'biz-b',
        destinationBusinessLocationId: null,
        campaignPlacements: [{ placementId: 'pl-1' }],
      });
      prisma.analyticsEvent.create = jest.fn().mockResolvedValue({});
      prisma.adCampaign.update = jest.fn().mockResolvedValue({});
      prisma.$transaction = jest
        .fn()
        .mockImplementation((ops: unknown[]) =>
          Promise.all(ops as Promise<unknown>[]),
        );

      await service.trackEvent({
        campaignId: 'camp-1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        type: 'AD_CLICK',
      });

      const data = (prisma.analyticsEvent.create as jest.Mock).mock.calls[0][0].data;
      expect(data.businessLocationId).toBeUndefined();
      expect(prisma.businessLocation.findFirst).not.toHaveBeenCalled();
    });
  });
});
