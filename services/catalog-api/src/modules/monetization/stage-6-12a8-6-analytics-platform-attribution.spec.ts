import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  AnalyticsEventType,
  AnalyticsPlatform,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdEventsService } from './ad-events.service';
import { AdRotationService } from './ad-rotation.service';
import { AdServingService } from './ad-serving.service';
import {
  ServeAdsQueryDto,
  TrackAdEventDto,
} from './dto/monetization.dto';

describe('Stage 6.12A.8.6 — ad analytics platform attribution', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidUnknownValues: false,
  });

  function createAdEventsPrisma() {
    return {
      adPlacement: { findUnique: jest.fn() },
      adCampaign: { findUnique: jest.fn(), update: jest.fn() },
      businessLocation: { findFirst: jest.fn() },
      analyticsEvent: { findFirst: jest.fn(), create: jest.fn() },
      $transaction: jest.fn(),
    };
  }

  const placement = { id: 'pl-1', code: 'HOME_FEATURED' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TrackAdEventDto validation', () => {
    it('1 — platform ANDROID accepted', async () => {
      const dto = await validationPipe.transform(
        plainToInstance(TrackAdEventDto, {
          campaignId: 'c1',
          placementCode: 'HOME_FEATURED',
          sessionId: 'sess-1',
          type: 'AD_IMPRESSION',
          platform: AnalyticsPlatform.ANDROID,
        }),
        { type: 'body', metatype: TrackAdEventDto },
      );
      expect(dto.platform).toBe(AnalyticsPlatform.ANDROID);
    });

    it('7 — invalid platform rejected at DTO layer', async () => {
      await expect(
        validationPipe.transform(
          plainToInstance(TrackAdEventDto, {
            campaignId: 'c1',
            placementCode: 'HOME_FEATURED',
            sessionId: 'sess-1',
            type: 'AD_IMPRESSION',
            platform: 'WINDOWS',
          }),
          { type: 'body', metatype: TrackAdEventDto },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('AdEventsService persistence', () => {
    function setupAdEvents() {
      const prisma = createAdEventsPrisma() as unknown as PrismaService;
      const service = new AdEventsService(prisma);
      prisma.adPlacement.findUnique = jest.fn().mockResolvedValue(placement);
      prisma.analyticsEvent.findFirst = jest.fn().mockResolvedValue(null);
      prisma.analyticsEvent.create = jest.fn().mockResolvedValue({});
      prisma.adCampaign.update = jest.fn().mockResolvedValue({});
      prisma.$transaction = jest
        .fn()
        .mockImplementation((ops: unknown[]) =>
          Promise.all(ops as Promise<unknown>[]),
        );
      return { prisma, service };
    }

    it('2 — AD_IMPRESSION + ANDROID → platform ANDROID', async () => {
      const { prisma, service } = setupAdEvents();
      prisma.adCampaign.findUnique = jest.fn().mockResolvedValue({
        id: 'camp-1',
        businessId: 'biz-1',
        destinationBusinessLocationId: null,
        campaignPlacements: [{ placementId: 'pl-1' }],
      });

      await service.trackEvent({
        campaignId: 'camp-1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        type: 'AD_IMPRESSION',
        platform: AnalyticsPlatform.ANDROID,
      });

      const data = (prisma.analyticsEvent.create as jest.Mock).mock.calls[0][0]
        .data;
      expect(data.platform).toBe(AnalyticsPlatform.ANDROID);
    });

    it('3 — AD_CLICK + IOS → IOS', async () => {
      const { prisma, service } = setupAdEvents();
      prisma.adCampaign.findUnique = jest.fn().mockResolvedValue({
        id: 'camp-1',
        businessId: 'biz-1',
        destinationBusinessLocationId: null,
        campaignPlacements: [{ placementId: 'pl-1' }],
      });

      await service.trackEvent({
        campaignId: 'camp-1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        type: 'AD_CLICK',
        platform: AnalyticsPlatform.IOS,
      });

      const data = (prisma.analyticsEvent.create as jest.Mock).mock.calls[0][0]
        .data;
      expect(data.platform).toBe(AnalyticsPlatform.IOS);
    });

    it('4 — AD_CARD_OPEN + WEB → WEB', async () => {
      const { prisma, service } = setupAdEvents();
      prisma.adCampaign.findUnique = jest.fn().mockResolvedValue({
        id: 'camp-1',
        businessId: 'biz-1',
        destinationBusinessLocationId: null,
        campaignPlacements: [{ placementId: 'pl-1' }],
      });

      await service.trackEvent({
        campaignId: 'camp-1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        type: 'AD_CARD_OPEN',
        platform: AnalyticsPlatform.WEB,
      });

      const data = (prisma.analyticsEvent.create as jest.Mock).mock.calls[0][0]
        .data;
      expect(data.platform).toBe(AnalyticsPlatform.WEB);
    });

    it('5 — AD_PROMOTION_OPEN + UNKNOWN → UNKNOWN', async () => {
      const { prisma, service } = setupAdEvents();
      prisma.adCampaign.findUnique = jest.fn().mockResolvedValue({
        id: 'camp-1',
        businessId: 'biz-1',
        destinationBusinessLocationId: null,
        campaignPlacements: [{ placementId: 'pl-1' }],
      });

      await service.trackEvent({
        campaignId: 'camp-1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        type: 'AD_PROMOTION_OPEN',
        platform: AnalyticsPlatform.UNKNOWN,
      });

      const data = (prisma.analyticsEvent.create as jest.Mock).mock.calls[0][0]
        .data;
      expect(data.platform).toBe(AnalyticsPlatform.UNKNOWN);
    });

    it('6 — omitted platform → accepted, stored null', async () => {
      const { prisma, service } = setupAdEvents();
      prisma.adCampaign.findUnique = jest.fn().mockResolvedValue({
        id: 'camp-1',
        businessId: 'biz-1',
        destinationBusinessLocationId: null,
        campaignPlacements: [{ placementId: 'pl-1' }],
      });

      await service.trackEvent({
        campaignId: 'camp-1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        type: 'AD_CLICK',
      });

      const data = (prisma.analyticsEvent.create as jest.Mock).mock.calls[0][0]
        .data;
      expect(data.platform).toBeUndefined();
    });

    it('11 — AD_IMPRESSION ANDROID + explicit destination L2 → both fields', async () => {
      const { prisma, service } = setupAdEvents();
      prisma.adCampaign.findUnique = jest.fn().mockResolvedValue({
        id: 'camp-1',
        businessId: 'biz-b',
        destinationBusinessLocationId: 'loc-l2',
        campaignPlacements: [{ placementId: 'pl-1' }],
      });
      prisma.businessLocation.findFirst = jest
        .fn()
        .mockResolvedValue({ id: 'loc-l2' });

      await service.trackEvent({
        campaignId: 'camp-1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        type: 'AD_IMPRESSION',
        platform: AnalyticsPlatform.ANDROID,
      });

      const data = (prisma.analyticsEvent.create as jest.Mock).mock.calls[0][0]
        .data;
      expect(data.platform).toBe(AnalyticsPlatform.ANDROID);
      expect(data.businessLocationId).toBe('loc-l2');
    });

    it('12 — campaign counters unchanged when platform set', async () => {
      const { prisma, service } = setupAdEvents();
      prisma.adCampaign.findUnique = jest.fn().mockResolvedValue({
        id: 'camp-1',
        businessId: 'biz-1',
        destinationBusinessLocationId: null,
        campaignPlacements: [{ placementId: 'pl-1' }],
      });

      await service.trackEvent({
        campaignId: 'camp-1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        type: 'AD_CLICK',
        platform: AnalyticsPlatform.ANDROID,
      });

      expect(prisma.adCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { clickCount: { increment: 1 } },
        }),
      );
    });

    it('13 — impression dedupe still skips duplicate (no extra create)', async () => {
      const { prisma, service } = setupAdEvents();
      prisma.adCampaign.findUnique = jest.fn().mockResolvedValue({
        id: 'camp-1',
        businessId: 'biz-1',
        destinationBusinessLocationId: null,
        campaignPlacements: [{ placementId: 'pl-1' }],
      });
      prisma.analyticsEvent.findFirst = jest
        .fn()
        .mockResolvedValue({ id: 'dup' });

      const result = await service.trackEvent({
        campaignId: 'camp-1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        type: 'AD_IMPRESSION',
        platform: AnalyticsPlatform.ANDROID,
      });

      expect(result).toEqual({ recorded: false, duplicate: true });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('AdServingService AD_SERVED platform', () => {
    const cityScope = {
      resolveCityId: jest.fn().mockResolvedValue('city-1'),
    };
    const rotation = new AdRotationService();

    const basePlacement = {
      id: 'pl-1',
      code: 'HOME_FEATURED',
      isActive: true,
      maxVisible: 3,
    };

    const activeCampaign = {
      id: 'camp-1',
      businessId: 'biz-1',
      cityId: 'city-1',
      promotionId: null,
      targetBusinessLocationId: null,
      destinationBusinessLocationId: 'loc-l2',
      qualifiedImpressions: 0,
      weight: 1,
      lastTopPositionAt: null,
      status: 'ACTIVE',
      startAt: new Date('2026-01-01'),
      endAt: new Date('2027-01-01'),
      product: {
        id: 'prod-1',
        code: 'FEATURED_BUSINESS',
        type: 'FEATURED_BUSINESS',
        isActive: true,
      },
      creative: null,
      business: {
        id: 'biz-1',
        title: 'Cafe',
        slug: 'cafe',
        shortDesc: 'Nice',
        cityId: 'city-1',
        workHours: null,
        address: 'Street 1',
        latitude: null,
        longitude: null,
        phone: '+7',
        whatsapp: null,
        instagram: null,
        website: null,
        coverImageUrl: null,
        categoryId: 'cat-1',
        category: { id: 'cat-1', title: 'Food', slug: 'food', icon: null },
      },
      orderItem: null,
      campaignPlacements: [
        { placement: { code: 'HOME_FEATURED' }, placementId: 'pl-1' },
      ],
    };

    function createServingPrisma() {
      return {
        adPlacement: { findUnique: jest.fn() },
        adCampaign: { findMany: jest.fn(), update: jest.fn() },
        analyticsEvent: { create: jest.fn() },
        promotion: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
        businessLocation: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'loc-l2',
              businessId: 'biz-1',
              cityId: 'city-1',
              isActive: true,
              isPrimary: true,
            },
          ]),
        },
        $transaction: jest.fn(),
      };
    }

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('8 — serve platform=ANDROID → AD_SERVED.platform ANDROID', async () => {
      const prisma = createServingPrisma() as unknown as PrismaService;
      prisma.adPlacement.findUnique = jest.fn().mockResolvedValue(basePlacement);
      prisma.adCampaign.findMany = jest.fn().mockResolvedValue([activeCampaign]);
      prisma.adCampaign.update = jest.fn().mockResolvedValue({});
      prisma.analyticsEvent.create = jest.fn().mockResolvedValue({});
      prisma.$transaction = jest
        .fn()
        .mockImplementation((ops: unknown[]) =>
          Promise.all(ops as Promise<unknown>[]),
        );

      const serving = new AdServingService(
        prisma,
        cityScope as never,
        rotation,
      );

      await serving.serveAds({
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        citySlug: 'uralsk',
        platform: AnalyticsPlatform.ANDROID,
      });

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: AnalyticsEventType.AD_SERVED,
            platform: AnalyticsPlatform.ANDROID,
          }),
        }),
      );
    });

    it('9 — serve platform omitted → AD_SERVED.platform null', async () => {
      const prisma = createServingPrisma() as unknown as PrismaService;
      prisma.adPlacement.findUnique = jest.fn().mockResolvedValue(basePlacement);
      prisma.adCampaign.findMany = jest.fn().mockResolvedValue([activeCampaign]);
      prisma.adCampaign.update = jest.fn().mockResolvedValue({});
      prisma.analyticsEvent.create = jest.fn().mockResolvedValue({});
      prisma.$transaction = jest
        .fn()
        .mockImplementation((ops: unknown[]) =>
          Promise.all(ops as Promise<unknown>[]),
        );

      const serving = new AdServingService(
        prisma,
        cityScope as never,
        rotation,
      );

      await serving.serveAds({
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        citySlug: 'uralsk',
      });

      const data = (prisma.analyticsEvent.create as jest.Mock).mock.calls[0][0]
        .data;
      expect(data.platform).toBeUndefined();
    });

    it('10 — AD_SERVED ANDROID + resolved L2 → platform and businessLocationId', async () => {
      const prisma = createServingPrisma() as unknown as PrismaService;
      prisma.adPlacement.findUnique = jest.fn().mockResolvedValue(basePlacement);
      prisma.adCampaign.findMany = jest.fn().mockResolvedValue([activeCampaign]);
      prisma.adCampaign.update = jest.fn().mockResolvedValue({});
      prisma.analyticsEvent.create = jest.fn().mockResolvedValue({});
      prisma.$transaction = jest
        .fn()
        .mockImplementation((ops: unknown[]) =>
          Promise.all(ops as Promise<unknown>[]),
        );

      const serving = new AdServingService(
        prisma,
        cityScope as never,
        rotation,
      );

      await serving.serveAds({
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        citySlug: 'uralsk',
        platform: AnalyticsPlatform.ANDROID,
      });

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            platform: AnalyticsPlatform.ANDROID,
            businessLocationId: 'loc-l2',
          }),
        }),
      );
    });

    it('ServeAdsQueryDto — invalid platform rejected', async () => {
      await expect(
        validationPipe.transform(
          plainToInstance(ServeAdsQueryDto, {
            placementCode: 'HOME_FEATURED',
            sessionId: 'sess-1',
            citySlug: 'uralsk',
            platform: 'foo',
          }),
          { type: 'query', metatype: ServeAdsQueryDto },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
