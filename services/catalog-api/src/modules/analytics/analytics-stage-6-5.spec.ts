import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AnalyticsEventType,
  AnalyticsPlatform,
  BusinessTrafficSource,
} from '@prisma/client';
import { toLocalHourAndWeekday, toLocalMetricDate } from '../../common/utils/analytics-timezone.util';
import { hashVisitorId, isValidClientEventId } from '../../common/utils/analytics-visitor.util';
import { normalizeSearchQueryForAnalytics } from '../../common/utils/search-query-analytics.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsRollupService } from './analytics-rollup.service';
import { AnalyticsService } from './analytics.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';

describe('Stage 6.5 analytics foundation', () => {
  function createService() {
    const prisma = {
      business: { findFirst: jest.fn(), findUnique: jest.fn() },
      city: { findFirst: jest.fn() },
      promotion: { findFirst: jest.fn() },
      serviceItem: { findFirst: jest.fn() },
      analyticsEvent: {
        create: jest.fn(),
        findUnique: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
      analyticsDailyMetric: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        effectiveTier: 'PREMIUM',
        limits: { maxAnalyticsDays: 365, analyticsTier: 'FULL' },
      }),
      getAnalyticsCapabilities: jest.fn(),
    } as unknown as PlanLimitsService;

    const businessAccess = createMockBusinessAccess();

    return {
      prisma,
      service: new AnalyticsService(
        prisma as unknown as PrismaService,
        planLimits,
        asBusinessAccessService(businessAccess),
      ),
    };
  }

  it('deduplicates by clientEventId', async () => {
    const { prisma, service } = createService();
    prisma.analyticsEvent.findUnique.mockResolvedValue({ id: 'existing' });

    const result = await service.track({
      businessId: 'biz-1',
      type: AnalyticsEventType.CALL_CLICK,
      clientEventId: 'evt-dup-12345678',
    });

    expect(result).toEqual({ success: true, deduplicated: true });
    expect(prisma.analyticsEvent.create).not.toHaveBeenCalled();
  });

  it('rejects ad event types on organic endpoint', async () => {
    const { service } = createService();

    await expect(
      service.track({
        businessId: 'biz-1',
        type: AnalyticsEventType.AD_IMPRESSION,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('stores promotionId for PROMOTION_VIEW', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'biz-1', cityId: 'city-1' });
    prisma.promotion.findFirst.mockResolvedValue({ id: 'promo-1' });
    prisma.analyticsEvent.findUnique.mockResolvedValue(null);
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'e1' });

    await service.track({
      businessId: 'biz-1',
      type: AnalyticsEventType.PROMOTION_VIEW,
      promotionId: 'promo-1',
      visitorId: 'a'.repeat(32),
      sessionId: 'b'.repeat(32),
      platform: AnalyticsPlatform.ANDROID,
    });

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: AnalyticsEventType.PROMOTION_VIEW,
          visitorHash: hashVisitorId('a'.repeat(32)),
        }),
      }),
    );
  });

  it('requires cityId for SEARCH_PERFORMED', async () => {
    const { service } = createService();

    await expect(
      service.track({
        type: AnalyticsEventType.SEARCH_PERFORMED,
        searchQuery: 'coffee',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normalizes search query and rejects attribution on actions', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'biz-1', cityId: 'city-1' });
    prisma.analyticsEvent.findUnique.mockResolvedValue(null);
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'e1' });

    await expect(
      service.track({
        businessId: 'biz-1',
        type: AnalyticsEventType.CALL_CLICK,
        trafficSource: BusinessTrafficSource.SEARCH,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(normalizeSearchQueryForAnalytics('  Coffee   Shop ')).toBe('coffee shop');
  });

  it('marks internal traffic from header', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'biz-1', cityId: 'city-1' });
    prisma.analyticsEvent.findUnique.mockResolvedValue(null);
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'e1' });

    await service.track(
      { businessId: 'biz-1', type: AnalyticsEventType.VIEW_BUSINESS },
      { internalHeader: true },
    );

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isInternal: true }),
      }),
    );
  });

  it('validates clientEventId length', () => {
    expect(isValidClientEventId('short')).toBe(false);
    expect(isValidClientEventId('valid-client-event-id-123456')).toBe(true);
  });

  it('aggregates local metric date in city timezone', () => {
    const utc = new Date('2026-09-09T20:00:00.000Z');
    expect(toLocalMetricDate(utc, 'Asia/Oral')).toBe('2026-09-10');
    const { hour } = toLocalHourAndWeekday(utc, 'Asia/Oral');
    expect(hour).toBeGreaterThanOrEqual(0);
    expect(hour).toBeLessThanOrEqual(23);
  });

  it('rollup is idempotent per business/date', async () => {
    const prisma = {
      analyticsEvent: {
        findMany: jest.fn().mockResolvedValue([
          {
            type: AnalyticsEventType.VIEW_BUSINESS,
            createdAt: new Date('2026-09-10T10:00:00.000Z'),
            trafficSource: 'HOME',
            searchQuery: null,
            audienceDistanceBucket: null,
            promotionId: null,
            catalogItemId: null,
            visitorHash: hashVisitorId('visitor-1'),
            sessionId: 'session-1',
            isInternal: false,
          },
          {
            type: AnalyticsEventType.BUSINESS_IMPRESSION,
            createdAt: new Date('2026-09-10T11:00:00.000Z'),
            trafficSource: 'HOME',
            searchQuery: null,
            audienceDistanceBucket: null,
            promotionId: null,
            catalogItemId: null,
            visitorHash: null,
            sessionId: null,
            isInternal: false,
          },
        ]),
      },
      analyticsDailyMetric: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      analyticsDailyDimensionMetric: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<void>) =>
        fn({
          analyticsDailyMetric: {
            upsert: jest.fn().mockResolvedValue({}),
          },
          analyticsDailyDimensionMetric: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        }),
      ),
    };

    const rollup = new AnalyticsRollupService(prisma as unknown as PrismaService);
    await rollup.rollupBusinessDate('biz-1', '2026-09-10', 'Asia/Oral');
    await rollup.rollupBusinessDate('biz-1', '2026-09-10', 'Asia/Oral');

    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });
});
