import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AuditAction,
  BusinessPlanTier,
  Prisma,
  PromotionStatus,
  SecurityIncidentStatus,
  UserRole,
} from '@prisma/client';
import { StaffPermission, staffRoleHasPermission } from '@qalago/shared-types';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../app-config/app-config.service';
import { AuditReportQueryDto, ReportFiltersDto, ReportPaginationDto } from './dto/report-query.dto';
import { parseReportRange } from './reporting-range.util';
import {
  DEFAULT_REPORT_PAGE_LIMIT,
  SECURITY_AUDIT_ACTIONS,
  STAFF_ANOMALY_ACTION_THRESHOLD,
  STAFF_ANOMALY_WINDOW_HOURS,
} from './reporting.constants';
import { ReportingQueryService } from './reporting-query.service';
import { ReportingScopeService } from './reporting-scope.service';

@Injectable()
export class AdminReportingService {
  constructor(
    private readonly scope: ReportingScopeService,
    private readonly queries: ReportingQueryService,
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
  ) {}

  private range(filters: ReportFiltersDto) {
    return parseReportRange(filters.from, filters.to);
  }

  async getOverview(user: AuthUser, filters: ReportFiltersDto) {
    const reportScope = await this.scope.resolveScope(user, filters);
    const range = this.range(filters);
    const role = user.role as UserRole;

    const platform: Record<string, unknown> = {};
    if (staffRoleHasPermission(role, StaffPermission.REPORT_OVERVIEW_VIEW)) {
      const [users, businesses, cities] = await Promise.all([
        this.queries.countUsers(reportScope, range),
        this.queries.countBusinesses(reportScope),
        this.queries.countCities(reportScope),
      ]);
      platform.users = users;
      platform.businesses = businesses;
      platform.cities = cities;
    }

    let activity: Record<string, unknown> | undefined;
    if (staffRoleHasPermission(role, StaffPermission.REPORT_ACTIVITY_VIEW)) {
      activity = await this.queries.aggregateActivity(reportScope, range);
    }

    let commercial: Record<string, unknown> | undefined;
    if (
      staffRoleHasPermission(role, StaffPermission.REPORT_ADS_VIEW) ||
      staffRoleHasPermission(role, StaffPermission.REPORT_PLANS_VIEW)
    ) {
      commercial = await this.queries.commercialSummary(reportScope);
      if (staffRoleHasPermission(role, StaffPermission.REPORT_FINANCE_VIEW)) {
        const fin = await this.queries.financeReport(reportScope, range);
        commercial = { ...commercial, revenueKzt: fin.revenueKzt, pendingPayments: fin.pendingCount };
      }
    }

    let moderation: Record<string, unknown> | undefined;
    if (staffRoleHasPermission(role, StaffPermission.REPORT_MODERATION_VIEW)) {
      moderation = await this.queries.moderationSummary(reportScope, range);
    }

    let staff: Record<string, unknown> | undefined;
    if (staffRoleHasPermission(role, StaffPermission.REPORT_STAFF_VIEW)) {
      staff = await this.queries.staffOverview();
    }

    let security: Record<string, unknown> | undefined;
    if (staffRoleHasPermission(role, StaffPermission.REPORT_SECURITY_VIEW)) {
      security = await this.buildSecuritySummary(range);
    }

    let system: Record<string, unknown> | undefined;
    if (staffRoleHasPermission(role, StaffPermission.REPORT_TECH_VIEW)) {
      system = await this.buildSystemSummary();
    }

    return {
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      scope: { cityIds: reportScope.cityIds },
      platform,
      activity,
      commercial,
      moderation,
      staff,
      security,
      system,
    };
  }

  async getUsers(user: AuthUser, filters: ReportFiltersDto) {
    const reportScope = await this.scope.resolveScope(user, filters);
    const range = this.range(filters);
    return {
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      scope: { cityIds: reportScope.cityIds },
      metrics: await this.queries.countUsers(reportScope, range),
    };
  }

