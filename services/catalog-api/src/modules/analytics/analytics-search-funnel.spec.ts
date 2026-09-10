import {
  AnalyticsEventType,
  AnalyticsPlatform,
  BusinessTrafficSource,
} from '@prisma/client';
import { hashVisitorId } from '../../common/utils/analytics-visitor.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsRollupService } from './analytics-rollup.service';

describe('Search funnel attribution (Stage 6.5.1)', () => {
  const visitorId = 'a'.repeat(32);
  const sessionId = 'b'.repeat(32);
  const visitorHash = hashVisitorId(visitorId);

  function buildRollup(events: Array<Record<string, unknown>>) {
    const prisma = {
      analyticsEvent: {
        findMany: jest.fn().mockResolvedValue(events),
      },
      analyticsDailyMetric: { upsert: jest.fn() },
      analyticsDailyDimensionMetric: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<void>) =>
        fn({
          analyticsDailyMetric: { upsert: jest.fn().mockResolvedValue({}) },
          analyticsDailyDimensionMetric: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            createMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        }),
      ),
    };

    return {
      prisma,
      rollup: new AnalyticsRollupService(prisma as unknown as PrismaService),
    };
  }

  it('counts SEARCH_RESULT_IMPRESSION → VIEW_BUSINESS from SEARCH in daily metrics', async () => {
    const ts = new Date('2026-09-10T10:00:00.000Z');
    const events = [
      {
        type: AnalyticsEventType.SEARCH_RESULT_IMPRESSION,
        createdAt: ts,
        trafficSource: BusinessTrafficSource.SEARCH,
        searchQuery: 'coffee shop',
        audienceDistanceBucket: null,
        promotionId: null,
        catalogItemId: null,
        visitorHash,
        visitorType: null,
        sessionId,
        isInternal: false,
      },
      {
        type: AnalyticsEventType.VIEW_BUSINESS,
        createdAt: new Date('2026-09-10T10:01:00.000Z'),
        trafficSource: BusinessTrafficSource.SEARCH,
        searchQuery: 'coffee shop',
        audienceDistanceBucket: null,
        promotionId: null,
        catalogItemId: null,
        visitorHash,
        visitorType: 'NEW',
        sessionId,
        isInternal: false,
      },
    ];

    const { rollup } = buildRollup(events);
    const counts = (rollup as unknown as { aggregateDaily: (e: unknown[]) => Record<string, number> })
      .aggregateDaily(events);

    expect(counts.searchImpressions).toBe(1);
    expect(counts.searchOpens).toBe(1);
    expect(counts.views).toBe(1);
    expect(counts.impressions).toBe(1);
  });

  it('builds SEARCH_QUERY dimension rows for impression and open', () => {
    const ts = new Date('2026-09-10T10:00:00.000Z');
    const events = [
      {
        type: AnalyticsEventType.SEARCH_RESULT_IMPRESSION,
        createdAt: ts,
        trafficSource: BusinessTrafficSource.SEARCH,
        searchQuery: 'coffee shop',
        audienceDistanceBucket: null,
        promotionId: null,
        catalogItemId: null,
        visitorHash,
        visitorType: null,
        sessionId,
        isInternal: false,
      },
      {
        type: AnalyticsEventType.VIEW_BUSINESS,
        createdAt: ts,
        trafficSource: BusinessTrafficSource.SEARCH,
        searchQuery: 'coffee shop',
        audienceDistanceBucket: null,
        promotionId: null,
        catalogItemId: null,
        visitorHash,
        visitorType: 'RETURNING',
        sessionId,
        isInternal: false,
      },
    ];

    const rollup = new AnalyticsRollupService({} as PrismaService);
    const rows = rollup.buildDimensionRows('biz-1', '2026-09-10', events, 'Asia/Oral');
    const searchRows = rows.filter((r) => r.dimensionType === 'SEARCH_QUERY');

    expect(searchRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dimensionKey: 'coffee shop',
          metricKey: 'views',
          count: 2,
        }),
      ]),
    );
  });

  it('does not count VIEW_BUSINESS without SEARCH trafficSource as search open', () => {
    const events = [
      {
        type: AnalyticsEventType.VIEW_BUSINESS,
        createdAt: new Date('2026-09-10T10:00:00.000Z'),
        trafficSource: BusinessTrafficSource.MAP,
        searchQuery: null,
        audienceDistanceBucket: null,
        promotionId: null,
        catalogItemId: null,
        visitorHash,
        visitorType: 'NEW',
        sessionId,
        isInternal: false,
      },
    ];

    const rollup = new AnalyticsRollupService({} as PrismaService);
    const counts = (rollup as unknown as { aggregateDaily: (e: unknown[]) => Record<string, number> })
      .aggregateDaily(events);

    expect(counts.searchOpens).toBe(0);
    expect(counts.views).toBe(1);
  });
});
