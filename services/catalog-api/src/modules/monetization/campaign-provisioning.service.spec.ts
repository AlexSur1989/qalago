import {
  AdCampaignStatus,
  AdModerationStatus,
  MonetizationProductType,
  OrderStatus,
} from '@prisma/client';
import { AvailabilityService } from './availability.service';
import { CampaignProvisioningService } from './campaign-provisioning.service';
import { CampaignStatusService } from './campaign-status.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CampaignProvisioningService', () => {
  const prisma = {
    adCreative: { findUnique: jest.fn(), findFirst: jest.fn() },
    adCampaign: { findMany: jest.fn(), update: jest.fn(), create: jest.fn() },
    adCampaignPlacement: { create: jest.fn() },
    adPlacement: { findUnique: jest.fn() },
    promotion: { findFirst: jest.fn() },
    promotionPackage: { findUnique: jest.fn() },
    order: { findUnique: jest.fn() },
  } as unknown as PrismaService;

  const availability = {
    addDuration: jest.fn((start: Date, _h?: number | null, days?: number | null) => {
      const end = new Date(start);
      if (days) end.setDate(end.getDate() + days);
      return end;
    }),
    assertAvailableInTransaction: jest.fn().mockResolvedValue(undefined),
  } as unknown as AvailabilityService;

  const campaignStatus = new CampaignStatusService(availability);

  const service = new CampaignProvisioningService(
    prisma,
    availability,
    campaignStatus,
  );

  beforeEach(() => jest.clearAllMocks());

  const placement = (code: string) => ({
    id: `pl-${code}`,
    code,
    isActive: true,
    maxActiveCampaigns: 10,
  });

  it('23. TOP_CATEGORY → CATEGORY_TOP placement', async () => {
    const tx = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'ord-1',
          businessId: 'biz-1',
          business: { cityId: 'city-1', categoryId: 'cat-1' },
          items: [
            {
              id: 'item-1',
              product: { id: 'p1', type: MonetizationProductType.TOP_CATEGORY },
              durationDays: 7,
              durationHours: null,
              metadata: {},
            },
          ],
        }),
      },
      adPlacement: {
        findUnique: jest.fn().mockResolvedValue(placement('CATEGORY_TOP')),
      },
      adCampaign: {
        create: jest.fn().mockResolvedValue({ id: 'camp-1' }),
      },
      adCampaignPlacement: { create: jest.fn() },
      promotion: { findFirst: jest.fn() },
    };

    await service.provisionOrderCampaigns(tx as never, 'ord-1', new Date());

    expect(tx.adPlacement.findUnique).toHaveBeenCalledWith({
      where: { code: 'CATEGORY_TOP' },
    });
    expect(tx.adCampaign.create).toHaveBeenCalled();
  });

  it('24. BOOST → CATEGORY_BOOST', () => {
    const avail = new AvailabilityService(prisma);
    expect(avail.resolvePlacementCode(MonetizationProductType.BOOST)).toBe(
      'CATEGORY_BOOST',
    );
  });

  it('25. FEATURED → HOME_FEATURED', async () => {
    const avail = new AvailabilityService(prisma);
    expect(avail.resolvePlacementCode(MonetizationProductType.FEATURED_BUSINESS)).toBe(
      'HOME_FEATURED',
    );
  });

  it('26. VIP → HOME_VIP_BANNER', async () => {
    const avail = new AvailabilityService(prisma);
    expect(avail.resolvePlacementCode(MonetizationProductType.VIP_BANNER)).toBe(
      'HOME_VIP_BANNER',
    );
  });

  it('27. PROMOTED_PROMOTION → HOME_PROMOTIONS', async () => {
    const avail = new AvailabilityService(prisma);
    expect(avail.resolvePlacementCode(MonetizationProductType.PROMOTED_PROMOTION)).toBe(
      'HOME_PROMOTIONS',
    );
  });

  it('32. package provisions campaigns per package items', async () => {
    const tx = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'ord-1',
          businessId: 'biz-1',
          business: { cityId: 'city-1', categoryId: 'cat-1' },
          items: [
            {
              id: 'item-1',
              product: { id: 'pkg-prod', type: MonetizationProductType.PACKAGE },
              durationDays: 7,
              durationHours: null,
              metadata: { packageCode: 'START' },
            },
          ],
        }),
      },
      promotionPackage: {
        findUnique: jest.fn().mockResolvedValue({
          code: 'START',
          items: [
            {
              product: { id: 'p1', type: MonetizationProductType.TOP_CATEGORY },
              durationDays: 7,
              durationHours: null,
            },
            {
              product: { id: 'p2', type: MonetizationProductType.PROMOTED_PROMOTION },
              durationDays: 7,
              durationHours: null,
            },
          ],
        }),
      },
      adPlacement: {
        findUnique: jest
          .fn()
          .mockImplementation(({ where }: { where: { code: string } }) =>
            Promise.resolve(placement(where.code)),
          ),
      },
      adCampaign: { create: jest.fn().mockResolvedValue({ id: 'camp' }) },
      adCampaignPlacement: { create: jest.fn() },
      promotion: { findFirst: jest.fn().mockResolvedValue({ id: 'promo-1' }) },
    };

    await service.provisionOrderCampaigns(tx as never, 'ord-1', new Date());

    expect(tx.adCampaign.create).toHaveBeenCalledTimes(2);
  });

  it('activateCampaignsForCreative on approval', async () => {
    prisma.adCreative.findUnique = jest.fn().mockResolvedValue({
      id: 'cr-1',
      moderationStatus: AdModerationStatus.APPROVED,
    });
    prisma.adCampaign.findMany = jest.fn().mockResolvedValue([
      {
        id: 'camp-1',
        status: AdCampaignStatus.PENDING_MODERATION,
        startAt: new Date(),
        endAt: new Date(),
        product: { type: MonetizationProductType.VIP_BANNER },
        orderItem: { durationDays: 7, durationHours: null, metadata: {} },
      },
    ]);
    prisma.adCampaign.update = jest.fn().mockResolvedValue({ id: 'camp-1' });

    const result = await service.activateCampaignsForCreative('cr-1');
    expect(result).toHaveLength(1);
    expect(prisma.adCampaign.update).toHaveBeenCalled();
  });
});
