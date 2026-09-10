import { ForbiddenException } from '@nestjs/common';
import { BusinessPlanTier } from '@prisma/client';
import {
  enumerateInclusiveLocalMetricDates,
  previousCompletedLocalMonthRange,
  previousCompletedLocalWeekRange,
  previousPeriodRangeFor,
  resolveReportPeriodRange,
} from '../../common/utils/analytics-report-period.util';
import { buildAnalyticsExportCsv, CSV_UTF8_BOM } from './analytics-csv.serializer';
import { buildDeterministicReportSummary } from './analytics-report-summary.util';
import { AnalyticsBusinessReportBuilder } from './analytics-business-report.builder';
import { AnalyticsService } from './analytics.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { getAnalyticsCapabilitiesForPlan } from '../../common/utils/analytics-capabilities.util';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { escapeCsvCell } from '../../common/utils/csv.util';

describe('Stage 6.6F report periods', () => {
  it('weekly = previous completed Mon–Sun (Wed 2026-09-16 → 7–13 Sep)', () => {
    const range = previousCompletedLocalWeekRange('2026-09-16');
    expect(range).toEqual({ start: '2026-09-07', end: '2026-09-13' });
    expect(enumerateInclusiveLocalMetricDates(range.start, range.end)).toHaveLength(7);
  });

  it('monthly = previous completed calendar month', () => {
    const range = previousCompletedLocalMonthRange('2026-09-16');
    expect(range).toEqual({ start: '2026-08-01', end: '2026-08-31' });
  });

  it('Dec→Jan monthly boundary', () => {
    const range = previousCompletedLocalMonthRange('2026-01-10');
    expect(range).toEqual({ start: '2025-12-01', end: '2025-12-31' });
  });

  it('leap-year February month range', () => {
    const range = previousCompletedLocalMonthRange('2024-03-01');
    expect(range).toEqual({ start: '2024-02-01', end: '2024-02-29' });
  });

  it('custom period length matches days', () => {
    const range = resolveReportPeriodRange({
      type: 'CUSTOM',
      timezone: 'Asia/Oral',
      referenceUtc: new Date('2026-09-16T12:00:00.000Z'),
      customDays: 30,
    });
    expect(enumerateInclusiveLocalMetricDates(range.start, range.end)).toHaveLength(30);
  });

  it('previous period for weekly has same length', () => {
    const current = previousCompletedLocalWeekRange('2026-09-16');
    const prev = previousPeriodRangeFor(current);
    expect(enumerateInclusiveLocalMetricDates(prev.start, prev.end)).toHaveLength(7);
  });
});

describe('Stage 6.6F report summary & CSV security', () => {
  it('summary is deterministic and avoids causal wording', () => {
    const summary = buildDeterministicReportSummary({
      overview: { views: 100, actions: 10, conversionRate: 10 },
      comparison: {
        metrics: [
          { key: 'views', current: 100, previous: 80, deltaPercent: 25 },
        ],
      },
    });
    expect(summary.join(' ')).toMatch(/100 раз/);
    expect(summary.join(' ')).not.toMatch(/благодаря|из-за/i);
  });

  it('formula injection on search query cells', () => {
    const csv = buildAnalyticsExportCsv({
      schemaVersion: 1,
      business: { id: 'b1', name: 'Test', cityName: 'U', categoryTitle: null },
      period: {
        type: 'CUSTOM',
        timezone: 'Asia/Oral',
        startDate: '2026-09-01',
        endDate: '2026-09-07',
        days: 7,
        generatedAt: '2026-09-08T00:00:00.000Z',
      },
      previousPeriod: null,
      summary: [],
      dashboard: {
        effectivePlan: 'PREMIUM',
        effectiveRange: { days: 7, from: '', to: '' },
        overview: { views: 1 },
        actions: null,
        conversion: null,
        sources: null,
        searchQueries: [{ query: '=CMD', count: 3, percentage: 100 }],
        audienceGeography: null,
        audience: null,
        popularTimes: null,
        benchmark: null,
        recommendations: null,
        comparison: null,
        promotions: null,
        catalog: null,
        trends: { views: [] },
        capabilities: {
          searchQueries: true,
          trafficSources: false,
          audienceGeography: false,
          popularTimes: false,
          benchmark: false,
          recommendations: false,
          impressions: false,
          ctr: false,
          conversion: false,
          audience: false,
          promotionAnalytics: false,
          catalogAnalytics: false,
          visitorMetrics: false,
        },
      },
    });
    expect(csv).toContain("'=CMD");
  });

  it('UTF-8 BOM exported', () => {
    expect(CSV_UTF8_BOM).toBe('\ufeff');
    expect(escapeCsvCell('Қазақша')).toBe('Қазақша');
  });
});

describe('Stage 6.6F report builder entitlements (service-level)', () => {
  it('FREE export denied at service', async () => {
    const prisma = { business: { findUnique: jest.fn() } };
    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        tier: BusinessPlanTier.FREE,
        effectiveTier: BusinessPlanTier.FREE,
        limits: { maxAnalyticsDays: 30, analyticsTier: 'BASIC' },
      }),
    } as unknown as PlanLimitsService;
    const service = new AnalyticsService(
      prisma as unknown as PrismaService,
      planLimits,
      asBusinessAccessService(createMockBusinessAccess()),
    );
    await expect(
      service.exportCsv(
        { id: 'u', sub: 'u', phone: '+1', role: 'BUSINESS' as never },
        'biz',
        { days: 30 },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('PRO capabilities omit VIP audience in dashboard-driven report', () => {
    const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.PREMIUM);
    expect(caps.audience).toBe(false);
    expect(caps.benchmark).toBe(false);
    expect(caps.reportExport).toBe(true);
  });
});

describe('Stage 6.6F weekly/monthly builder hooks', () => {
  it('exposes buildWeeklyReport and buildMonthlyReport', () => {
    const builder = new AnalyticsBusinessReportBuilder(
      { business: { findUnique: jest.fn() } } as unknown as PrismaService,
      { getBusinessPlanContext: jest.fn() } as unknown as PlanLimitsService,
    );
    expect(typeof builder.buildWeeklyReport).toBe('function');
    expect(typeof builder.buildMonthlyReport).toBe('function');
  });
});
