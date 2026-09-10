import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  clampAnalyticsDays,
  getAnalyticsCapabilitiesForPlan,
} from '../../common/utils/analytics-capabilities.util';
import { DEFAULT_ANALYTICS_TIMEZONE } from '../../common/utils/analytics-timezone.util';
import {
  AnalyticsReportPeriodType,
  enumerateInclusiveLocalMetricDates,
  previousPeriodRangeFor,
  resolveReportPeriodRange,
} from '../../common/utils/analytics-report-period.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsDashboardBuilder } from './analytics-dashboard.builder';
import type { BusinessAnalyticsReport } from './analytics-business-report.types';
import { buildDeterministicReportSummary } from './analytics-report-summary.util';

export type BuildBusinessReportParams = {
  businessId: string;
  type: AnalyticsReportPeriodType;
  /** Used for CUSTOM (clamped by plan). Ignored for WEEKLY/MONTHLY completed periods. */
  requestedDays?: number;
  referenceDate?: Date;
};

@Injectable()
export class AnalyticsBusinessReportBuilder {
  private readonly dashboardBuilder: AnalyticsDashboardBuilder;

  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
  ) {
    this.dashboardBuilder = new AnalyticsDashboardBuilder(prisma, planLimits);
  }

  async buildWeeklyReport(
    businessId: string,
    referenceDate = new Date(),
  ): Promise<BusinessAnalyticsReport> {
    return this.buildBusinessAnalyticsReport({
      businessId,
      type: 'WEEKLY',
      referenceDate,
    });
  }

  async buildMonthlyReport(
    businessId: string,
    referenceDate = new Date(),
  ): Promise<BusinessAnalyticsReport> {
    return this.buildBusinessAnalyticsReport({
      businessId,
      type: 'MONTHLY',
      referenceDate,
    });
  }

  async buildBusinessAnalyticsReport(
    params: BuildBusinessReportParams,
  ): Promise<BusinessAnalyticsReport> {
    const business = await this.prisma.business.findUnique({
      where: { id: params.businessId },
      select: {
        title: true,
        city: { select: { nameRu: true, timezone: true } },
        category: { select: { title: true } },
      },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const ctx = await this.planLimits.getBusinessPlanContext(params.businessId);
    const caps = getAnalyticsCapabilitiesForPlan(ctx.effectiveTier);
    const timezone = business.city.timezone?.trim() || DEFAULT_ANALYTICS_TIMEZONE;

    let periodRange = resolveReportPeriodRange({
      type: params.type,
      timezone,
      referenceUtc: params.referenceDate,
      customDays:
        params.type === 'CUSTOM'
          ? clampAnalyticsDays(params.requestedDays ?? 30, caps)
          : undefined,
    });

    const periodDates = enumerateInclusiveLocalMetricDates(periodRange.start, periodRange.end);
    if (periodDates.length > caps.maxDays) {
      if (params.type === 'CUSTOM') {
        periodRange = resolveReportPeriodRange({
          type: 'CUSTOM',
          timezone,
          referenceUtc: params.referenceDate,
          customDays: caps.maxDays,
        });
      } else {
        throw new BadRequestException('Report period exceeds plan analytics window');
      }
    }

    const days = enumerateInclusiveLocalMetricDates(periodRange.start, periodRange.end).length;

    const dashboard = await this.dashboardBuilder.build(params.businessId, days, {
      localMetricRange: periodRange,
    });

    const previousPeriodRange = previousPeriodRangeFor(periodRange);
    const previousDates = enumerateInclusiveLocalMetricDates(
      previousPeriodRange.start,
      previousPeriodRange.end,
    );

    const overview = dashboard.overview as Record<string, unknown>;
    const summary = buildDeterministicReportSummary({
      overview: overview as Parameters<typeof buildDeterministicReportSummary>[0]['overview'],
      comparison: dashboard.comparison as Parameters<
        typeof buildDeterministicReportSummary
      >[0]['comparison'],
    });

    const generatedAt = new Date().toISOString();

    return {
      schemaVersion: 1,
      business: {
        id: params.businessId,
        name: business.title,
        cityName: business.city.nameRu,
        categoryTitle: business.category?.title ?? null,
      },
      period: {
        type: params.type,
        timezone,
        startDate: periodRange.start,
        endDate: periodRange.end,
        days,
        generatedAt,
      },
      previousPeriod:
        previousDates.length > 0
          ? {
              startDate: previousPeriodRange.start,
              endDate: previousPeriodRange.end,
              days: previousDates.length,
            }
          : null,
      dashboard: dashboard as unknown as Record<string, unknown>,
      summary,
    };
  }
}
