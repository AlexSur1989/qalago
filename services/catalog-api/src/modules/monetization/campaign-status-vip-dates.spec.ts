import {
  AdCampaignStatus,
  AdModerationStatus,
  MonetizationProductType,
} from '@prisma/client';
import { AvailabilityService } from './availability.service';
import { CampaignStatusService } from './campaign-status.service';

describe('CampaignStatusService VIP date rules', () => {
  const availability = {
    addDuration: jest.fn((start: Date, _hours?: number | null, days?: number | null) => {
      const end = new Date(start);
      if (days) end.setDate(end.getDate() + days);
      return end;
    }),
    resolveEffectiveStatus: jest.fn(),
  } as unknown as AvailabilityService;

  const service = new CampaignStatusService(availability);

  const vipCampaign = {
    status: AdCampaignStatus.PENDING_MODERATION,
    startAt: new Date('2026-09-05T00:00:00Z'),
    endAt: new Date('2026-09-12T00:00:00Z'),
    product: { type: MonetizationProductType.VIP_BANNER },
  };

  it('requested Sep 5, approved Sep 8, 7d → Sep 8–15', () => {
    const approvedAt = new Date('2026-09-08T00:00:00Z');
    const result = service.resolveOnCreativeApproved(
      vipCampaign,
      { desiredStartAt: '2026-09-05T00:00:00Z', durationDays: 7 },
      approvedAt,
    );

    expect(result.startAt.toISOString()).toBe('2026-09-08T00:00:00.000Z');
    expect(result.endAt.toISOString()).toBe('2026-09-15T00:00:00.000Z');
    expect(result.status).toBe(AdCampaignStatus.ACTIVE);
  });

  it('requested Sep 10, approved Sep 8, 7d → Sep 10–17', () => {
    const approvedAt = new Date('2026-09-08T00:00:00Z');
    const result = service.resolveOnCreativeApproved(
      vipCampaign,
      { desiredStartAt: '2026-09-10T00:00:00Z', durationDays: 7 },
      approvedAt,
    );

    expect(result.startAt.toISOString()).toBe('2026-09-10T00:00:00.000Z');
    expect(result.endAt.toISOString()).toBe('2026-09-17T00:00:00.000Z');
    expect(result.status).toBe(AdCampaignStatus.SCHEDULED);
  });

  it('requested Sep 10, approved Sep 12, 7d → Sep 12–19', () => {
    const approvedAt = new Date('2026-09-12T00:00:00Z');
    const result = service.resolveOnCreativeApproved(
      vipCampaign,
      { desiredStartAt: '2026-09-10T00:00:00Z', durationDays: 7 },
      approvedAt,
    );

    expect(result.startAt.toISOString()).toBe('2026-09-12T00:00:00.000Z');
    expect(result.endAt.toISOString()).toBe('2026-09-19T00:00:00.000Z');
    expect(result.status).toBe(AdCampaignStatus.ACTIVE);
  });
});
