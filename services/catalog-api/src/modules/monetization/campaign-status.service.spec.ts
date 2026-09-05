import {
  AdCampaignStatus,
  AdModerationStatus,
  MonetizationProductType,
} from '@prisma/client';
import { AvailabilityService } from './availability.service';
import { CampaignStatusService } from './campaign-status.service';

describe('CampaignStatusService', () => {
  const availability = {
    addDuration: jest.fn((start: Date, hours?: number | null, days?: number | null) => {
      const end = new Date(start);
      if (days) end.setDate(end.getDate() + days);
      if (hours) end.setHours(end.getHours() + hours);
      return end;
    }),
    resolveEffectiveStatus: jest.fn(),
  } as unknown as AvailabilityService;

  const service = new CampaignStatusService(availability);

  it('28. VIP without approved creative stays PENDING_MODERATION', () => {
    const result = service.resolveInitialStatus({
      desiredStartAt: null,
      paidAt: new Date('2026-09-05T10:00:00Z'),
      creativeModerationStatus: AdModerationStatus.DRAFT,
      productType: MonetizationProductType.VIP_BANNER,
      durationDays: 7,
      requiresCreative: true,
    });

    expect(result.status).toBe(AdCampaignStatus.PENDING_MODERATION);
  });

  it('29. approved creative with immediate start → ACTIVE', () => {
    const paidAt = new Date('2026-09-05T10:00:00Z');
    const result = service.resolveInitialStatus({
      desiredStartAt: null,
      paidAt,
      approvedAt: paidAt,
      creativeModerationStatus: AdModerationStatus.APPROVED,
      productType: MonetizationProductType.VIP_BANNER,
      durationDays: 7,
      requiresCreative: true,
    });

    expect(result.status).toBe(AdCampaignStatus.ACTIVE);
    expect(result.startAt.getTime()).toBeLessThanOrEqual(Date.now() + 86400000);
  });

  it('30. future start → SCHEDULED', () => {
    const future = new Date(Date.now() + 7 * 86400000);
    const result = service.resolveApprovedSchedule({
      desiredStartAt: future,
      paidAt: new Date(),
      approvedAt: new Date(),
      productType: MonetizationProductType.FEATURED_BUSINESS,
      durationDays: 7,
      requiresCreative: false,
    });

    expect(result.status).toBe(AdCampaignStatus.SCHEDULED);
    expect(result.startAt).toEqual(future);
  });

  it('37. syncExpiredCampaigns targets ACTIVE/SCHEDULED past endAt', () => {
    const now = new Date('2026-09-10T00:00:00Z');
    const args = service.syncExpiredCampaigns(now);
    expect(args.where).toEqual({
      status: { in: [AdCampaignStatus.ACTIVE, AdCampaignStatus.SCHEDULED] },
      endAt: { lte: now },
    });
    expect(args.data).toEqual({ status: AdCampaignStatus.COMPLETED });
  });
});
