/**
 * 6.13M.2A — documents VIP moderation / capacity coupling (no product behavior change).
 */
import { AdCampaignStatus, MonetizationProductType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from './availability.service';
import {
  moderationPendingPlaceholderEnd,
} from './campaign-status.service';
import { PlacementCapacityService } from './placement-capacity.service';

describe('6.13M.2A — moderation capacity architecture audit', () => {
  const prisma = {
    adPlacement: { findUnique: jest.fn() },
    adPlacementCityConfig: { findUnique: jest.fn().mockResolvedValue(null) },
    adCampaign: { count: jest.fn(), findFirst: jest.fn() },
    adInventoryReservation: {
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
    },
  } as unknown as PrismaService;

  const capacity = new PlacementCapacityService(prisma);
  const availability = new AvailabilityService(prisma, capacity);

  beforeEach(() => jest.clearAllMocks());

  it('capacity overlap uses campaign startAt/endAt (not CONVERTED reservations)', async () => {
    prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
      id: 'pl-vip',
      code: 'HOME_VIP_BANNER',
      isActive: true,
      maxActiveCampaigns: 2,
    });

    let capturedCampaignWhere: unknown;
    prisma.adCampaign.count = jest.fn().mockImplementation(({ where }) => {
      capturedCampaignWhere = where;
      return Promise.resolve(1);
    });

    const buyerStart = new Date('2027-06-01T00:00:00.000Z');
    const buyerEnd = new Date('2027-06-08T00:00:00.000Z');

    await availability.checkAvailability({
      productType: MonetizationProductType.VIP_BANNER,
      cityId: 'city-1',
      desiredStartAt: buyerStart,
      desiredEndAt: buyerEnd,
    });

    expect(capturedCampaignWhere).toMatchObject({
      status: {
        in: [
          AdCampaignStatus.ACTIVE,
          AdCampaignStatus.SCHEDULED,
          AdCampaignStatus.PENDING_MODERATION,
        ],
      },
      startAt: { lt: buyerEnd },
      endAt: { gt: buyerStart },
    });
    expect(prisma.adInventoryReservation.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'HELD',
        }),
      }),
    );
  });

  it('PENDING_MODERATION placeholder end overlaps distant buyer windows (paid hold)', () => {
    const paidAt = new Date('2026-10-01T12:00:00.000Z');
    const placeholderEnd = moderationPendingPlaceholderEnd(paidAt);
    const buyerStart = new Date('2027-01-01T00:00:00.000Z');
    const buyerEnd = new Date('2027-01-08T00:00:00.000Z');

    expect(
      availability.overlaps(paidAt, placeholderEnd, buyerStart, buyerEnd),
    ).toBe(true);
  });

  it('REJECTED campaigns are excluded from VIP capacity statuses', () => {
    const statuses = availability.resolveCapacityStatuses('HOME_VIP_BANNER');
    expect(statuses).toContain(AdCampaignStatus.PENDING_MODERATION);
    expect(statuses).not.toContain(AdCampaignStatus.REJECTED);
    expect(statuses).not.toContain(AdCampaignStatus.CANCELLED);
  });
});
