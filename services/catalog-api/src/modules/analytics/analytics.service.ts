import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AnalyticsEventType, BusinessStatus, BusinessTrafficSource } from '@prisma/client';
import { getAnalyticsCapabilitiesForPlan } from '../../common/utils/analytics-capabilities.util';
import { normalizeSearchQueryForAnalytics } from '../../common/utils/search-query-analytics.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsDashboardBuilder } from './analytics-dashboard.builder';
import {
  buildAnalyticsExportCsv,
  CSV_UTF8_BOM,
} from './analytics-csv.serializer';
import { AnalyticsWindowQueryDto, CreateAnalyticsEventDto } from './dto/analytics.dto';
import {
  buildAnalyticsExportFilename,
  buildContentDisposition,
} from '../../common/utils/csv.util';

const EVENT_TYPES = Object.values(AnalyticsEventType);

const ACTION_EVENT_TYPES = new Set<AnalyticsEventType>([
  AnalyticsEventType.CALL_CLICK,
  AnalyticsEventType.WHATSAPP_CLICK,
  AnalyticsEventType.ROUTE_CLICK,
  'WEBSITE_CLICK' as AnalyticsEventType,
  'INSTAGRAM_CLICK' as AnalyticsEventType,
  AnalyticsEventType.FAVORITE_ADD,
  AnalyticsEventType.FAVORITE_REMOVE,
  AnalyticsEventType.PROMOTION_VIEW,
]);

