import { Injectable } from '@nestjs/common';
import {
  AdCampaignStatus,
  AnalyticsDimensionType,
  AuditAction,
  BusinessStatus,
  CityLaunchStatus,
  ModerationCaseStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { aggregateSearchQueries } from '../../common/utils/search-query-analytics.util';
import { sumBusinessIntentActionsFromDaily } from '../../common/utils/analytics-intent-actions.util';
import { STAFF_ROLES } from '@qalago/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportRange } from './reporting-range.util';
import { ReportScope, ReportingScopeService } from './reporting-scope.service';
import {
  CANONICAL_AD_PLACEMENT_CODES,
  CRITICAL_STAFF_AUDIT_ACTIONS,
} from './reporting.constants';
import { StaffMfaService } from '../staff-mfa/staff-mfa.service';

@Injectable()
export class ReportingQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeService: ReportingScopeService,
    private readonly staffMfa: StaffMfaService,
  ) {}

  private businessRelationFilter(scope: ReportScope): Prisma.BusinessWhereInput {
    return this.scopeService.businessCityWhere(scope);
  }

  async countUsers(scope: ReportScope, range: ReportRange) {
    const staffRoles = [...STAFF_ROLES] as UserRole[];
    const baseWhere: Prisma.UserWhereInput = {
      role: { notIn: staffRoles },
    };
    if (scope.cityIds?.length) {
      baseWhere.preferredCityId = { in: scope.cityIds };
    }
    const [total, newInRange, inactive] = await Promise.all([
      this.prisma.user.count({ where: baseWhere }),
      this.prisma.user.count({
        where: {
          ...baseWhere,
          createdAt: { gte: range.from, lte: range.to },
        },
      }),
      this.prisma.user.count({
        where: { ...baseWhere, isActive: false },
      }),
    ]);
    return {
      total,
      newInRange,
      inactive,
      activeUsers: null as number | null,
      activeUsersDefinition: null as string | null,
      byPreferredCity:
        scope.cityIds?.length === 1
          ? { cityId: scope.cityIds[0], note: 'Counts use preferredCityId only' }
          : undefined,
    };
  }

  async countBusinesses(scope: ReportScope) {
    const where = this.businessRelationFilter(scope);
    const [total, active, pending, blocked] = await Promise.all([
      this.prisma.business.count({ where }),
      this.prisma.business.count({ where: { ...where, status: BusinessStatus.ACTIVE } }),
      this.prisma.business.count({ where: { ...where, status: BusinessStatus.PENDING } }),
      this.prisma.business.count({ where: { ...where, status: BusinessStatus.BLOCKED } }),
    ]);
    return { total, active, pending, blocked };
  }

  async countCities(scope: ReportScope) {
    if (scope.cityIds?.length) {
      const cities = await this.prisma.city.findMany({
        where: { id: { in: scope.cityIds } },
        select: { id: true, slug: true, nameRu: true, launchStatus: true },
      });
      const live = cities.filter((c) => c.launchStatus === CityLaunchStatus.LIVE).length;
      const comingSoon = cities.filter(
        (c) => c.launchStatus === CityLaunchStatus.COMING_SOON,
      ).length;
      return { total: cities.length, live, comingSoon, scoped: true };
    }
    const [total, live, comingSoon] = await Promise.all([
      this.prisma.city.count({ where: { isActive: true } }),
      this.prisma.city.count({
        where: { isActive: true, launchStatus: CityLaunchStatus.LIVE },
      }),
      this.prisma.city.count({
        where: { isActive: true, launchStatus: CityLaunchStatus.COMING_SOON },
      }),
    ]);
    return { total, live, comingSoon, scoped: false };
  }

  async aggregateActivity(scope: ReportScope, range: ReportRange) {
    const sums = await this.prisma.analyticsDailyMetric.aggregate({
      _sum: {
        impressions: true,
        views: true,
        callClicks: true,
        whatsappClicks: true,
        routeClicks: true,
        websiteClicks: true,
        instagramClicks: true,
        favoriteAdds: true,
        searchImpressions: true,
        searchOpens: true,
        reviewsCreated: true,
      },
      where: {
        metricDate: { gte: range.fromMetricDate, lte: range.toMetricDate },
        business: this.businessRelationFilter(scope),
      },
    });
    const s = sums._sum;
    const intentRow = {
      callClicks: s.callClicks ?? 0,
      whatsappClicks: s.whatsappClicks ?? 0,
      routeClicks: s.routeClicks ?? 0,
      websiteClicks: s.websiteClicks ?? 0,
      instagramClicks: s.instagramClicks ?? 0,
      favoriteAdds: s.favoriteAdds ?? 0,
    };
    return {
      businessImpressions: s.impressions ?? 0,
      businessViews: s.views ?? 0,
      intentActions: sumBusinessIntentActionsFromDaily(intentRow),
      byActionType: intentRow,
      searches: s.searchImpressions ?? 0,
      searchOpens: s.searchOpens ?? 0,
      reviewsCreated: s.reviewsCreated ?? 0,
    };
  }

  async commercialSummary(scope: ReportScope) {
    const businessWhere = this.businessRelationFilter(scope);
    const orderWhere: Prisma.OrderWhereInput = {
      business: businessWhere,
    };
    const [activeCampaigns, orders, paidOrders, pendingPayments] = await Promise.all([
      this.prisma.adCampaign.count({
        where: {
          status: AdCampaignStatus.ACTIVE,
          business: businessWhere,
        },
      }),
      this.prisma.order.count({ where: orderWhere }),
      this.prisma.order.count({
        where: { ...orderWhere, status: OrderStatus.PAID },
      }),
      this.prisma.payment.count({
        where: {
          status: PaymentStatus.PENDING,
          order: orderWhere,
        },
      }),
    ]);
    const payingPlans = await this.prisma.business.groupBy({
      by: ['planTier'],
      where: {
        ...businessWhere,
        planTier: { not: 'FREE' },
      },
      _count: { _all: true },
    });
    return {
      activeAdCampaigns: activeCampaigns,
      orders,
      paidOrders,
      pendingPayments,
      businessesByPlan: payingPlans.map((p) => ({
        planTier: p.planTier,
        count: p._count._all,
      })),
    };
  }

  async moderationSummary(scope: ReportScope, range: ReportRange) {
    const cityFilter = scope.cityIds?.length ? { cityId: { in: scope.cityIds } } : {};
    const [openCases, newReports, resolved, appeals] = await Promise.all([
      this.prisma.moderationCase.count({
        where: {
          ...cityFilter,
          status: { in: [ModerationCaseStatus.OPEN, ModerationCaseStatus.IN_REVIEW] },
        },
      }),
      scope.cityIds?.length
        ? this.prisma.contentReport.count({
            where: {
              createdAt: { gte: range.from, lte: range.to },
              caseLinks: { some: { case: { cityId: { in: scope.cityIds } } } },
            },
          })
        : this.prisma.contentReport.count({
            where: { createdAt: { gte: range.from, lte: range.to } },
          }),
      this.prisma.moderationCase.count({
        where: {
          ...cityFilter,
          status: ModerationCaseStatus.RESOLVED,
          updatedAt: { gte: range.from, lte: range.to },
        },
      }),
      this.prisma.moderationAppeal.count({
        where: {
          createdAt: { gte: range.from, lte: range.to },
          case: cityFilter.cityId ? { cityId: cityFilter.cityId } : undefined,
        },
      }),
    ]);
    return { openCases, newReports, resolvedInRange: resolved, appealsInRange: appeals };
  }

  async searchReport(scope: ReportScope, range: ReportRange, limit: number) {
    const rows = await this.prisma.analyticsDailyDimensionMetric.findMany({
      where: {
        dimensionType: AnalyticsDimensionType.SEARCH_QUERY,
        metricDate: { gte: range.fromMetricDate, lte: range.toMetricDate },
        business: this.businessRelationFilter(scope),
      },
      select: { dimensionKey: true, count: true, metricKey: true },
      take: 5000,
    });
    const aggregated = new Map<string, number>();
    for (const row of rows) {
      const key = row.dimensionKey;
      aggregated.set(key, (aggregated.get(key) ?? 0) + row.count);
    }
    const queryRows = [...aggregated.entries()].map(([searchQuery, count]) => ({
      searchQuery,
      count,
    }));
    const result = aggregateSearchQueries(queryRows);
    return {
      ...result,
      topQueries: result.queries.slice(0, limit),
      volume: queryRows.reduce((s, r) => s + r.count, 0),
    };
  }

  async financeReport(scope: ReportScope, range: ReportRange) {
    if (scope.cityIds?.length) {
      // finance by city: business BL presence via scope.businessCityWhere (A.9.4.5C)
    }
    const orderWhere: Prisma.OrderWhereInput = {
      business: this.businessRelationFilter(scope),
      createdAt: { gte: range.from, lte: range.to },
    };
    const paidWhere: Prisma.PaymentWhereInput = {
      status: PaymentStatus.PAID,
      paidAt: { gte: range.from, lte: range.to },
      order: { business: this.businessRelationFilter(scope) },
    };
    const [ordersCount, paidAgg, pendingCount, failedCount, refundedCount] =
      await Promise.all([
        this.prisma.order.count({ where: orderWhere }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          _count: { _all: true },
          where: paidWhere,
        }),
        this.prisma.payment.count({
          where: {
            status: PaymentStatus.PENDING,
            order: { business: this.businessRelationFilter(scope) },
          },
        }),
        this.prisma.payment.count({
          where: {
            status: PaymentStatus.FAILED,
            order: { business: this.businessRelationFilter(scope) },
            createdAt: { gte: range.from, lte: range.to },
          },
        }),
        this.prisma.payment.count({
          where: {
            status: PaymentStatus.REFUNDED,
            order: { business: this.businessRelationFilter(scope) },
            refundedAt: { gte: range.from, lte: range.to },
          },
        }),
      ]);
    const revenueKzt = paidAgg._sum.amount ?? 0;
    const paidCount = paidAgg._count._all;
    return {
      revenueKzt,
      ordersCount,
      paidCount,
      pendingCount,
      failedCount,
      refundedCount,
      averageOrderValueKzt: paidCount > 0 ? Math.round(revenueKzt / paidCount) : null,
      note: 'Revenue from immutable Payment.amount on PAID payments in range',
    };
  }

  async adsReport(scope: ReportScope, range: ReportRange, includeRevenue: boolean) {
    const businessWhere = this.businessRelationFilter(scope);
    const statusGroups = await this.prisma.adCampaign.groupBy({
      by: ['status'],
      where: { business: businessWhere },
      _count: { _all: true },
    });
    const placementRows = await this.prisma.adCampaign.findMany({
      where: {
        business: businessWhere,
        startAt: { lte: range.to },
        endAt: { gte: range.from },
      },
      select: {
        status: true,
        qualifiedImpressions: true,
        clickCount: true,
        campaignPlacements: { select: { placement: { select: { code: true } } } },
      },
      take: 5000,
    });
    const byPlacement = new Map<string, { campaigns: number; impressions: number; clicks: number }>();
    for (const code of CANONICAL_AD_PLACEMENT_CODES) {
      byPlacement.set(code, { campaigns: 0, impressions: 0, clicks: 0 });
    }
    for (const row of placementRows) {
      for (const cp of row.campaignPlacements) {
        const code = cp.placement.code;
        if (!byPlacement.has(code)) {
          byPlacement.set(code, { campaigns: 0, impressions: 0, clicks: 0 });
        }
        const bucket = byPlacement.get(code)!;
        bucket.campaigns += 1;
        bucket.impressions += row.qualifiedImpressions;
        bucket.clicks += row.clickCount;
      }
    }
    const report: Record<string, unknown> = {
      byStatus: statusGroups.map((g) => ({ status: g.status, count: g._count._all })),
      canonicalPlacements: CANONICAL_AD_PLACEMENT_CODES,
      byPlacement: [...byPlacement.entries()].map(([code, v]) => ({
        code,
        ...v,
        ctr: v.impressions > 0 ? v.clicks / v.impressions : null,
      })),
      campaignsInRange: placementRows.length,
    };
    if (includeRevenue) {
      const rev = await this.financeReport(scope, range);
      report.advertisingRevenueKzt = rev.revenueKzt;
    }
    return report;
  }

  async staffOverview() {
    const [total, active, disabled, byRole, recentCritical] = await Promise.all([
      this.prisma.staffAccess.count(),
      this.prisma.staffAccess.count({ where: { isActive: true } }),
      this.prisma.staffAccess.count({ where: { isActive: false } }),
      this.prisma.staffAccess.groupBy({
        by: ['staffRole'],
        _count: { _all: true },
      }),
      this.prisma.auditLog.findMany({
        where: { action: { in: [...CRITICAL_STAFF_AUDIT_ACTIONS] } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          action: true,
          actorUserId: true,
          actorRole: true,
          createdAt: true,
          resourceType: true,
          resourceId: true,
        },
      }),
    ]);
    return {
      total,
      active,
      disabled,
      roleDistribution: byRole.map((r) => ({
        role: r.staffRole,
        count: r._count._all,
      })),
      recentCriticalActions: recentCritical,
      mfa: await this.staffMfa.staffOverviewMfaCounts(),
    };
  }

  async auditReport(
    scope: ReportScope,
    range: ReportRange,
    page: number,
    limit: number,
    filters: {
      actorUserId?: string;
      action?: AuditAction;
      targetType?: string;
      targetId?: string;
    },
  ) {
    const where: Prisma.AuditLogWhereInput = {
      createdAt: { gte: range.from, lte: range.to },
    };
    if (filters.actorUserId) where.actorUserId = filters.actorUserId;
    if (filters.action) where.action = filters.action;
    if (filters.targetId) where.resourceId = filters.targetId;
    if (scope.cityIds?.length) {
      where.cityId = { in: scope.cityIds };
    }
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, limit };
  }
}
