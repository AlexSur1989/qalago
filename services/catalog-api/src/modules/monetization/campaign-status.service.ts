import { Injectable } from '@nestjs/common';
import {
  AdCampaignStatus,
  AdModerationStatus,
  MonetizationProductType,
} from '@prisma/client';
import { AvailabilityService } from './availability.service';

export type CampaignActivationInput = {
  desiredStartAt?: Date | null;
  paidAt: Date;
  approvedAt?: Date | null;
  creativeModerationStatus?: AdModerationStatus | null;
  productType: MonetizationProductType;
  durationHours?: number | null;
  durationDays?: number | null;
  requiresCreative: boolean;
};

@Injectable()
export class CampaignStatusService {
  constructor(private readonly availability: AvailabilityService) {}

  requiresCreative(productType: MonetizationProductType): boolean {
    return productType === MonetizationProductType.VIP_BANNER;
  }

  resolveInitialStatus(input: CampaignActivationInput): {
    status: AdCampaignStatus;
    startAt: Date;
    endAt: Date;
  } {
    if (input.requiresCreative) {
      const hasApprovedCreative =
        input.creativeModerationStatus === AdModerationStatus.APPROVED;

      if (!hasApprovedCreative) {
        const anchor = input.desiredStartAt ?? input.paidAt;
        const endAt = this.availability.addDuration(
          anchor,
          input.durationHours,
          input.durationDays,
        );
        return {
          status: AdCampaignStatus.PENDING_MODERATION,
          startAt: anchor,
          endAt,
        };
      }

      return this.resolveApprovedSchedule(input);
    }

    return this.resolveApprovedSchedule({
      ...input,
      approvedAt: input.paidAt,
    });
  }

  resolveApprovedSchedule(input: CampaignActivationInput): {
    status: AdCampaignStatus;
    startAt: Date;
    endAt: Date;
  } {
    const now = input.approvedAt ?? input.paidAt;
    const startAt =
      input.desiredStartAt && input.desiredStartAt > now
        ? input.desiredStartAt
        : now;
    const endAt = this.availability.addDuration(
      startAt,
      input.durationHours,
      input.durationDays,
    );

    const status =
      startAt > now ? AdCampaignStatus.SCHEDULED : AdCampaignStatus.ACTIVE;

    return { status, startAt, endAt };
  }

  resolveOnCreativeApproved(
    campaign: {
      status: AdCampaignStatus;
      startAt: Date;
      endAt: Date;
      product: { type: MonetizationProductType };
    },
    metadata: {
      desiredStartAt?: string | null;
      durationHours?: number | null;
      durationDays?: number | null;
    },
    approvedAt = new Date(),
  ): { status: AdCampaignStatus; startAt: Date; endAt: Date } {
    const desiredStartAt = metadata.desiredStartAt
      ? new Date(metadata.desiredStartAt)
      : null;

    return this.resolveApprovedSchedule({
      desiredStartAt,
      paidAt: approvedAt,
      approvedAt,
      creativeModerationStatus: AdModerationStatus.APPROVED,
      productType: campaign.product.type,
      durationHours: metadata.durationHours,
      durationDays: metadata.durationDays,
      requiresCreative: this.requiresCreative(campaign.product.type),
    });
  }

  getEffectiveStatus(
    status: AdCampaignStatus,
    startAt: Date,
    endAt: Date,
    now = new Date(),
  ): AdCampaignStatus {
    return this.availability.resolveEffectiveStatus(status, startAt, endAt, now);
  }

  syncExpiredCampaigns(now = new Date()) {
    return {
      where: {
        status: { in: [AdCampaignStatus.ACTIVE, AdCampaignStatus.SCHEDULED] },
        endAt: { lte: now },
      },
      data: { status: AdCampaignStatus.COMPLETED },
    };
  }
}
