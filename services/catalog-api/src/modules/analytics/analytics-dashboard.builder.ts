import {
  AnalyticsDimensionType,
  AnalyticsEventType,
  BusinessTrafficSource,
} from '@prisma/client';
import {
  AnalyticsCapabilities,
  deltaPercent,
  getAnalyticsCapabilitiesForPlan,
  getAnalyticsHeadline,
  getAnalyticsLockedSections,
  weekdayLabel,
} from '../../common/utils/analytics-capabilities.util';
import {
  aggregateDimensionCounts,
  emptyDailyTotals,
  periodCtrPercent,
  previousLocalMetricDateRange,
  RAW_EVENT_FALLBACK_MAX_DAYS,
  sumDailyMetricRows,
  sumIntentActionsForDay,
  sumIntentActionsFromDaily,
  viewToIntentConversionPercent,
  type DailyMetricRow,
  type DimensionMetricRow,
} from '../../common/utils/analytics-dashboard-metrics.util';
import {
  buildLocalMetricDateRange,
  toLocalHourAndWeekday,
  toLocalMetricDate,
  utcWindowForLocalDate,
} from '../../common/utils/analytics-timezone.util';
import { aggregateTrafficSources } from '../../common/utils/business-traffic-source.util';
import { aggregateSearchQueries } from '../../common/utils/search-query-analytics.util';
import { aggregateAudienceGeography } from '../../common/utils/audience-geography.util';
import {
  isBusinessIntentActionEventType,
  sumBusinessIntentActionsFromCounts,
} from '../../common/utils/analytics-intent-actions.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';

type EventRow = { type: AnalyticsEventType; createdAt: Date };

export type DashboardOverview = {
  views: number;
  totalCustomerActions?: number;
  actions?: number;
  impressions?: number;
  ctr?: number | null;
  conversionRate?: number | null;
  uniqueVisitorsDailySumApprox?: number;
  sessionsDailySumApprox?: number;
  uniqueVisitorsPeriodDistinct?: number | null;
  sessionsPeriodDistinct?: number | null;
};

export class AnalyticsDashboardBuilder {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  async build(businessId: string, requestedDays: number) {
    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    const caps = getAnalyticsCapabilitiesForPlan(ctx.effectiveTier);
    const days = Math.min(requestedDays, caps.maxDays);
    const end = new Date();

