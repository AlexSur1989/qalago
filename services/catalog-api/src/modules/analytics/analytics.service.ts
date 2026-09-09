import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AnalyticsEventType,
  BusinessPermission,
  BusinessStatus,
  BusinessTrafficSource,
  Prisma,
  UserRole,
} from '@prisma/client';
import { getAnalyticsCapabilitiesForPlan } from '../../common/utils/analytics-capabilities.util';
import {
  ATTRIBUTION_EVENT_TYPES,
  isOrganicAnalyticsEventType,
  PROMOTION_EVENT_TYPES,
  SEARCH_ATTRIBUTION_EVENT_TYPES,
} from '../../common/utils/analytics-organic-events.util';
import {
  hashVisitorId,
  isValidClientEventId,
  isValidSessionId,
  isValidVisitorId,
} from '../../common/utils/analytics-visitor.util';
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
  AnalyticsEventType.WEBSITE_CLICK,
  AnalyticsEventType.INSTAGRAM_CLICK,
  AnalyticsEventType.FAVORITE_ADD,
  AnalyticsEventType.FAVORITE_REMOVE,
  AnalyticsEventType.PROMOTION_VIEW,
  AnalyticsEventType.PROMOTION_ACTION,
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

  async track(dto: CreateAnalyticsEventDto, options?: { user?: AuthUser; internalHeader?: boolean }) {
    if (!isOrganicAnalyticsEventType(dto.type)) {
      throw new BadRequestException('Event type not allowed on organic analytics endpoint');
    }

    if (dto.clientEventId && !isValidClientEventId(dto.clientEventId)) {
      throw new BadRequestException('Invalid clientEventId');
    }

    if (dto.clientEventId) {
      const existing = await this.prisma.analyticsEvent.findUnique({
        where: { clientEventId: dto.clientEventId.trim() },
        select: { id: true },
      });
      if (existing) {
        return { success: true, deduplicated: true };
      }
    }

    this.assertContextRules(dto);

    const isSearchPerformed = dto.type === AnalyticsEventType.SEARCH_PERFORMED;
    if (!isSearchPerformed && !dto.businessId) {
      throw new BadRequestException('businessId is required for this event type');
    }
    if (isSearchPerformed && !dto.cityId) {
      throw new BadRequestException('cityId is required for SEARCH_PERFORMED');
    }

    let business: { id: string; cityId: string } | null = null;
    if (dto.businessId) {
      business = await this.prisma.business.findFirst({
        where: { id: dto.businessId, status: BusinessStatus.ACTIVE },
        select: { id: true, cityId: true },
      });
      if (!business) {
        throw new NotFoundException('Business not found');
      }
    }

    if (isSearchPerformed) {
      const city = await this.prisma.city.findFirst({
        where: { id: dto.cityId, isActive: true },
        select: { id: true },
      });
      if (!city) {
        throw new NotFoundException('City not found');
      }
    }

    if (dto.promotionId && business) {
      const promotion = await this.prisma.promotion.findFirst({
        where: { id: dto.promotionId, businessId: business.id },
        select: { id: true },
      });
      if (!promotion) {
        throw new BadRequestException('promotionId does not belong to business');
      }
    }

    if (dto.catalogItemId && business) {
      const item = await this.prisma.serviceItem.findFirst({
        where: { id: dto.catalogItemId, businessId: business.id, isActive: true },
        select: { id: true },
      });
      if (!item) {
        throw new BadRequestException('catalogItemId does not belong to business');
      }
    }

    let normalizedSearchQuery: string | undefined;
    if (
      (SEARCH_ATTRIBUTION_EVENT_TYPES.has(dto.type) &&
        dto.trafficSource === BusinessTrafficSource.SEARCH) ||
      isSearchPerformed
    ) {
      normalizedSearchQuery =
        normalizeSearchQueryForAnalytics(dto.searchQuery) ?? undefined;
    }

    let visitorHash: string | undefined;
    if (dto.visitorId) {
      if (!isValidVisitorId(dto.visitorId)) {
        throw new BadRequestException('Invalid visitorId');
      }
      visitorHash = hashVisitorId(dto.visitorId);
    }

    let sessionId: string | undefined;
    if (dto.sessionId) {
      if (!isValidSessionId(dto.sessionId)) {
        throw new BadRequestException('Invalid sessionId');
      }
      sessionId = dto.sessionId.trim();
    }

    const isInternal =
      dto.isInternal === true ||
      options?.internalHeader === true ||
      options?.user?.role === UserRole.ADMIN ||
      options?.user?.role === UserRole.CITY_ADMIN;

    const data: Prisma.AnalyticsEventUncheckedCreateInput = {
      type: dto.type,
      isInternal,
      businessId: business?.id,
      cityId: business?.cityId ?? (isSearchPerformed ? dto.cityId : undefined),
      ...(ATTRIBUTION_EVENT_TYPES.has(dto.type) && dto.trafficSource
        ? { trafficSource: dto.trafficSource }
        : {}),
      ...(ATTRIBUTION_EVENT_TYPES.has(dto.type) && dto.discoverySurface
        ? { discoverySurface: dto.discoverySurface }
        : {}),
      ...(normalizedSearchQuery ? { searchQuery: normalizedSearchQuery } : {}),
      ...(ATTRIBUTION_EVENT_TYPES.has(dto.type) && dto.audienceDistanceBucket
        ? { audienceDistanceBucket: dto.audienceDistanceBucket }
        : {}),
      ...(PROMOTION_EVENT_TYPES.has(dto.type) && dto.promotionId
        ? { promotionId: dto.promotionId }
        : {}),
      ...(dto.catalogItemId && dto.type.startsWith('CATALOG_ITEM')
        ? { catalogItemId: dto.catalogItemId }
        : {}),
      ...(dto.platform ? { platform: dto.platform } : {}),
      ...(dto.position != null ? { position: dto.position } : {}),
      ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
      ...(visitorHash ? { visitorHash } : {}),
      ...(sessionId ? { sessionId } : {}),
      ...(dto.clientEventId ? { clientEventId: dto.clientEventId.trim() } : {}),
    };

    try {
      await this.prisma.analyticsEvent.create({ data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        dto.clientEventId
      ) {
        return { success: true, deduplicated: true };
      }
      throw error;
    }

    return { success: true };
  }

  private assertContextRules(dto: CreateAnalyticsEventDto) {
    const hasAttribution =
      dto.trafficSource != null ||
      dto.searchQuery != null ||
      dto.audienceDistanceBucket != null ||
      dto.discoverySurface != null;

    if (hasAttribution && !ATTRIBUTION_EVENT_TYPES.has(dto.type)) {
      throw new BadRequestException(
        'trafficSource, discoverySurface, searchQuery and audienceDistanceBucket are only allowed for attribution events',
      );
    }

  }

  async summary(user: AuthUser, businessId: string, query: AnalyticsWindowQueryDto) {
    await this.assertCanViewBusinessAnalytics(user, businessId);

    const requestedDays = query.days ?? 30;
    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    const days = Math.min(requestedDays, ctx.limits.maxAnalyticsDays);
    const createdAt = { gte: this.windowStart(days) };
    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['type'],
      where: { businessId, isInternal: false, createdAt },
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
    await this.businessAccess.assertBusinessPermission(
      user,
      businessId,
      BusinessPermission.ANALYTICS_EXPORT,
    );

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
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { city: { select: { timezone: true } } },
    });
    const timezone = business?.city?.timezone;

    const rollupRows = await this.prisma.analyticsDailyMetric.findMany({
      where: {
        businessId,
        metricDate: { gte: this.localMetricDateStart(days, timezone) },
      },
      orderBy: { metricDate: 'asc' },
    });

    if (rollupRows.length > 0) {
      const items = rollupRows.flatMap((row) => {
        const entries: Array<{ date: string; type: AnalyticsEventType; count: number }> = [];
        if (caps.viewTrend && row.views > 0) {
          entries.push({
            date: row.metricDate,
            type: AnalyticsEventType.VIEW_BUSINESS,
            count: row.views,
          });
        }
        if (caps.actionTrend) {
          const actionTotal =
            row.callClicks +
            row.whatsappClicks +
            row.routeClicks +
            row.websiteClicks +
            row.instagramClicks +
            row.favoriteAdds;
          if (actionTotal > 0) {
            entries.push({
              date: row.metricDate,
              type: AnalyticsEventType.CALL_CLICK,
              count: actionTotal,
            });
          }
        }
        return entries;
      });

      return { businessId, days, analyticsTier: ctx.limits.analyticsTier, items };
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where: { businessId, isInternal: false, createdAt: { gte: this.windowStart(days) } },
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

  private localMetricDateStart(days: number, timezone?: string | null): string {
    const end = new Date();
    const start = this.windowStart(days, end);
    return start.toISOString().slice(0, 10);
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

  private windowStart(days: number, end = new Date()) {
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }
}
