import { Injectable, Logger } from '@nestjs/common';
import {
  AnalyticsDimensionType,
  AnalyticsEventType,
  Prisma,
} from '@prisma/client';
import {
  toLocalHourAndWeekday,
  toLocalMetricDate,
} from '../../common/utils/analytics-timezone.util';
import { PrismaService } from '../../prisma/prisma.service';

type RollupEvent = {
  type: AnalyticsEventType;
  createdAt: Date;
  trafficSource: string | null;
  searchQuery: string | null;
  audienceDistanceBucket: string | null;
  promotionId: string | null;
  catalogItemId: string | null;
  visitorHash: string | null;
  sessionId: string | null;
  isInternal: boolean;
};

const EMPTY_DAILY = {
  impressions: 0,
  views: 0,
  callClicks: 0,
  whatsappClicks: 0,
  routeClicks: 0,
  websiteClicks: 0,
  instagramClicks: 0,
  favoriteAdds: 0,
  promotionImpressions: 0,
  promotionViews: 0,
  promotionActions: 0,
  catalogImpressions: 0,
  catalogViews: 0,
  catalogActions: 0,
  reviewsViews: 0,
  reviewsCreated: 0,
  searchImpressions: 0,
  searchOpens: 0,
  sessionsApprox: 0,
  uniqueVisitorsApprox: 0,
};

