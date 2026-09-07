import { AnalyticsEventType, BusinessPlanTier, BusinessTrafficSource } from '@prisma/client';
import {
  AnalyticsCapabilities,
  buildDateRange,
  deltaPercent,
  getAnalyticsCapabilitiesForPlan,
  getAnalyticsHeadline,
  getAnalyticsLockedSections,
  weekdayLabel,
  windowStart,
} from '../../common/utils/analytics-capabilities.util';
import { aggregateTrafficSources } from '../../common/utils/business-traffic-source.util';
import { aggregateSearchQueries } from '../../common/utils/search-query-analytics.util';
import { aggregateAudienceGeography } from '../../common/utils/audience-geography.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';

const ACTION_TYPES: AnalyticsEventType[] = [
  AnalyticsEventType.CALL_CLICK,
  AnalyticsEventType.WHATSAPP_CLICK,
  AnalyticsEventType.ROUTE_CLICK,
  'WEBSITE_CLICK' as AnalyticsEventType,
  'INSTAGRAM_CLICK' as AnalyticsEventType,
  AnalyticsEventType.FAVORITE_ADD,
  AnalyticsEventType.PROMOTION_VIEW,
];

type EventRow = { type: AnalyticsEventType; createdAt: Date };

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
    const from = windowStart(days, end);
    const to = new Date(end);
    to.setHours(23, 59, 59, 999);

    const currentEvents = await this.fetchEvents(businessId, from, to);
    const counts = this.countByType(currentEvents);

    const overview = this.buildOverview(counts, caps);
    const actions = caps.actions ? this.buildActions(counts) : null;
    const trends = this.buildTrends(currentEvents, days, caps, end);

    let sources = null;
    let searchQueries = null;
    let searchQueriesStatus: 'AVAILABLE' | 'INSUFFICIENT_DATA' | null = null;
    let searchQueriesOtherCount: number | null = null;
    let conversion = null;
    let comparison = null;
    let promotions = null;
    let popularTimes = null;
    let benchmark = null;
    let recommendations = null;
    let audienceGeography = null;
    let audienceGeographyStatus: 'AVAILABLE' | 'INSUFFICIENT_DATA' | null = null;

    if (caps.trafficSources) {
      sources = await this.buildSources(businessId, from, to);
    }
    if (caps.searchQueries) {
      const searchResult = await this.buildSearchQueries(businessId, from, to);
      searchQueries = searchResult.queries;
      searchQueriesStatus = searchResult.status;
      searchQueriesOtherCount = searchResult.otherCount > 0 ? searchResult.otherCount : null;
    }
    if (caps.conversion) {
      conversion = this.buildConversion(counts);
    }
    if (caps.periodComparison) {
      comparison = await this.buildComparison(businessId, days, counts, end);
    }
    if (caps.promotionAnalytics) {
      promotions = { promotionViews: counts[AnalyticsEventType.PROMOTION_VIEW] ?? 0 };
    }
    if (caps.popularTimes) {
      popularTimes = this.buildPopularTimes(currentEvents);
    }
    if (caps.benchmark) {
      benchmark = await this.buildBenchmark(businessId, counts);
    }
    if (caps.recommendations) {
      recommendations = this.buildRecommendations(counts, caps);
    }
    if (caps.audienceGeography) {
      const views = counts[AnalyticsEventType.VIEW_BUSINESS] ?? 0;
      const geography = await this.buildAudienceGeography(businessId, from, to, views);
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
        from: from.toISOString(),
        to: to.toISOString(),
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

  private async buildAudienceGeography(
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

  private async buildSearchQueries(businessId: string, from: Date, to: Date) {
    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['searchQuery'],
      where: {
        businessId,
        campaignId: null,
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

  private async buildSources(businessId: string, from: Date, to: Date) {
    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['trafficSource'],
      where: {
        businessId,
        campaignId: null,
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

  private buildOverview(
    counts: Partial<Record<AnalyticsEventType, number>>,
    caps: AnalyticsCapabilities,
  ) {
    const views = counts[AnalyticsEventType.VIEW_BUSINESS] ?? 0;
    const overview: { views: number; totalCustomerActions?: number } = { views };
    if (caps.actions) {
      overview.totalCustomerActions = this.sumActions(counts);
    }
    return overview;
  }

  private buildActions(counts: Partial<Record<AnalyticsEventType, number>>) {
    const calls = counts[AnalyticsEventType.CALL_CLICK] ?? 0;
    const whatsapp = counts[AnalyticsEventType.WHATSAPP_CLICK] ?? 0;
    const routes = counts[AnalyticsEventType.ROUTE_CLICK] ?? 0;
    const website = counts['WEBSITE_CLICK' as AnalyticsEventType] ?? 0;
    const instagram = counts['INSTAGRAM_CLICK' as AnalyticsEventType] ?? 0;
    const favorites = counts[AnalyticsEventType.FAVORITE_ADD] ?? 0;
    const promotionViews = counts[AnalyticsEventType.PROMOTION_VIEW] ?? 0;
    return {
      total: calls + whatsapp + routes + website + instagram + favorites + promotionViews,
      calls,
      whatsapp,
      routes,
      website,
      instagram,
      favorites,
      promotionViews,
    };
  }

  private sumActions(counts: Partial<Record<AnalyticsEventType, number>>) {
    return ACTION_TYPES.reduce((sum, type) => sum + (counts[type] ?? 0), 0);
  }

  private buildTrends(
    events: EventRow[],
    days: number,
    caps: AnalyticsCapabilities,
    end: Date,
  ) {
    const dates = buildDateRange(days, end);
    const viewMap = new Map<string, number>();
    const actionMap = new Map<string, number>();
    for (const date of dates) {
      viewMap.set(date, 0);
      actionMap.set(date, 0);
    }

    for (const event of events) {
      const date = event.createdAt.toISOString().slice(0, 10);
      if (!viewMap.has(date)) continue;
      if (event.type === AnalyticsEventType.VIEW_BUSINESS) {
        viewMap.set(date, (viewMap.get(date) ?? 0) + 1);
      } else if (caps.actionTrend && ACTION_TYPES.includes(event.type)) {
        actionMap.set(date, (actionMap.get(date) ?? 0) + 1);
      }
    }

    const trends: {
      views: Array<{ date: string; count: number }>;
      actions?: Array<{ date: string; count: number }>;
    } = {
      views: dates.map((date) => ({ date, count: viewMap.get(date) ?? 0 })),
    };
    if (caps.actionTrend) {
      trends.actions = dates.map((date) => ({ date, count: actionMap.get(date) ?? 0 }));
    }
    return trends;
  }

  private async buildBenchmark(
    businessId: string,
    counts: Partial<Record<AnalyticsEventType, number>>,
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        category: { select: { title: true } },
        categoryId: true,
        cityId: true,
      },
    });
    if (!business) return null;

    const since = windowStart(30);
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
      } else if (ACTION_TYPES.includes(row.type)) {
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

  private buildConversion(counts: Partial<Record<AnalyticsEventType, number>>) {
    const views = counts[AnalyticsEventType.VIEW_BUSINESS] ?? 0;
    const actions = this.sumActions(counts);
    const rate = views > 0 ? Math.round((actions / views) * 1000) / 10 : 0;
    return { views, actions, rate };
  }

  private async buildComparison(
    businessId: string,
    days: number,
    currentCounts: Partial<Record<AnalyticsEventType, number>>,
    end: Date,
  ) {
    const currentStart = windowStart(days, end);
    const previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
    const previousStart = windowStart(days, previousEnd);

    const previousEvents = await this.fetchEvents(businessId, previousStart, previousEnd);
    const previousCounts = this.countByType(previousEvents);

    const currentViews = currentCounts[AnalyticsEventType.VIEW_BUSINESS] ?? 0;
    const previousViews = previousCounts[AnalyticsEventType.VIEW_BUSINESS] ?? 0;
    const currentActions = this.sumActions(currentCounts);
    const previousActions = this.sumActions(previousCounts);

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

  private buildPopularTimes(events: EventRow[]) {
    const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    const byWeekday = Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      label: weekdayLabel(weekday),
      count: 0,
    }));

    for (const event of events) {
      if (event.type !== AnalyticsEventType.VIEW_BUSINESS) continue;
      const hour = event.createdAt.getUTCHours();
      const weekday = event.createdAt.getUTCDay();
      byHour[hour].count += 1;
      byWeekday[weekday].count += 1;
    }

    return { byHour, byWeekday };
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
