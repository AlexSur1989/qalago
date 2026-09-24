import { Injectable } from '@nestjs/common';
import { AnalyticsEventType, AnalyticsPlatform, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AD_ANALYTICS_EVENT_TYPES,
  AdAnalyticsEventType,
  IMPRESSION_DEDUPE_WINDOW_MS,
  SESSION_ID_MAX_LENGTH,
} from './constants/monetization.constants';
import { TrackAdEventDto } from './dto/monetization.dto';
import {
  MonetizationErrorCode,
  monetizationBadRequest,
  monetizationNotFound,
} from './errors/monetization.errors';
import { resolveAdEventBusinessLocationId } from '../../common/utils/analytics-branch-location.util';

const TRACKABLE_TYPES = new Set<string>(AD_ANALYTICS_EVENT_TYPES);

@Injectable()
export class AdEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackEvent(dto: TrackAdEventDto) {
    this.assertSessionId(dto.sessionId);
    this.assertEventType(dto.type);

    const placement = await this.prisma.adPlacement.findUnique({
      where: { code: dto.placementCode },
    });
    if (!placement) {
      monetizationNotFound(
        MonetizationErrorCode.PLACEMENT_NOT_FOUND,
        'Placement not found',
      );
    }

    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id: dto.campaignId },
      select: {
        id: true,
        businessId: true,
        cityId: true,
        destinationBusinessLocationId: true,
        campaignPlacements: { where: { placementId: placement.id } },
      },
    });
    if (!campaign) {
      monetizationNotFound(
        MonetizationErrorCode.CAMPAIGN_NOT_FOUND,
        'Campaign not found',
      );
    }
    if (campaign.campaignPlacements.length === 0) {
      monetizationBadRequest(
        MonetizationErrorCode.CAMPAIGN_PLACEMENT_MISMATCH,
        'Campaign is not linked to this placement',
      );
    }

    const eventType = dto.type as AnalyticsEventType;
    const businessLocationId = await resolveAdEventBusinessLocationId(
      this.prisma,
      campaign,
    );

    const platform = dto.platform;

    if (dto.type === 'AD_IMPRESSION') {
      return this.trackImpression(
        campaign.id,
        campaign.businessId,
        campaign.cityId,
        placement.id,
        dto.sessionId,
        dto.position,
        eventType,
        businessLocationId,
        platform,
      );
    }

    if (dto.type === 'AD_CLICK') {
      return this.trackClick(
        campaign.id,
        campaign.businessId,
        campaign.cityId,
        placement.id,
        dto.sessionId,
        eventType,
        businessLocationId,
        platform,
      );
    }

    return this.trackActionEvent(
      campaign.id,
      campaign.businessId,
      campaign.cityId,
      placement.id,
      dto.sessionId,
      eventType,
      businessLocationId,
      platform,
    );
  }

  private assertSessionId(sessionId: string) {
    if (
      !sessionId ||
      sessionId.length > SESSION_ID_MAX_LENGTH ||
      !/^[a-zA-Z0-9_-]+$/.test(sessionId)
    ) {
      monetizationBadRequest(
        MonetizationErrorCode.INVALID_SESSION_ID,
        'Invalid sessionId',
      );
    }
  }

  private assertEventType(type: string): asserts type is AdAnalyticsEventType {
    if (!TRACKABLE_TYPES.has(type)) {
      monetizationBadRequest(
        MonetizationErrorCode.INVALID_EVENT_TYPE,
        `Invalid event type: ${type}`,
      );
    }
  }

  private async trackImpression(
    campaignId: string,
    businessId: string,
    campaignCityId: string,
    placementId: string,
    sessionId: string,
    position: number | undefined,
    eventType: AnalyticsEventType,
    businessLocationId: string | null,
    platform: AnalyticsPlatform | undefined,
  ) {
    const since = new Date(Date.now() - IMPRESSION_DEDUPE_WINDOW_MS);
    const duplicate = await this.prisma.analyticsEvent.findFirst({
      where: {
        type: AnalyticsEventType.AD_IMPRESSION,
        campaignId,
        placementId,
        sessionId,
        createdAt: { gte: since },
      },
      select: { id: true },
    });

    if (duplicate) {
      return { recorded: false, duplicate: true };
    }

    const updateData: Prisma.AdCampaignUpdateInput = {
      qualifiedImpressions: { increment: 1 },
    };
    if (position === 1) {
      updateData.lastTopPositionAt = new Date();
    }

    await this.prisma.$transaction([
      this.prisma.adCampaign.update({
        where: { id: campaignId },
        data: updateData,
      }),
      this.prisma.analyticsEvent.create({
        data: {
          businessId,
          cityId: campaignCityId,
          type: eventType,
          campaignId,
          placementId,
          sessionId,
          ...(businessLocationId ? { businessLocationId } : {}),
          ...(platform ? { platform } : {}),
        },
      }),
    ]);

    return { recorded: true, duplicate: false };
  }

  private async trackClick(
    campaignId: string,
    businessId: string,
    campaignCityId: string,
    placementId: string,
    sessionId: string,
    eventType: AnalyticsEventType,
    businessLocationId: string | null,
    platform: AnalyticsPlatform | undefined,
  ) {
    await this.prisma.$transaction([
      this.prisma.adCampaign.update({
        where: { id: campaignId },
        data: { clickCount: { increment: 1 } },
      }),
      this.prisma.analyticsEvent.create({
        data: {
          businessId,
          cityId: campaignCityId,
          type: eventType,
          campaignId,
          placementId,
          sessionId,
          ...(businessLocationId ? { businessLocationId } : {}),
          ...(platform ? { platform } : {}),
        },
      }),
    ]);

    return { recorded: true };
  }

  private async trackActionEvent(
    campaignId: string,
    businessId: string,
    campaignCityId: string,
    placementId: string,
    sessionId: string,
    eventType: AnalyticsEventType,
    businessLocationId: string | null,
    platform: AnalyticsPlatform | undefined,
  ) {
    await this.prisma.analyticsEvent.create({
      data: {
        businessId,
        cityId: campaignCityId,
        type: eventType,
        campaignId,
        placementId,
        sessionId,
        ...(businessLocationId ? { businessLocationId } : {}),
        ...(platform ? { platform } : {}),
      },
    });

    return { recorded: true };
  }
}
