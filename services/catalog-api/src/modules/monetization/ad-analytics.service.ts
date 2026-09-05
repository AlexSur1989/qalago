import { Injectable } from '@nestjs/common';
import { AnalyticsEventType } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { MonetizationAccessService } from './monetization-access.service';

const ACTION_EVENT_TYPES: AnalyticsEventType[] = [
  AnalyticsEventType.AD_CARD_OPEN,
  AnalyticsEventType.AD_CALL_CLICK,
  AnalyticsEventType.AD_WHATSAPP_CLICK,
  AnalyticsEventType.AD_ROUTE_CLICK,
  AnalyticsEventType.AD_WEBSITE_CLICK,
  AnalyticsEventType.AD_INSTAGRAM_CLICK,
  AnalyticsEventType.AD_PROMOTION_OPEN,
];

export type CampaignAnalyticsPeriod = {
  from?: Date;
  to?: Date;
};

@Injectable()
export class AdAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: MonetizationAccessService,
  ) {}

  async getCampaignAnalytics(
    user: AuthUser,
    campaignId: string,
    period?: CampaignAnalyticsPeriod,
  ) {
    const campaign = await this.access.assertCampaignAccess(user, campaignId);

    const createdAtFilter =
      period?.from || period?.to
        ? {
            ...(period.from ? { gte: period.from } : {}),
            ...(period.to ? { lte: period.to } : {}),
          }
        : undefined;

    const eventWhere = {
      campaignId,
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    };

    const actionCounts = await this.prisma.analyticsEvent.groupBy({
      by: ['type'],
      where: {
        ...eventWhere,
        type: { in: ACTION_EVENT_TYPES },
      },
      _count: { _all: true },
    });

    const actions = Object.fromEntries(
      ACTION_EVENT_TYPES.map((type) => [
        type,
        actionCounts.find((row) => row.type === type)?._count._all ?? 0,
      ]),
    ) as Record<(typeof ACTION_EVENT_TYPES)[number], number>;

    const impressions = campaign.qualifiedImpressions;
    const clicks = campaign.clickCount;
    const ctr =
      impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;

    return {
      campaignId: campaign.id,
      period: {
        from: period?.from?.toISOString() ?? null,
        to: period?.to?.toISOString() ?? null,
      },
      served: campaign.servedCount,
      qualifiedImpressions: impressions,
      clicks,
      ctr,
      actions,
    };
  }
}