  async getBusinesses(user: AuthUser, filters: ReportFiltersDto, page = 1, limit = DEFAULT_REPORT_PAGE_LIMIT) {
    const reportScope = await this.scope.resolveScope(user, filters);
    const range = this.range(filters);
    const where = this.scope.businessCityWhere(reportScope);
    const [summary, byCity, byCategory, recent] = await Promise.all([
      this.queries.countBusinesses(reportScope),
      this.prisma.business.groupBy({
        by: ['cityId'],
        where,
        _count: { _all: true },
        orderBy: { _count: { cityId: 'desc' } },
        take: 50,
      }),
      this.prisma.business.groupBy({
        by: ['categoryId'],
        where,
        _count: { _all: true },
        orderBy: { _count: { categoryId: 'desc' } },
        take: 50,
      }),
      this.prisma.business.findMany({
        where: {
          ...where,
          createdAt: { gte: range.from, lte: range.to },
        },
        select: { id: true, title: true, status: true, cityId: true, planTier: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    const withOwner = await this.prisma.business.count({
      where: { ...where, ownerId: { not: null } },
    });
    return {
      summary: { ...summary, withOwnerAssigned: withOwner },
      byCity,
      byCategory,
      newBusinesses: { page, limit, items: recent },
      planDistribution: await this.prisma.business.groupBy({
        by: ['planTier'],
        where,
        _count: { _all: true },
      }),
    };
  }

  async getCities(user: AuthUser, filters: ReportFiltersDto) {
    const reportScope = await this.scope.resolveScope(user, filters);
    const range = this.range(filters);
    const cityWhere: Prisma.CityWhereInput = reportScope.cityIds?.length
      ? { id: { in: reportScope.cityIds } }
      : { isActive: true };
    const cities = await this.prisma.city.findMany({
      where: cityWhere,
      select: {
        id: true,
        slug: true,
        nameRu: true,
        launchStatus: true,
        timezone: true,
      },
    });
    const rows = await Promise.all(
      cities.map(async (city) => {
        const scope = { cityIds: [city.id], businessId: undefined };
        const [businesses, activity] = await Promise.all([
          this.queries.countBusinesses(scope),
          this.queries.aggregateActivity(scope, range),
        ]);
        const row: Record<string, unknown> = {
          city,
          businesses,
          activity,
        };
        if (staffRoleHasPermission(user.role as UserRole, StaffPermission.REPORT_FINANCE_VIEW)) {
          row.finance = await this.queries.financeReport(scope, range);
        }
        return row;
      }),
    );
    return { cities: rows };
  }

  async getCategories(user: AuthUser, filters: ReportFiltersDto) {
    const reportScope = await this.scope.resolveScope(user, filters);
    const where = this.scope.businessCityWhere(reportScope);
    const byCategory = await this.prisma.business.groupBy({
      by: ['categoryId'],
      where,
      _count: { _all: true },
    });
    return {
      businessesByCategory: byCategory,
      subcategoryBreakdown: null,
      subcategoryNote: 'Subcategory attribution requires per-business subcategoryId rollup — omitted in 6.9.2',
    };
  }

  async getSearch(user: AuthUser, filters: ReportFiltersDto, limit = 10) {
    const reportScope = await this.scope.resolveScope(user, filters);
    const range = this.range(filters);
    return this.queries.searchReport(reportScope, range, limit);
  }

  async getActivity(user: AuthUser, filters: ReportFiltersDto) {
    const reportScope = await this.scope.resolveScope(user, filters);
    const range = this.range(filters);
    return {
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      metrics: await this.queries.aggregateActivity(reportScope, range),
    };
  }

  async getReviews(user: AuthUser, filters: ReportFiltersDto) {
    const reportScope = await this.scope.resolveScope(user, filters);
    const range = this.range(filters);
    const businessWhere = this.scope.businessCityWhere(reportScope);
    const [created, hidden, avgRating] = await Promise.all([
      this.prisma.review.count({
        where: {
          business: businessWhere,
          createdAt: { gte: range.from, lte: range.to },
        },
      }),
      this.prisma.review.count({
        where: { business: businessWhere, moderationHidden: true },
      }),
      this.prisma.review.aggregate({
        where: {
          business: businessWhere,
          createdAt: { gte: range.from, lte: range.to },
          moderationHidden: false,
        },
        _avg: { rating: true },
      }),
    ]);
    return {
      reviewsCreated: created,
      hiddenReviews: hidden,
      averageRating: avgRating._avg.rating,
    };
  }

  async getPromotions(user: AuthUser, filters: ReportFiltersDto) {
    const reportScope = await this.scope.resolveScope(user, filters);
    const range = this.range(filters);
    const businessWhere = this.scope.businessCityWhere(reportScope);
    const now = new Date();
    const [active, created, expired, hidden] = await Promise.all([
      this.prisma.promotion.count({
        where: { business: businessWhere, status: PromotionStatus.ACTIVE },
      }),
      this.prisma.promotion.count({
        where: {
          business: businessWhere,
          createdAt: { gte: range.from, lte: range.to },
        },
      }),
      this.prisma.promotion.count({
        where: { business: businessWhere, status: PromotionStatus.EXPIRED },
      }),
      this.prisma.promotion.count({
        where: { business: businessWhere, moderationHidden: true },
      }),
    ]);
    return { active, createdInRange: created, expired, moderationHidden: hidden };
  }

  async getAds(user: AuthUser, filters: ReportFiltersDto) {
    const reportScope = await this.scope.resolveScope(user, filters);
    const range = this.range(filters);
    const includeRevenue =
      user.role === UserRole.SUPER_ADMIN ||
      staffRoleHasPermission(user.role as UserRole, StaffPermission.REPORT_FINANCE_VIEW);
    return this.queries.adsReport(reportScope, range, includeRevenue);
  }

  async getPlans(user: AuthUser, filters: ReportFiltersDto) {
    const reportScope = await this.scope.resolveScope(user, filters);
    const where = this.scope.businessCityWhere(reportScope);
    const distribution = await this.prisma.business.groupBy({
      by: ['planTier'],
      where,
      _count: { _all: true },
    });
    const paying = distribution
      .filter((d) => d.planTier !== BusinessPlanTier.FREE)
      .reduce((s, d) => s + d._count._all, 0);
    const total = distribution.reduce((s, d) => s + d._count._all, 0);
    return {
      planTiers: ['FREE', 'BASIC', 'PREMIUM', 'VIP'],
      planTierNote: 'Product names FREE/BUSINESS/PRO/VIP map to FREE/BASIC/PREMIUM/VIP in schema',
      distribution,
      payingBusinessShare: total > 0 ? paying / total : null,
      churn: null,
      churnDefinition: null,
    };
  }

  async getFinance(user: AuthUser, filters: ReportFiltersDto) {
    const reportScope = await this.scope.resolveScope(user, filters);
    const range = this.range(filters);
    return this.queries.financeReport(reportScope, range);
  }

  async getModeration(user: AuthUser, filters: ReportFiltersDto) {
    const reportScope = await this.scope.resolveScope(user, filters);
    const range = this.range(filters);
    const cityFilter = reportScope.cityIds?.length ? { cityId: { in: reportScope.cityIds } } : {};
    const byStatus = await this.prisma.moderationCase.groupBy({
      by: ['status'],
      where: cityFilter,
      _count: { _all: true },
    });
    return {
      ...(await this.queries.moderationSummary(reportScope, range)),
      byStatus,
      moderatorLeaderboard: null,
      moderatorLeaderboardNote: 'Intentionally omitted — staff monitoring is not gamified',
    };
  }

  async getStaff(user: AuthUser) {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Staff oversight is SUPER_ADMIN only');
    }
    return this.queries.staffOverview();
  }

  async getStaffMember(user: AuthUser, targetUserId: string) {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Staff oversight is SUPER_ADMIN only');
    }
    const row = await this.prisma.staffAccess.findUnique({
      where: { userId: targetUserId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!row) {
      throw new NotFoundException('Staff member not found');
    }
    const scopes = await this.prisma.staffCityScope.findMany({
      where: { userId: targetUserId },
      include: { city: { select: { id: true, slug: true, nameRu: true } } },
    });
    const sessions = await this.prisma.authSession.count({
      where: {
        userId: targetUserId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    const auditTimeline = await this.prisma.auditLog.findMany({
      where: { actorUserId: targetUserId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      staff: {
        ...row,
        mfaStatus: 'NOT_IMPLEMENTED' as const,
        cityScopes: scopes.map((s) => s.city),
        activeSessions: sessions,
      },
      auditTimeline,
    };
  }

  async getStaffAnomalies(user: AuthUser) {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Staff anomaly signals are SUPER_ADMIN only');
    }
    const since = new Date(Date.now() - STAFF_ANOMALY_WINDOW_HOURS * 60 * 60 * 1000);
    const signals: { code: string; message: string; requiresReview: boolean; data?: unknown }[] =
      [];

    const actionCounts = await this.prisma.auditLog.groupBy({
      by: ['actorUserId', 'action'],
      where: {
        createdAt: { gte: since },
        actorUserId: { not: null },
        action: {
          in: [
            AuditAction.MODERATION_ACTION_APPLY,
            AuditAction.PAYMENT_CONFIRM,
            AuditAction.STAFF_ROLE_CHANGED,
          ],
        },
      },
      _count: { _all: true },
    });
    for (const row of actionCounts) {
      if (row._count._all >= STAFF_ANOMALY_ACTION_THRESHOLD) {
        signals.push({
          code: 'HIGH_ACTION_VOLUME',
          message: 'Unusually high number of privileged actions in short window — requires review',
          requiresReview: true,
          data: { actorUserId: row.actorUserId, action: row.action, count: row._count._all },
        });
      }
    }

    return { windowHours: STAFF_ANOMALY_WINDOW_HOURS, signals };
  }

  async getAudit(user: AuthUser, query: AuditReportQueryDto) {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Audit report is SUPER_ADMIN only');
    }
    const reportScope = await this.scope.resolveScope(user, query);
    const range = this.range(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_REPORT_PAGE_LIMIT;
    return this.queries.auditReport(reportScope, range, page, limit, {
      actorUserId: query.actorUserId,
      action: query.action as AuditAction | undefined,
      targetId: query.targetId,
    });
  }

  async getSecurity(user: AuthUser, filters: ReportFiltersDto) {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Security report is SUPER_ADMIN only');
    }
    const range = this.range(filters);
    return this.buildSecuritySummary(range);
  }

  async getSystem(user: AuthUser) {
    return this.buildSystemSummary();
  }

  private async buildSecuritySummary(range: ReturnType<typeof parseReportRange>) {
    const [openIncidents, govOpen, dataOpen, recentAudit] = await Promise.all([
      this.prisma.securityIncident.count({
        where: { status: { not: SecurityIncidentStatus.RESOLVED } },
      }),
      this.prisma.governmentRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.dataRightsRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.auditLog.findMany({
        where: {
          action: { in: [...SECURITY_AUDIT_ACTIONS] },
          createdAt: { gte: range.from, lte: range.to },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          action: true,
          actorUserId: true,
          createdAt: true,
          resourceType: true,
        },
      }),
    ]);
    return {
      openSecurityIncidents: openIncidents,
      governmentRequestsByStatus: govOpen,
      dataRightsRequestsByStatus: dataOpen,
      recentSecurityAudit: recentAudit,
      sensitiveContentNote: 'Request bodies remain on protected legal/security endpoints',
    };
  }

  private async buildSystemSummary() {
    const maintenance = await this.appConfig.isMaintenanceActive();
    const settings = await this.prisma.appReleaseSettings.findUnique({
      where: { id: 'global' },
    });
    const flagCount = await this.prisma.featureFlagDefinition.count();
    const enabledFlags = await this.prisma.featureFlagDefinition.count({
      where: { globalEnabled: true },
    });
    let dbHealth: 'ok' | 'error' = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbHealth = 'error';
    }
    return {
      apiVersion: 'v1',
      service: 'catalog-api',
      maintenanceMode: maintenance,
      release: settings
        ? {
            androidMinimumVersion: settings.androidMinimumVersion,
            androidLatestVersion: settings.androidLatestVersion,
            iosMinimumVersion: settings.iosMinimumVersion,
            iosLatestVersion: settings.iosLatestVersion,
            maintenanceEnabled: settings.maintenanceEnabled,
            configRevision: settings.configRevision,
          }
        : null,
      featureFlags: { total: flagCount, globallyEnabled: enabledFlags },
      dbConnectivity: dbHealth,
      redisHealth: null,
      queueHealth: null,
      secretsNote: 'No environment secrets exposed',
    };
  }
}