@Injectable()
export class AnalyticsService {
  private readonly dashboardBuilder: AnalyticsDashboardBuilder;

  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
    private readonly businessAccess: BusinessAccessService,
  ) {
    this.dashboardBuilder = new AnalyticsDashboardBuilder(prisma, planLimits);
  }

  async track(dto: CreateAnalyticsEventDto) {
    const business = await this.prisma.business.findFirst({
      where: { id: dto.businessId, status: BusinessStatus.ACTIVE },
      select: { id: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (
      dto.type !== AnalyticsEventType.VIEW_BUSINESS &&
      (dto.trafficSource != null ||
        dto.searchQuery != null ||
        dto.audienceDistanceBucket != null)
    ) {
      throw new BadRequestException(
        'trafficSource, searchQuery and audienceDistanceBucket are only allowed for VIEW_BUSINESS events',
      );
    }

    let normalizedSearchQuery: string | undefined;
    if (
      dto.type === AnalyticsEventType.VIEW_BUSINESS &&
      dto.trafficSource === BusinessTrafficSource.SEARCH
    ) {
      normalizedSearchQuery =
        normalizeSearchQueryForAnalytics(dto.searchQuery) ?? undefined;
    }

    await this.prisma.analyticsEvent.create({
      data: {
        businessId: dto.businessId,
        type: dto.type,
        ...(dto.type === AnalyticsEventType.VIEW_BUSINESS && dto.trafficSource
          ? { trafficSource: dto.trafficSource }
          : {}),
        ...(normalizedSearchQuery ? { searchQuery: normalizedSearchQuery } : {}),
        ...(dto.type === AnalyticsEventType.VIEW_BUSINESS && dto.audienceDistanceBucket
          ? { audienceDistanceBucket: dto.audienceDistanceBucket }
          : {}),
      },
    });

    return { success: true };
  }

  async summary(user: AuthUser, businessId: string, query: AnalyticsWindowQueryDto) {
    await this.assertCanViewBusinessAnalytics(user, businessId);

    const requestedDays = query.days ?? 30;
    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    const days = Math.min(requestedDays, ctx.limits.maxAnalyticsDays);
    const createdAt = { gte: this.windowStart(days) };
    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['type'],
      where: { businessId, createdAt },
      _count: { _all: true },
    });

    const caps = getAnalyticsCapabilitiesForPlan(ctx.effectiveTier);
    const byType = this.emptyCounts();
    for (const item of grouped) {
      byType[item.type] = item._count._all;
    }
    const filteredByType = this.filterByTypeForPlan(byType, caps);

    return {
      businessId,
      days,
      analyticsTier: ctx.limits.analyticsTier,
      capabilities: this.planLimits.getAnalyticsCapabilities(ctx.effectiveTier),
      total: Object.values(filteredByType).reduce((sum, count) => sum + count, 0),
      byType: filteredByType,
    };
  }

  async dashboard(user: AuthUser, businessId: string, query: AnalyticsWindowQueryDto) {
    await this.assertCanViewBusinessAnalytics(user, businessId);
    return this.dashboardBuilder.build(businessId, query.days ?? 30);
  }

  async exportCsv(user: AuthUser, businessId: string, query: AnalyticsWindowQueryDto) {
    await this.assertCanViewBusinessAnalytics(user, businessId);

    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    const caps = getAnalyticsCapabilitiesForPlan(ctx.effectiveTier);
    if (!caps.reportExport) {
      throw new ForbiddenException('Экспорт отчётов доступен на тарифе VIP');
    }

    const requestedDays = query.days ?? 30;
    if (requestedDays < 1 || requestedDays > 365) {
      throw new BadRequestException('Period must be between 1 and 365 days');
    }

    const dashboard = await this.dashboardBuilder.build(businessId, requestedDays);
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        title: true,
        city: { select: { nameRu: true } },
      },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const generatedAt = new Date();
    const csvBody = buildAnalyticsExportCsv(dashboard, {
      businessTitle: business.title,
      cityName: business.city.nameRu,
      generatedAt,
    });
    const filename = buildAnalyticsExportFilename(businessId, business.title, generatedAt);

    return {
      body: `${CSV_UTF8_BOM}${csvBody}`,
      filename,
      contentDisposition: buildContentDisposition(filename),
    };
  }

  async trends(user: AuthUser, businessId: string, query: AnalyticsWindowQueryDto) {
    await this.assertCanViewBusinessAnalytics(user, businessId);

    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    const caps = getAnalyticsCapabilitiesForPlan(ctx.effectiveTier);
    if (!caps.viewTrend && !caps.actionTrend) {
      throw new ForbiddenException(
        'Динамика по дням недоступна на текущем тарифе. Обновите тариф в кабинете.',
      );
    }

    const requestedDays = query.days ?? 30;
    const days = Math.min(requestedDays, ctx.limits.maxAnalyticsDays);
    const events = await this.prisma.analyticsEvent.findMany({
      where: { businessId, createdAt: { gte: this.windowStart(days) } },
      select: { type: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const counts = new Map<string, number>();
    for (const event of events) {
      const date = event.createdAt.toISOString().slice(0, 10);
      const key = `${date}:${event.type}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const items = [...counts.entries()]
      .map(([key, count]) => {
        const separator = key.indexOf(':');
        return {
          date: key.slice(0, separator),
          type: key.slice(separator + 1) as AnalyticsEventType,
          count,
        };
      })
      .filter((item) => {
        if (item.type === AnalyticsEventType.VIEW_BUSINESS) return caps.viewTrend;
        return caps.actionTrend;
      });

    return { businessId, days, analyticsTier: ctx.limits.analyticsTier, items };
  }

  private async assertCanViewBusinessAnalytics(user: AuthUser, businessId: string) {
    await this.businessAccess.assertCanViewBusinessAnalytics(user, businessId);
  }

  private filterByTypeForPlan(
    byType: Record<AnalyticsEventType, number>,
    caps: ReturnType<typeof getAnalyticsCapabilitiesForPlan>,
  ): Record<AnalyticsEventType, number> {
    const filtered = this.emptyCounts();
    filtered[AnalyticsEventType.VIEW_BUSINESS] =
      byType[AnalyticsEventType.VIEW_BUSINESS] ?? 0;
    if (!caps.actions) {
      return filtered;
    }
    for (const type of ACTION_EVENT_TYPES) {
      filtered[type] = byType[type] ?? 0;
    }
    return filtered;
  }

  private emptyCounts(): Record<AnalyticsEventType, number> {
    return EVENT_TYPES.reduce(
      (counts, type) => ({ ...counts, [type]: 0 }),
      {} as Record<AnalyticsEventType, number>,
    );
  }

  private windowStart(days: number) {
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }
}
