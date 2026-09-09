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

describe('Stage 4B.1 — package VIP creative activation', () => {
  const availability = {
    addDuration: jest.fn((start: Date, _h?: number | null, days?: number | null) => {
      const end = new Date(start);
      if (days) end.setDate(end.getDate() + days);
      return end;
    }),
    assertAvailableInTransaction: jest.fn().mockResolvedValue(undefined),
  } as unknown as AvailabilityService;

  const campaignStatus = new CampaignStatusService(availability);

  const prisma = {
    adCreative: { findUnique: jest.fn(), findFirst: jest.fn() },
    adCampaign: {
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    adCampaignPlacement: { create: jest.fn() },
    adPlacement: { findUnique: jest.fn() },
    promotion: { findFirst: jest.fn() },
    promotionPackage: { findUnique: jest.fn() },
    order: { findUnique: jest.fn() },
  } as unknown as PrismaService;

  const service = new CampaignProvisioningService(
    prisma,
    availability,
    campaignStatus,
  );

  const placement = (code: string) => ({
    id: `pl-${code}`,
    code,
    isActive: true,
    maxActiveCampaigns: 10,
  });

  beforeEach(() => jest.clearAllMocks());

  function mockMaxPackageProvision(creativeId: string) {
    const paidAt = new Date('2026-09-05T10:00:00Z');
    const tx = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'ord-max',
          businessId: 'biz-1',
          business: { cityId: 'city-1', categoryId: 'cat-1' },
          items: [
            {
              id: 'item-pkg',
              product: { id: 'pkg-prod', type: MonetizationProductType.PACKAGE },
              durationDays: 7,
              durationHours: null,
              metadata: {
                packageCode: 'MAX',
                creativeId,
                promotionId: 'promo-1',
              },
            },
          ],
        }),
      },
      adCampaign: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: `camp-${data.productId}`, ...data }),
        ),
      },
      adCampaignPlacement: { create: jest.fn() },
      adPlacement: {
        findUnique: jest.fn().mockImplementation(({ where }: { where: { code: string } }) =>
          Promise.resolve(placement(where.code)),
        ),
      },
      promotionPackage: {
        findUnique: jest.fn().mockResolvedValue({
          code: 'MAX',
          items: [
            {
              productId: 'vip-prod',
              product: { id: 'vip-prod', type: MonetizationProductType.VIP_BANNER },
              durationDays: 7,
              durationHours: null,
            },
            {
              productId: 'top-prod',
              product: { id: 'top-prod', type: MonetizationProductType.TOP_CATEGORY },
              durationDays: 7,
              durationHours: null,
            },
            {
              productId: 'feat-prod',
              product: {
                id: 'feat-prod',
                type: MonetizationProductType.FEATURED_BUSINESS,
              },
              durationDays: 7,
              durationHours: null,
            },
            {
              productId: 'promo-prod',
              product: {
                id: 'promo-prod',
                type: MonetizationProductType.PROMOTED_PROMOTION,
              },
              durationDays: 7,
              durationHours: null,
            },
          ],
        }),
      },
      promotion: { findFirst: jest.fn().mockResolvedValue({ id: 'promo-1' }) },
      adCreative: {
        findFirst: jest.fn().mockResolvedValue({
          id: creativeId,
          moderationStatus: AdModerationStatus.DRAFT,
        }),
      },
    };
    return { tx, paidAt };
  }

  it('MAX: non-VIP campaigns ACTIVE/SCHEDULED, VIP waits for creative approval', async () => {
    const { tx, paidAt } = mockMaxPackageProvision('cr-vip');

    await service.provisionOrderCampaigns(tx as never, 'ord-max', paidAt);

    expect(tx.adCampaign.create).toHaveBeenCalledTimes(4);
    const statuses = (tx.adCampaign.create as jest.Mock).mock.calls.map(
      (call) => call[0].data.status,
    );
    const creativeIds = (tx.adCampaign.create as jest.Mock).mock.calls.map(
      (call) => call[0].data.creativeId,
    );

    expect(statuses.filter((s) => s === AdCampaignStatus.SCHEDULED)).toHaveLength(1);
    expect(statuses.filter((s) => s !== AdCampaignStatus.SCHEDULED)).toHaveLength(3);
    expect(creativeIds.filter((id) => id === 'cr-vip')).toHaveLength(1);
    expect(creativeIds.filter((id) => id == null)).toHaveLength(3);
  });

  it('NEW_PLACE: VIP uses 7d, others use 14d on creative approval', async () => {
    prisma.adCreative.findUnique = jest.fn().mockResolvedValue({
      id: 'cr-vip',
      moderationStatus: AdModerationStatus.APPROVED,
    });
    prisma.adCampaign.findMany = jest.fn().mockResolvedValue([
      {
        id: 'camp-vip',
        status: AdCampaignStatus.PENDING_MODERATION,
        startAt: new Date(),
        endAt: new Date(),
        productId: 'vip-prod',
        product: { type: MonetizationProductType.VIP_BANNER },
        orderItem: {
          durationDays: 14,
          durationHours: null,
          metadata: { packageCode: 'NEW_PLACE', desiredStartAt: '2026-09-05T00:00:00Z' },
        },
      },
    ]);
    prisma.promotionPackage.findUnique = jest.fn().mockResolvedValue({
      code: 'NEW_PLACE',
      items: [
        {
          productId: 'vip-prod',
          product: { id: 'vip-prod', type: MonetizationProductType.VIP_BANNER },
          durationDays: 7,
          durationHours: null,
        },
        {
          productId: 'top-prod',
          product: { id: 'top-prod', type: MonetizationProductType.TOP_CATEGORY },
          durationDays: 14,
          durationHours: null,
        },
      ],
    });
    prisma.adCampaign.update = jest.fn().mockResolvedValue({ id: 'camp-vip' });

    const approvedAt = new Date('2026-09-08T00:00:00Z');
    await service.activateCampaignsForCreative('cr-vip', approvedAt);

    const updateData = (prisma.adCampaign.update as jest.Mock).mock.calls[0][0].data;
    expect(updateData.startAt.toISOString()).toBe('2026-09-08T00:00:00.000Z');
    expect(updateData.endAt.toISOString()).toBe('2026-09-15T00:00:00.000Z');
  });

  it('wrong creative approval does not activate linked campaign', async () => {
    prisma.adCreative.findUnique = jest.fn().mockResolvedValue({
      id: 'cr-b',
      moderationStatus: AdModerationStatus.APPROVED,
    });
    prisma.adCampaign.findMany = jest.fn().mockResolvedValue([]);
    prisma.adCampaign.update = jest.fn();

    const result = await service.activateCampaignsForCreative('cr-b');
    expect(result).toHaveLength(0);
    expect(prisma.adCampaign.update).not.toHaveBeenCalled();
  });

  it('approval idempotency: only PENDING_MODERATION campaigns update', async () => {
    prisma.adCreative.findUnique = jest.fn().mockResolvedValue({
      id: 'cr-a',
      moderationStatus: AdModerationStatus.APPROVED,
    });
    prisma.adCampaign.findMany = jest.fn().mockResolvedValue([]);
    prisma.adCampaign.update = jest.fn();

    await service.activateCampaignsForCreative('cr-a');
    expect(prisma.adCampaign.update).not.toHaveBeenCalled();
  });

  it('payment confirm idempotency: skips provision when campaigns exist', async () => {
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
      adCampaign: {
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn(),
      },
    };

    await service.provisionOrderCampaigns(tx as never, 'ord-1', new Date());
    expect(tx.adCampaign.create).not.toHaveBeenCalled();
  });

  it('activateCampaignsForCreative uses exact creativeId match only', async () => {
    prisma.adCreative.findUnique = jest.fn().mockResolvedValue({
      id: 'cr-a',
      moderationStatus: AdModerationStatus.APPROVED,
    });
    prisma.adCampaign.findMany = jest.fn().mockResolvedValue([
      {
        id: 'camp-a',
        status: AdCampaignStatus.PENDING_MODERATION,
        startAt: new Date(),
        endAt: new Date(),
        productId: 'vip-prod',
        product: { type: MonetizationProductType.VIP_BANNER },
        orderItem: {
          durationDays: 7,
          durationHours: null,
          metadata: {},
        },
      },
    ]);
    prisma.adCampaign.update = jest.fn().mockResolvedValue({ id: 'camp-a' });

    await service.activateCampaignsForCreative('cr-a');

    expect(prisma.adCampaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          creativeId: 'cr-a',
          status: AdCampaignStatus.PENDING_MODERATION,
          orderItem: { order: { status: OrderStatus.PAID } },
        }),
      }),
    );
  });
});
