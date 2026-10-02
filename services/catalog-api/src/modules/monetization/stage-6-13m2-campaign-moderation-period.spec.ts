/**
 * 6.13M.2 — paid delivery duration must not elapse during creative moderation.
 */
import {
  AdCampaignStatus,
  AdModerationStatus,
  MonetizationProductType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from './availability.service';
import { PlacementCapacityService } from './placement-capacity.service';
import {
  CampaignStatusService,
  MODERATION_PENDING_PLACEHOLDER_YEARS,
  moderationPendingPlaceholderEnd,
} from './campaign-status.service';

describe('6.13M.2 — creative-required campaign moderation period', () => {
  const availabilityForEffective = new AvailabilityService(
    {} as PrismaService,
    new PlacementCapacityService({} as PrismaService),
  );

  const availability = {
    addDuration: jest.fn((start: Date, _hours?: number | null, days?: number | null) => {
      const end = new Date(start);
      if (days) end.setUTCDate(end.getUTCDate() + days);
      return end;
    }),
    resolveEffectiveStatus: availabilityForEffective.resolveEffectiveStatus.bind(
      availabilityForEffective,
    ),
  } as unknown as AvailabilityService;

  const service = new CampaignStatusService(availability);

  const paidOct1 = new Date('2026-10-01T12:00:00.000Z');
  const approvedOct4 = new Date('2026-10-04T09:00:00.000Z');

  it('1. provision pending moderation uses placeholder end, not purchased duration', () => {
    const initial = service.resolveInitialStatus({
      desiredStartAt: null,
      paidAt: paidOct1,
      creativeModerationStatus: AdModerationStatus.PENDING,
      productType: MonetizationProductType.VIP_BANNER,
      durationDays: 7,
      requiresCreative: true,
    });

    expect(initial.status).toBe(AdCampaignStatus.PENDING_MODERATION);
    expect(initial.startAt.toISOString()).toBe(paidOct1.toISOString());
    expect(initial.endAt.toISOString()).toBe(
      moderationPendingPlaceholderEnd(paidOct1).toISOString(),
    );
    expect(initial.endAt.getTime()).not.toBe(
      availability.addDuration(paidOct1, null, 7).getTime(),
    );
  });

  it('2. approval after payment — start at approval, full 7d delivery (Case A)', () => {
    const schedule = service.resolveOnCreativeApproved(
      {
        status: AdCampaignStatus.PENDING_MODERATION,
        startAt: paidOct1,
        endAt: moderationPendingPlaceholderEnd(paidOct1),
        product: { type: MonetizationProductType.VIP_BANNER },
      },
      { durationDays: 7 },
      approvedOct4,
    );

    expect(schedule.status).toBe(AdCampaignStatus.ACTIVE);
    expect(schedule.startAt.toISOString()).toBe('2026-10-04T09:00:00.000Z');
    expect(schedule.endAt.toISOString()).toBe('2026-10-11T09:00:00.000Z');
  });

  it('3. approval before future desiredStartAt — SCHEDULED (Case B)', () => {
    const desiredOct10 = new Date('2026-10-10T00:00:00.000Z');
    const schedule = service.resolveOnCreativeApproved(
      {
        status: AdCampaignStatus.PENDING_MODERATION,
        startAt: paidOct1,
        endAt: moderationPendingPlaceholderEnd(paidOct1),
        product: { type: MonetizationProductType.VIP_BANNER },
      },
      { desiredStartAt: desiredOct10.toISOString(), durationDays: 7 },
      approvedOct4,
    );

    expect(schedule.status).toBe(AdCampaignStatus.SCHEDULED);
    expect(schedule.startAt.toISOString()).toBe('2026-10-10T00:00:00.000Z');
    expect(schedule.endAt.toISOString()).toBe('2026-10-17T00:00:00.000Z');
  });

  it('4. approval after desiredStartAt passed — start at approval, no duration loss (Case C)', () => {
    const desiredOct3 = new Date('2026-10-03T00:00:00.000Z');
    const schedule = service.resolveOnCreativeApproved(
      {
        status: AdCampaignStatus.PENDING_MODERATION,
        startAt: paidOct1,
        endAt: moderationPendingPlaceholderEnd(paidOct1),
        product: { type: MonetizationProductType.VIP_BANNER },
      },
      { desiredStartAt: desiredOct3.toISOString(), durationDays: 7 },
      approvedOct4,
    );

    expect(schedule.status).toBe(AdCampaignStatus.ACTIVE);
    expect(schedule.startAt.toISOString()).toBe('2026-10-04T09:00:00.000Z');
    expect(schedule.endAt.toISOString()).toBe('2026-10-11T09:00:00.000Z');
  });

  it('5. PENDING_MODERATION with legacy short endAt is not effective COMPLETED', () => {
    const legacyEnd = new Date('2026-10-08T00:00:00.000Z');
    const now = new Date('2026-10-15T00:00:00.000Z');
    const effective = availability.resolveEffectiveStatus(
      AdCampaignStatus.PENDING_MODERATION,
      paidOct1,
      legacyEnd,
      now,
    );
    expect(effective).toBe(AdCampaignStatus.PENDING_MODERATION);
  });

  it('6. placeholder span is stable for capacity hold semantics', () => {
    const end = moderationPendingPlaceholderEnd(paidOct1);
    expect(end.getUTCFullYear()).toBe(
      paidOct1.getUTCFullYear() + MODERATION_PENDING_PLACEHOLDER_YEARS,
    );
  });
});