@Injectable()
export class AnalyticsRollupService {
  private readonly logger = new Logger(AnalyticsRollupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Idempotent rollup for one business + local metric date. */
  async rollupBusinessDate(businessId: string, metricDate: string, timezone: string) {
    const events = await this.fetchEventsForLocalDate(businessId, metricDate, timezone);
    const external = events.filter((e) => !e.isInternal);
    const counts = this.aggregateDaily(external);
    const dimensions = this.buildDimensionRows(businessId, metricDate, external, timezone);

    await this.prisma.$transaction(async (tx) => {
      await tx.analyticsDailyMetric.upsert({
        where: { businessId_metricDate: { businessId, metricDate } },
        create: { businessId, metricDate, ...counts },
        update: counts,
      });

      await tx.analyticsDailyDimensionMetric.deleteMany({
        where: { businessId, metricDate },
      });

      if (dimensions.length > 0) {
        await tx.analyticsDailyDimensionMetric.createMany({ data: dimensions });
      }
    });
  }

  /** Roll up yesterday for all active businesses (cron entry point). */
  async rollupYesterdayForAllBusinesses() {
    const businesses = await this.prisma.business.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, city: { select: { timezone: true } } },
    });

    const yesterdayUtc = new Date();
    yesterdayUtc.setUTCDate(yesterdayUtc.getUTCDate() - 1);

    for (const business of businesses) {
      const tz = business.city.timezone;
      const metricDate = toLocalMetricDate(yesterdayUtc, tz);
      try {
        await this.rollupBusinessDate(business.id, metricDate, tz);
      } catch (error) {
        this.logger.warn(
          `Rollup failed for business=${business.id} date=${metricDate}: ${String(error)}`,
        );
      }
    }
  }

  private async fetchEventsForLocalDate(
    businessId: string,
    metricDate: string,
    timezone: string,
  ): Promise<RollupEvent[]> {
    const anchor = new Date(`${metricDate}T12:00:00.000Z`);
    const dayBefore = new Date(anchor);
    dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
    const dayAfter = new Date(anchor);
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);

    const rows = await this.prisma.analyticsEvent.findMany({
      where: {
        businessId,
        createdAt: { gte: dayBefore, lte: dayAfter },
      },
      select: {
        type: true,
        createdAt: true,
        trafficSource: true,
        searchQuery: true,
        audienceDistanceBucket: true,
        promotionId: true,
        catalogItemId: true,
        visitorHash: true,
        sessionId: true,
        isInternal: true,
      },
    });

    return rows.filter(
      (row) => toLocalMetricDate(row.createdAt, timezone) === metricDate,
    );
  }

  private aggregateDaily(events: RollupEvent[]) {
    const counts = { ...EMPTY_DAILY };
    const visitors = new Set<string>();
    const sessions = new Set<string>();

    for (const event of events) {
      switch (event.type) {
        case AnalyticsEventType.BUSINESS_IMPRESSION:
          counts.impressions += 1;
          break;
        case AnalyticsEventType.SEARCH_RESULT_IMPRESSION:
          counts.impressions += 1;
          counts.searchImpressions += 1;
          break;
        case AnalyticsEventType.VIEW_BUSINESS:
          counts.views += 1;
          if (event.trafficSource === 'SEARCH') counts.searchOpens += 1;
          break;
        case AnalyticsEventType.SEARCH_RESULT_OPEN:
          counts.views += 1;
          counts.searchOpens += 1;
          break;
        case AnalyticsEventType.CALL_CLICK:
          counts.callClicks += 1;
          break;
        case AnalyticsEventType.WHATSAPP_CLICK:
          counts.whatsappClicks += 1;
          break;
        case AnalyticsEventType.ROUTE_CLICK:
          counts.routeClicks += 1;
          break;
        case AnalyticsEventType.WEBSITE_CLICK:
          counts.websiteClicks += 1;
          break;
        case AnalyticsEventType.INSTAGRAM_CLICK:
          counts.instagramClicks += 1;
          break;
        case AnalyticsEventType.FAVORITE_ADD:
          counts.favoriteAdds += 1;
          break;
        case AnalyticsEventType.PROMOTION_IMPRESSION:
          counts.promotionImpressions += 1;
          break;
        case AnalyticsEventType.PROMOTION_VIEW:
          counts.promotionViews += 1;
          break;
        case AnalyticsEventType.PROMOTION_ACTION:
          counts.promotionActions += 1;
          break;
        case AnalyticsEventType.CATALOG_ITEM_IMPRESSION:
          counts.catalogImpressions += 1;
          break;
        case AnalyticsEventType.CATALOG_ITEM_VIEW:
          counts.catalogViews += 1;
          break;
        case AnalyticsEventType.CATALOG_ITEM_ACTION:
          counts.catalogActions += 1;
          break;
        case AnalyticsEventType.REVIEWS_VIEW:
          counts.reviewsViews += 1;
          break;
        case AnalyticsEventType.REVIEW_CREATED:
          counts.reviewsCreated += 1;
          break;
        default:
          break;
      }

      if (event.visitorHash) visitors.add(event.visitorHash);
      if (event.sessionId) sessions.add(event.sessionId);
    }

    counts.uniqueVisitorsApprox = visitors.size;
    counts.sessionsApprox = sessions.size;
    return counts;
  }

  buildDimensionRows(
    businessId: string,
    metricDate: string,
    events: RollupEvent[],
    timezone: string,
  ): Prisma.AnalyticsDailyDimensionMetricCreateManyInput[] {
    const rows: Prisma.AnalyticsDailyDimensionMetricCreateManyInput[] = [];
    const push = (
      dimensionType: AnalyticsDimensionType,
      dimensionKey: string,
      metricKey: string,
      count: number,
    ) => {
      if (count <= 0) return;
      rows.push({ businessId, metricDate, dimensionType, dimensionKey, metricKey, count });
    };

    const sourceCounts = new Map<string, number>();
    const searchCounts = new Map<string, number>();
    const promotionCounts = new Map<string, number>();
    const catalogCounts = new Map<string, number>();
    const hourCounts = new Map<string, number>();
    const distanceCounts = new Map<string, number>();

    for (const event of events) {
      const isViewLike =
        event.type === AnalyticsEventType.VIEW_BUSINESS ||
        event.type === AnalyticsEventType.BUSINESS_IMPRESSION ||
        event.type === AnalyticsEventType.SEARCH_RESULT_IMPRESSION ||
        event.type === AnalyticsEventType.SEARCH_RESULT_OPEN;

      if (isViewLike && event.trafficSource) {
        sourceCounts.set(event.trafficSource, (sourceCounts.get(event.trafficSource) ?? 0) + 1);
      }
      if (isViewLike && event.searchQuery && event.trafficSource === 'SEARCH') {
        searchCounts.set(event.searchQuery, (searchCounts.get(event.searchQuery) ?? 0) + 1);
      }
      if (isViewLike && event.audienceDistanceBucket) {
        distanceCounts.set(
          event.audienceDistanceBucket,
          (distanceCounts.get(event.audienceDistanceBucket) ?? 0) + 1,
        );
      }
      if (event.promotionId && event.type.startsWith('PROMOTION')) {
        promotionCounts.set(event.promotionId, (promotionCounts.get(event.promotionId) ?? 0) + 1);
      }
      if (event.catalogItemId && event.type.startsWith('CATALOG_ITEM')) {
        catalogCounts.set(event.catalogItemId, (catalogCounts.get(event.catalogItemId) ?? 0) + 1);
      }
      if (isViewLike) {
        const { hour } = toLocalHourAndWeekday(event.createdAt, timezone);
        hourCounts.set(String(hour), (hourCounts.get(String(hour)) ?? 0) + 1);
      }
    }

    for (const [key, count] of sourceCounts) push(AnalyticsDimensionType.SOURCE, key, 'views', count);
    for (const [key, count] of searchCounts) {
      push(AnalyticsDimensionType.SEARCH_QUERY, key, 'views', count);
    }
    for (const [key, count] of promotionCounts) {
      push(AnalyticsDimensionType.PROMOTION, key, 'views', count);
    }
    for (const [key, count] of catalogCounts) {
      push(AnalyticsDimensionType.CATALOG_ITEM, key, 'views', count);
    }
    for (const [key, count] of hourCounts) push(AnalyticsDimensionType.HOUR, key, 'views', count);
    for (const [key, count] of distanceCounts) {
      push(AnalyticsDimensionType.DISTANCE_BUCKET, key, 'views', count);
    }

    return rows;
  }
}