    const businessMeta = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        city: { select: { timezone: true } },
        category: { select: { title: true } },
        categoryId: true,
        cityId: true,
      },
    });
    const timezone = businessMeta?.city.timezone ?? null;

    const dateRange = buildLocalMetricDateRange(days, end, timezone);
    const rangeStart = dateRange[0] ?? toLocalMetricDate(end, timezone);
    const rangeEnd = dateRange[dateRange.length - 1] ?? rangeStart;
    const periodFrom = utcWindowForLocalDate(rangeStart, timezone).from;
    const periodTo = utcWindowForLocalDate(rangeEnd, timezone).to;

    const [dailyRows, dimensionRows] = await Promise.all([
      this.loadDailyMetrics(businessId, rangeStart, rangeEnd),
      this.loadDimensionMetrics(businessId, rangeStart, rangeEnd),
    ]);

    const hasRollupRows = dailyRows.length > 0;
    const useRollups = hasRollupRows || days > RAW_EVENT_FALLBACK_MAX_DAYS;

    let currentEvents: EventRow[] = [];
    let dailyTotals = emptyDailyTotals();
    let counts: Partial<Record<AnalyticsEventType, number>> = {};

    if (useRollups) {
      dailyTotals = sumDailyMetricRows(dailyRows);
      counts = this.countsFromDailyTotals(dailyTotals);
    } else {
      currentEvents = await this.fetchEvents(businessId, periodFrom, periodTo);
      counts = this.countByType(currentEvents);
      dailyTotals = this.dailyTotalsFromEventCounts(counts);
    }

    const overview = await this.buildOverview(
      dailyTotals,
      caps,
      days,
      businessId,
      periodFrom,
      periodTo,
    );
    const actions = caps.actions ? this.buildActionsFromTotals(dailyTotals) : null;
    const trends = useRollups
      ? this.buildTrendsFromRollups(dailyRows, dateRange, caps)
      : this.buildTrendsFromEvents(currentEvents, dateRange, caps, timezone);

    let sources = null;
    let searchQueries = null;
    let searchQueriesStatus: 'AVAILABLE' | 'INSUFFICIENT_DATA' | null = null;
    let searchQueriesOtherCount: number | null = null;
    let conversion = null;
    let comparison = null;
    let promotions: Record<string, unknown> | null = null;
    let catalog: Record<string, unknown> | null = null;
    let audience: Record<string, unknown> | null = null;
    let popularTimes = null;
    let benchmark = null;
    let recommendations = null;
    let audienceGeography = null;
    let audienceGeographyStatus: 'AVAILABLE' | 'INSUFFICIENT_DATA' | null = null;

    if (caps.trafficSources) {
      sources = useRollups
        ? this.buildSourcesFromDimensions(dimensionRows)
        : await this.buildSourcesRaw(businessId, periodFrom, periodTo);
    }
    if (caps.searchQueries) {
      const searchResult = useRollups
        ? this.buildSearchQueriesFromDimensions(dimensionRows)
        : await this.buildSearchQueriesRaw(businessId, periodFrom, periodTo);
      searchQueries = searchResult.queries;
      searchQueriesStatus = searchResult.status;
      searchQueriesOtherCount = searchResult.otherCount > 0 ? searchResult.otherCount : null;
    }
    if (caps.conversion) {
      conversion = this.buildConversion(dailyTotals, counts);
    }
    if (caps.periodComparison) {
      comparison = await this.buildComparison(
        businessId,
        dateRange,
        timezone,
        dailyTotals,
        counts,
        useRollups,
        periodFrom,
        periodTo,
      );
    }
    if (caps.promotionAnalytics) {
      promotions = this.buildPromotionsSection(dailyTotals, dimensionRows);
    }
    if (caps.recommendations) {
      catalog = this.buildCatalogSection(dimensionRows);
      audience = this.buildAudienceVisitorTypeSection(dimensionRows);
    }
    if (caps.popularTimes) {
      popularTimes = useRollups
        ? this.buildPopularTimesFromDimensions(dimensionRows, currentEvents, timezone, !useRollups)
        : this.buildPopularTimesFromEvents(currentEvents, timezone);
    }
    if (caps.benchmark) {
      benchmark = await this.buildBenchmark(businessId, businessMeta, counts);
    }
    if (caps.recommendations) {
      recommendations = this.buildRecommendations(counts, caps);
    }
    if (caps.audienceGeography) {
      const views = dailyTotals.views;
      const geography = useRollups
        ? this.buildAudienceGeographyFromDimensions(dimensionRows, views)
        : await this.buildAudienceGeographyRaw(businessId, periodFrom, periodTo, views);
      audienceGeography = geography.buckets;
      audienceGeographyStatus = geography.status;
    }

    return {
      businessId,
      plan: ctx.tier,
      effectivePlan: ctx.effectiveTier,
      headline: getAnalyticsHeadline(ctx.effectiveTier),
      capabilities: this.publicCapabilities(caps),
      lockedSections: getAnalyticsLockedSections(ctx.effectiveTier),
      effectiveRange: {
        days,
        from: periodFrom.toISOString(),
        to: periodTo.toISOString(),
      },
      overview,
      actions,
      trends,
      sources,
      sourcesStatus: null,
      searchQueries,
      searchQueriesStatus,
      searchQueriesOtherCount,
      conversion,
      comparison,
      promotions,
      catalog,
      audience,
      popularTimes,
      benchmark,
      recommendations,
      audienceGeography,
      audienceGeographyStatus,
    };
  }

  private publicCapabilities(caps: AnalyticsCapabilities) {
    const { summary: _s, trends: _t, tier: _tier, ...rest } = caps;
    return rest;
  }

  private async loadDailyMetrics(
    businessId: string,
    fromDate: string,
    toDate: string,
  ): Promise<DailyMetricRow[]> {
    return this.prisma.analyticsDailyMetric.findMany({
      where: { businessId, metricDate: { gte: fromDate, lte: toDate } },
    });
  }

  private async loadDimensionMetrics(
    businessId: string,
    fromDate: string,
    toDate: string,
  ): Promise<DimensionMetricRow[]> {
    return this.prisma.analyticsDailyDimensionMetric.findMany({
      where: { businessId, metricDate: { gte: fromDate, lte: toDate } },
      select: {
        dimensionType: true,
        dimensionKey: true,
        metricKey: true,
        count: true,
      },
    });
  }

  private countsFromDailyTotals(totals: ReturnType<typeof emptyDailyTotals>) {
    return {
      [AnalyticsEventType.VIEW_BUSINESS]: totals.views,
      [AnalyticsEventType.BUSINESS_IMPRESSION]: totals.impressions,
      [AnalyticsEventType.CALL_CLICK]: totals.callClicks,
      [AnalyticsEventType.WHATSAPP_CLICK]: totals.whatsappClicks,
      [AnalyticsEventType.ROUTE_CLICK]: totals.routeClicks,
      ['WEBSITE_CLICK' as AnalyticsEventType]: totals.websiteClicks,
      ['INSTAGRAM_CLICK' as AnalyticsEventType]: totals.instagramClicks,
      [AnalyticsEventType.FAVORITE_ADD]: totals.favoriteAdds,
      [AnalyticsEventType.PROMOTION_VIEW]: totals.promotionViews,
    } as Partial<Record<AnalyticsEventType, number>>;
  }

  private dailyTotalsFromEventCounts(counts: Partial<Record<AnalyticsEventType, number>>) {
    return {
      ...emptyDailyTotals(),
      views: counts[AnalyticsEventType.VIEW_BUSINESS] ?? 0,
      impressions: counts[AnalyticsEventType.BUSINESS_IMPRESSION] ?? 0,
      callClicks: counts[AnalyticsEventType.CALL_CLICK] ?? 0,
      whatsappClicks: counts[AnalyticsEventType.WHATSAPP_CLICK] ?? 0,
      routeClicks: counts[AnalyticsEventType.ROUTE_CLICK] ?? 0,
      websiteClicks: counts['WEBSITE_CLICK' as AnalyticsEventType] ?? 0,
      instagramClicks: counts['INSTAGRAM_CLICK' as AnalyticsEventType] ?? 0,
      favoriteAdds: counts[AnalyticsEventType.FAVORITE_ADD] ?? 0,
      promotionViews: counts[AnalyticsEventType.PROMOTION_VIEW] ?? 0,
    };
  }

  private async buildOverview(
    dailyTotals: ReturnType<typeof emptyDailyTotals>,
    caps: AnalyticsCapabilities,
    days: number,
    businessId: string,
    periodFrom: Date,
    periodTo: Date,
  ) {
    const views = dailyTotals.views;
    const overview: DashboardOverview = { views };

    if (caps.actions) {
      const actions = sumIntentActionsFromDaily(dailyTotals);
      overview.totalCustomerActions = actions;
      overview.actions = actions;
      overview.impressions = dailyTotals.impressions;
      overview.ctr = periodCtrPercent(views, dailyTotals.impressions);
      overview.uniqueVisitorsDailySumApprox = dailyTotals.uniqueVisitorsApprox;
      overview.sessionsDailySumApprox = dailyTotals.sessionsApprox;
    }

    if (caps.conversion) {
      const actions = sumIntentActionsFromDaily(dailyTotals);
      overview.conversionRate = viewToIntentConversionPercent(actions, views);
    }

    await this.attachPeriodDistinctVisitors(overview, caps, days, businessId, periodFrom, periodTo);

    return overview;
  }

  private async attachPeriodDistinctVisitors(
    overview: DashboardOverview,
    caps: AnalyticsCapabilities,
    days: number,
    businessId: string,
    periodFrom: Date,
    periodTo: Date,
  ) {
    if (!caps.actions || days > RAW_EVENT_FALLBACK_MAX_DAYS) {
      overview.uniqueVisitorsPeriodDistinct = null;
      overview.sessionsPeriodDistinct = null;
      return;
    }

    const [visitorGroups, sessionGroups] = await Promise.all([
      this.prisma.analyticsEvent.groupBy({
        by: ['visitorHash'],
        where: {
          businessId,
          campaignId: null,
          isInternal: false,
          visitorHash: { not: null },
          createdAt: { gte: periodFrom, lte: periodTo },
        },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
          businessId,
          campaignId: null,
          isInternal: false,
          sessionId: { not: null },
          createdAt: { gte: periodFrom, lte: periodTo },
        },
      }),
    ]);

    overview.uniqueVisitorsPeriodDistinct = visitorGroups.length;
    overview.sessionsPeriodDistinct = sessionGroups.length;
  }

  private buildActionsFromTotals(totals: ReturnType<typeof emptyDailyTotals>) {
    const calls = totals.callClicks;
    const whatsapp = totals.whatsappClicks;
    const routes = totals.routeClicks;
    const website = totals.websiteClicks;
    const instagram = totals.instagramClicks;
    const favorites = totals.favoriteAdds;
    const promotionViews = totals.promotionViews;
    return {
      total: sumIntentActionsFromDaily(totals),
      calls,
      whatsapp,
      routes,
      website,
      instagram,
      favorites,
      promotionViews,
    };
  }

  private buildTrendsFromRollups(
    dailyRows: DailyMetricRow[],
    dateRange: string[],
    caps: AnalyticsCapabilities,
  ) {
    const byDate = new Map(dailyRows.map((row) => [row.metricDate, row]));
    const trends: {
      views: Array<{ date: string; count: number }>;
      actions?: Array<{ date: string; count: number }>;
    } = {
      views: dateRange.map((date) => ({ date, count: byDate.get(date)?.views ?? 0 })),
    };
    if (caps.actionTrend) {
      trends.actions = dateRange.map((date) => ({
        date,
        count: sumIntentActionsForDay(byDate.get(date)),
      }));
    }
    return trends;
  }

  private buildTrendsFromEvents(
    events: EventRow[],
    dateRange: string[],
    caps: AnalyticsCapabilities,
    timezone?: string | null,
  ) {
    const viewMap = new Map<string, number>();
    const actionMap = new Map<string, number>();
    for (const date of dateRange) {
      viewMap.set(date, 0);
      actionMap.set(date, 0);
    }

    for (const event of events) {
      const date = buildLocalMetricDateRange(1, event.createdAt, timezone)[0];
      if (!viewMap.has(date)) continue;
      if (event.type === AnalyticsEventType.VIEW_BUSINESS) {
        viewMap.set(date, (viewMap.get(date) ?? 0) + 1);
      } else if (caps.actionTrend && isBusinessIntentActionEventType(event.type)) {
        actionMap.set(date, (actionMap.get(date) ?? 0) + 1);
      }
    }

    const trends: {
      views: Array<{ date: string; count: number }>;
      actions?: Array<{ date: string; count: number }>;
    } = {
      views: dateRange.map((date) => ({ date, count: viewMap.get(date) ?? 0 })),
    };
    if (caps.actionTrend) {
      trends.actions = dateRange.map((date) => ({ date, count: actionMap.get(date) ?? 0 }));
    }
    return trends;
  }

  private buildSourcesFromDimensions(dimensionRows: DimensionMetricRow[]) {
    const map = aggregateDimensionCounts(dimensionRows, AnalyticsDimensionType.SOURCE);
    return aggregateTrafficSources(
      [...map.entries()].map(([trafficSource, count]) => ({
        trafficSource: trafficSource as BusinessTrafficSource,
        count,
      })),
    );
  }

  private buildSearchQueriesFromDimensions(dimensionRows: DimensionMetricRow[]) {
    const map = aggregateDimensionCounts(dimensionRows, AnalyticsDimensionType.SEARCH_QUERY);
    return aggregateSearchQueries(
      [...map.entries()].map(([searchQuery, count]) => ({ searchQuery, count })),
    );
  }

  private buildAudienceGeographyFromDimensions(
    dimensionRows: DimensionMetricRow[],
    totalViews: number,
  ) {
    const map = aggregateDimensionCounts(dimensionRows, AnalyticsDimensionType.DISTANCE_BUCKET);
    return aggregateAudienceGeography(
      [...map.entries()].map(([bucket, count]) => ({
        bucket: bucket as import('@prisma/client').AudienceDistanceBucket,
        count,
      })),
      totalViews,
    );
  }

  private buildPopularTimesFromDimensions(
    dimensionRows: DimensionMetricRow[],
    fallbackEvents: EventRow[],
    timezone?: string | null,
    useEventWeekdayFallback?: boolean,
  ) {
    const hourMap = aggregateDimensionCounts(dimensionRows, AnalyticsDimensionType.HOUR);
    const byHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourMap.get(String(hour)) ?? 0,
    }));

    const byWeekday = Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      label: weekdayLabel(weekday),
      count: 0,
    }));

    if (useEventWeekdayFallback) {
      for (const event of fallbackEvents) {
        if (event.type !== AnalyticsEventType.VIEW_BUSINESS) continue;
        const { weekday } = toLocalHourAndWeekday(event.createdAt, timezone);
        byWeekday[weekday].count += 1;
      }
    }

    return { byHour, byWeekday };
  }

  private buildPopularTimesFromEvents(events: EventRow[], timezone?: string | null) {
    const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    const byWeekday = Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      label: weekdayLabel(weekday),
      count: 0,
    }));

    for (const event of events) {
      if (event.type !== AnalyticsEventType.VIEW_BUSINESS) continue;
      const { hour, weekday } = toLocalHourAndWeekday(event.createdAt, timezone);
      byHour[hour].count += 1;
      byWeekday[weekday].count += 1;
    }

    return { byHour, byWeekday };
  }

  private buildPromotionsSection(
    dailyTotals: ReturnType<typeof emptyDailyTotals>,
    dimensionRows: DimensionMetricRow[],
  ) {
    const promoMap = aggregateDimensionCounts(dimensionRows, AnalyticsDimensionType.PROMOTION);
    const byPromotion = [...promoMap.entries()]
      .map(([promotionId, views]) => ({
        promotionId,
        views,
        impressions: null as number | null,
        actions: null as number | null,
      }))
      .sort((a, b) => b.views - a.views);

    return {
      promotionViews: dailyTotals.promotionViews,
      byPromotion,
      actionsAvailable: false,
    };
  }

  private buildCatalogSection(dimensionRows: DimensionMetricRow[]) {
    const catalogMap = aggregateDimensionCounts(dimensionRows, AnalyticsDimensionType.CATALOG_ITEM);
    const items = [...catalogMap.entries()]
      .map(([catalogItemId, views]) => ({
        catalogItemId,
        views,
        impressions: null as number | null,
        actions: null as number | null,
      }))
      .sort((a, b) => b.views - a.views);

    return {
      items,
      actionsAvailable: false,
    };
  }

  private buildAudienceVisitorTypeSection(dimensionRows: DimensionMetricRow[]) {
    const map = aggregateDimensionCounts(dimensionRows, AnalyticsDimensionType.VISITOR_TYPE);
    const newVisitorViews = map.get('NEW') ?? 0;
    const returningVisitorViews = map.get('RETURNING') ?? 0;
    const totalClassified = newVisitorViews + returningVisitorViews;
    const newShare =
      totalClassified > 0 ? Math.round((newVisitorViews / totalClassified) * 1000) / 10 : null;
    const returningShare =
      totalClassified > 0
        ? Math.round((returningVisitorViews / totalClassified) * 1000) / 10
        : null;

    return {
      newVisitorViews,
      returningVisitorViews,
      totalClassified,
      newShare,
      returningShare,
    };
  }

  private async buildAudienceGeographyRaw(
    businessId: string,
    from: Date,
    to: Date,
    totalViews: number,
  ) {
    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['audienceDistanceBucket'],
      where: {
        businessId,
        campaignId: null,
        isInternal: false,
        type: AnalyticsEventType.VIEW_BUSINESS,
        createdAt: { gte: from, lte: to },
      },
      _count: { _all: true },
    });

    return aggregateAudienceGeography(
      grouped.map((row) => ({
        bucket: row.audienceDistanceBucket,
        count: row._count._all,
      })),
      totalViews,
    );
  }

  private async buildSearchQueriesRaw(businessId: string, from: Date, to: Date) {
    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['searchQuery'],
      where: {
        businessId,
        campaignId: null,
        isInternal: false,
        type: AnalyticsEventType.VIEW_BUSINESS,
        trafficSource: BusinessTrafficSource.SEARCH,
        searchQuery: { not: null },
        createdAt: { gte: from, lte: to },
      },
      _count: { _all: true },
    });

    return aggregateSearchQueries(
      grouped
        .filter((row) => row.searchQuery != null)
        .map((row) => ({
          searchQuery: row.searchQuery as string,
          count: row._count._all,
        })),
    );
  }

  private async buildSourcesRaw(businessId: string, from: Date, to: Date) {
    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['trafficSource'],
      where: {
        businessId,
        campaignId: null,
        isInternal: false,
        type: AnalyticsEventType.VIEW_BUSINESS,
        createdAt: { gte: from, lte: to },
      },
      _count: { _all: true },
    });

    return aggregateTrafficSources(
      grouped.map((row) => ({
        trafficSource: row.trafficSource,
        count: row._count._all,
      })),
    );
  }

  private async fetchEvents(businessId: string, from: Date, to: Date): Promise<EventRow[]> {
    return this.prisma.analyticsEvent.findMany({
      where: {
        businessId,
        campaignId: null,
        isInternal: false,
        createdAt: { gte: from, lte: to },
      },
      select: { type: true, createdAt: true },
    });
  }

  private countByType(events: EventRow[]): Partial<Record<AnalyticsEventType, number>> {
    const counts: Partial<Record<AnalyticsEventType, number>> = {};
    for (const event of events) {
      counts[event.type] = (counts[event.type] ?? 0) + 1;
    }
    return counts;
  }

  private sumActions(counts: Partial<Record<AnalyticsEventType, number>>) {
    return sumBusinessIntentActionsFromCounts(counts);
  }

  private async buildBenchmark(
    businessId: string,
    business: {
      category: { title: string };
      categoryId: string;
      cityId: string;
    } | null,
    counts: Partial<Record<AnalyticsEventType, number>>,
  ) {
    if (!business?.category) return null;

    const since = utcWindowForLocalDate(
      buildLocalMetricDateRange(30)[0],
      null,
    ).from;

    const peers = await this.prisma.analyticsEvent.groupBy({
      by: ['businessId', 'type'],
      where: {
        businessId: { not: businessId },
        campaignId: null,
        createdAt: { gte: since },
        business: { categoryId: business.categoryId, cityId: business.cityId },
      },
      _count: { _all: true },
    });

    const peerIds = new Set(peers.map((p) => p.businessId));
    const peerCount = peerIds.size;
    if (peerCount < 5) {
      return {
        status: 'INSUFFICIENT_DATA' as const,
        categoryTitle: business.category.title,
        cohortSize: peerCount,
        message: 'Недостаточно данных для сравнения с категорией (минимум 5 заведений).',
      };
    }

    let peerViews = 0;
    let peerActions = 0;
    for (const row of peers) {
      if (row.type === AnalyticsEventType.VIEW_BUSINESS) {
        peerViews += row._count._all;
      } else if (isBusinessIntentActionEventType(row.type)) {
        peerActions += row._count._all;
      }
    }

    const businessViews = counts[AnalyticsEventType.VIEW_BUSINESS] ?? 0;
    const businessActions = this.sumActions(counts);

    return {
      status: 'AVAILABLE' as const,
      categoryTitle: business.category.title,
      businessViews,
      categoryAvgViews: Math.round(peerViews / peerCount),
      businessActions,
      categoryAvgActions: Math.round(peerActions / peerCount),
      cohortSize: peerCount,
    };
  }

  private buildConversion(
    dailyTotals: ReturnType<typeof emptyDailyTotals>,
    counts: Partial<Record<AnalyticsEventType, number>>,
  ) {
    const views = dailyTotals.views;
    const actions = sumIntentActionsFromDaily(dailyTotals);
    const rate = views > 0 ? Math.round((actions / views) * 1000) / 10 : 0;
    return { views, actions, rate };
  }

  private async buildComparison(
    businessId: string,
    dateRange: string[],
    timezone: string | null,
    currentTotals: ReturnType<typeof emptyDailyTotals>,
    currentCounts: Partial<Record<AnalyticsEventType, number>>,
    useRollups: boolean,
    periodFrom: Date,
    periodTo: Date,
  ) {
    const days = dateRange.length;
    const previousRange = previousLocalMetricDateRange(dateRange);
    const prevStart = previousRange[0];
    const prevEnd = previousRange[previousRange.length - 1];

    let previousViews = 0;
    let previousActions = 0;

    if (useRollups && prevStart && prevEnd) {
      const prevRows = await this.loadDailyMetrics(businessId, prevStart, prevEnd);
      const prevTotals = sumDailyMetricRows(prevRows);
      previousViews = prevTotals.views;
      previousActions = sumIntentActionsFromDaily(prevTotals);
    } else if (prevStart && prevEnd) {
      const prevFrom = utcWindowForLocalDate(prevStart, timezone).from;
      const prevTo = utcWindowForLocalDate(prevEnd, timezone).to;
      const previousEvents = await this.fetchEvents(businessId, prevFrom, prevTo);
      const previousCounts = this.countByType(previousEvents);
      previousViews = previousCounts[AnalyticsEventType.VIEW_BUSINESS] ?? 0;
      previousActions = this.sumActions(previousCounts);
    }

    const currentViews = currentTotals.views;
    const currentActions = sumIntentActionsFromDaily(currentTotals);

    void periodFrom;
    void periodTo;
    void currentCounts;

    return {
      currentDays: days,
      previousDays: days,
      metrics: [
        {
          key: 'views',
          label: 'Просмотры',
          current: currentViews,
          previous: previousViews,
          deltaPercent: deltaPercent(currentViews, previousViews),
        },
        {
          key: 'actions',
          label: 'Действия клиентов',
          current: currentActions,
          previous: previousActions,
          deltaPercent: deltaPercent(currentActions, previousActions),
        },
      ],
    };
  }

  private buildRecommendations(
    counts: Partial<Record<AnalyticsEventType, number>>,
    caps: AnalyticsCapabilities,
  ) {
    const views = counts[AnalyticsEventType.VIEW_BUSINESS] ?? 0;
    const actions = this.sumActions(counts);
    const calls = counts[AnalyticsEventType.CALL_CLICK] ?? 0;
    const whatsapp = counts[AnalyticsEventType.WHATSAPP_CLICK] ?? 0;
    const promotionViews = counts[AnalyticsEventType.PROMOTION_VIEW] ?? 0;
    const items: Array<{ id: string; title: string; body: string }> = [];

    if (views >= 20 && actions === 0) {
      items.push({
        id: 'no-actions',
        title: 'Много просмотров, мало действий',
        body: 'Проверьте телефон, WhatsApp и актуальность акций в карточке — клиенты смотрят, но не связываются.',
      });
    }
    if (views >= 10 && calls + whatsapp === 0 && caps.actions) {
      items.push({
        id: 'contact-clicks',
        title: 'Добавьте способы связи',
        body: 'Укажите телефон и WhatsApp — это самые частые действия после просмотра карточки.',
      });
    }
    if (promotionViews === 0 && views >= 15) {
      items.push({
        id: 'promotions',
        title: 'Акции привлекают внимание',
        body: 'Создайте или продлите акцию — просмотры акций помогают конвертировать интерес в визиты.',
      });
    }
    if (items.length === 0) {
      items.push({
        id: 'keep-going',
        title: 'Стабильная активность',
        body: 'Продолжайте обновлять карточку и отслеживать динамику — регулярные изменения поддерживают интерес.',
      });
    }
    return items;
  }
}
