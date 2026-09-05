import {
  AdCampaignStatus,
  AdModerationStatus,
  AnalyticsEventType,
  BusinessStatus,
  MonetizationProductType,
} from '@prisma/client';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AdRotationService } from './ad-rotation.service';
import { AdServingService } from './ad-serving.service';

describe('AdServingService', () => {
  const cityScope = {
    resolveCityId: jest.fn().mockResolvedValue('city-1'),
  } as unknown as CityScopeService;

  const rotation = new AdRotationService();

  const prisma = {
    adPlacement: { findUnique: jest.fn() },
    adCampaign: { findMany: jest.fn(), update: jest.fn() },
    analyticsEvent: { create: jest.fn() },
    promotion: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  const service = new AdServingService(prisma, cityScope, rotation);

  const basePlacement = {
    id: 'pl-1',
    code: 'HOME_FEATURED',
    isActive: true,
    maxVisible: 3,
  };

  const activeCampaign = {
    id: 'camp-1',
    businessId: 'biz-1',
    qualifiedImpressions: 0,
    weight: 1,
    lastTopPositionAt: null,
    status: AdCampaignStatus.ACTIVE,
    startAt: new Date('2026-01-01'),
    endAt: new Date('2027-01-01'),
    product: {
      id: 'prod-1',
      code: 'FEATURED_BUSINESS',
      type: MonetizationProductType.FEATURED_BUSINESS,
      isActive: true,
    },
    creative: null,
    business: {
      id: 'biz-1',
      title: 'Cafe',
      slug: 'cafe',
      shortDesc: 'Nice',
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
    campaignPlacements: [{ placement: { code: 'HOME_FEATURED' }, placementId: 'pl-1' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.adPlacement.findUnique = jest.fn().mockResolvedValue(basePlacement);
    prisma.adCampaign.findMany = jest.fn().mockResolvedValue([activeCampaign]);
    prisma.adCampaign.update = jest.fn().mockResolvedValue({});
    prisma.analyticsEvent.create = jest.fn().mockResolvedValue({});
    prisma.$transaction = jest
      .fn()
      .mockImplementation((ops: unknown[]) =>
        Promise.all(ops as Promise<unknown>[]),
      );
  });

  it('11. rejects inactive placement codes', async () => {
    await expect(
      service.serveAds({
        placementCode: 'SEARCH_TOP',
        sessionId: 'sess-1',
        citySlug: 'uralsk',
      }),
    ).rejects.toMatchObject({
      response: { code: 'INVALID_PLACEMENT' },
    });
  });

  it('12. requires categoryId for CATEGORY_TOP', async () => {
    await expect(
      service.serveAds({
        placementCode: 'CATEGORY_TOP',
        sessionId: 'sess-1',
        citySlug: 'uralsk',
      }),
    ).rejects.toMatchObject({
      response: { code: 'CATEGORY_REQUIRED' },
    });
  });

  it('13. caps client limit to placement maxVisible', async () => {
    const selectSpy = jest.spyOn(rotation, 'selectCampaigns');
    await service.serveAds({
      placementCode: 'HOME_FEATURED',
      sessionId: 'sess-1',
      citySlug: 'uralsk',
      limit: 99,
    });
    expect(selectSpy).toHaveBeenCalledWith(
      expect.any(Array),
      'sess-1',
      'HOME_FEATURED',
      'city-1',
      undefined,
      3,
    );
  });

  it('14. excludes non-ACTIVE campaigns via query filter', async () => {
    await service.serveAds({
      placementCode: 'HOME_FEATURED',
      sessionId: 'sess-1',
      citySlug: 'uralsk',
    });
    expect(prisma.adCampaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: AdCampaignStatus.ACTIVE,
          business: { status: BusinessStatus.ACTIVE },
        }),
      }),
    );
  });

  it('15. excludes VIP without approved creative', async () => {
    prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
      ...basePlacement,
      code: 'HOME_VIP_BANNER',
      maxVisible: 1,
    });
    prisma.adCampaign.findMany = jest.fn().mockResolvedValue([
      {
        ...activeCampaign,
        product: {
          ...activeCampaign.product,
          type: MonetizationProductType.VIP_BANNER,
        },
        creative: {
          moderationStatus: AdModerationStatus.PENDING,
        },
        campaignPlacements: [{ placement: { code: 'HOME_VIP_BANNER' } }],
      },
    ]);

    const result = await service.serveAds({
      placementCode: 'HOME_VIP_BANNER',
      sessionId: 'sess-1',
      citySlug: 'uralsk',
    });
    expect(result.items).toHaveLength(0);
  });

  it('16. CATEGORY_TOP scopes by categoryId', async () => {
    prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
      ...basePlacement,
      code: 'CATEGORY_TOP',
    });
    await service.serveAds({
      placementCode: 'CATEGORY_TOP',
      sessionId: 'sess-1',
      citySlug: 'uralsk',
      categoryId: 'cat-99',
    });
    expect(prisma.adCampaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ categoryId: 'cat-99' }),
      }),
    );
  });

  it('17. returns sponsored items with display label', async () => {
    const result = await service.serveAds({
      placementCode: 'HOME_FEATURED',
      sessionId: 'sess-1',
      citySlug: 'uralsk',
    });
    expect(result.items[0]).toMatchObject({
      sponsored: true,
      displayLabel: 'Реклама',
      campaignId: 'camp-1',
    });
  });

  it('18. on serve increments servedCount and logs AD_SERVED', async () => {
    await service.serveAds({
      placementCode: 'HOME_FEATURED',
      sessionId: 'sess-1',
      citySlug: 'uralsk',
    });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.adCampaign.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ servedCount: { increment: 1 } }),
      }),
    );
    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: AnalyticsEventType.AD_SERVED }),
      }),
    );
  });

  it('19. rejects invalid sessionId', async () => {
    await expect(
      service.serveAds({
        placementCode: 'HOME_FEATURED',
        sessionId: 'bad session!',
        citySlug: 'uralsk',
      }),
    ).rejects.toMatchObject({
      response: { code: 'INVALID_SESSION_ID' },
    });
  });

  it('20. rejects inactive placement record', async () => {
    prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
      ...basePlacement,
      isActive: false,
    });
    await expect(
      service.serveAds({
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-1',
        citySlug: 'uralsk',
      }),
    ).rejects.toMatchObject({
      response: { code: 'PLACEMENT_NOT_ACTIVE' },
    });
  });
});
