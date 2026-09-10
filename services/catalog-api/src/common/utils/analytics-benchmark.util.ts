import { BusinessStatus } from '@prisma/client';
import { deltaPercent } from './analytics-capabilities.util';
import {
  periodCtrPercent,
  sumIntentActionsFromDaily,
  viewToIntentConversionPercent,
  type DailyMetricTotals,
} from './analytics-dashboard-metrics.util';
import {
  BENCHMARK_MIN_PEER_BUSINESSES,
  BENCHMARK_MIN_PEERS_FOR_METRIC,
} from './analytics-insights.constants';
import type { PrismaService } from '../../prisma/prisma.service';

export type PeerPeriodTotals = {
  businessId: string;
  views: number;
  impressions: number;
  actions: number;
};

export type CategoryBenchmarkResult =
  | {
      status: 'INSUFFICIENT_DATA';
      categoryTitle: string;
      cohortSize: number;
      message: string;
    }
  | {
      status: 'AVAILABLE';
      categoryTitle: string;
      cohortSize: number;
      businessViews: number;
      categoryAvgViews: number;
      viewsDeltaPercent: number | null;
      businessActions: number;
      categoryAvgActions: number;
      actionsDeltaPercent: number | null;
      businessConversionRate: number | null;
      categoryAvgConversionRate: number | null;
      conversionDeltaPercent: number | null;
      businessCtr: number | null;
      categoryAvgCtr: number | null;
      ctrDeltaPercent: number | null;
    };

function sumFromGroupRow(row: {
  _sum: {
    views: number | null;
    impressions: number | null;
    callClicks: number | null;
    whatsappClicks: number | null;
    routeClicks: number | null;
    websiteClicks: number | null;
    instagramClicks: number | null;
    favoriteAdds: number | null;
  };
}): Omit<PeerPeriodTotals, 'businessId'> {
  const s = row._sum;
  const actions =
    (s.callClicks ?? 0) +
    (s.whatsappClicks ?? 0) +
    (s.routeClicks ?? 0) +
    (s.websiteClicks ?? 0) +
    (s.instagramClicks ?? 0) +
    (s.favoriteAdds ?? 0);
  return {
    views: s.views ?? 0,
    impressions: s.impressions ?? 0,
    actions,
  };
}

function meanConversion(peers: PeerPeriodTotals[]): number | null {
  const rates = peers
    .filter((p) => p.views > 0)
    .map((p) => viewToIntentConversionPercent(p.actions, p.views))
    .filter((r): r is number => r != null);
  if (rates.length < BENCHMARK_MIN_PEERS_FOR_METRIC) return null;
  return Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) / 10;
}

function meanCtr(peers: PeerPeriodTotals[]): number | null {
  const rates = peers
    .filter((p) => p.impressions > 0)
    .map((p) => periodCtrPercent(p.views, p.impressions))
    .filter((r): r is number => r != null);
  if (rates.length < BENCHMARK_MIN_PEERS_FOR_METRIC) return null;
  return Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) / 10;
}

/**
 * Rollup-backed category benchmark: same city + primary category, ACTIVE peers only,
 * subject excluded, same local metricDate range as dashboard period.
 */
export async function buildCategoryBenchmark(params: {
  prisma: PrismaService;
  subjectBusinessId: string;
  categoryId: string;
  cityId: string;
  categoryTitle: string;
  rangeStart: string;
  rangeEnd: string;
  subjectTotals: DailyMetricTotals;
}): Promise<CategoryBenchmarkResult | null> {
  const {
    prisma,
    subjectBusinessId,
    categoryId,
    cityId,
    categoryTitle,
    rangeStart,
    rangeEnd,
    subjectTotals,
  } = params;

  const grouped = await prisma.analyticsDailyMetric.groupBy({
    by: ['businessId'],
    where: {
      metricDate: { gte: rangeStart, lte: rangeEnd },
      business: {
        id: { not: subjectBusinessId },
        categoryId,
        cityId,
        status: BusinessStatus.ACTIVE,
      },
    },
    _sum: {
      views: true,
      impressions: true,
      callClicks: true,
      whatsappClicks: true,
      routeClicks: true,
      websiteClicks: true,
      instagramClicks: true,
      favoriteAdds: true,
    },
  });

  const peers: PeerPeriodTotals[] = grouped.map((row) => ({
    businessId: row.businessId,
    ...sumFromGroupRow(row),
  }));

  const cohortSize = peers.length;
  if (cohortSize < BENCHMARK_MIN_PEER_BUSINESSES) {
    return {
      status: 'INSUFFICIENT_DATA',
      categoryTitle,
      cohortSize,
      message: 'Недостаточно данных для сравнения с категорией (минимум 5 заведений).',
    };
  }

  const businessViews = subjectTotals.views;
  const businessActions = sumIntentActionsFromDaily(subjectTotals);
  const businessConversionRate = viewToIntentConversionPercent(businessActions, businessViews);
  const businessCtr = periodCtrPercent(businessViews, subjectTotals.impressions);

  const viewPeers = peers.filter((p) => p.views > 0);
  const actionPeers = peers.filter((p) => p.actions > 0 || p.views > 0);

  const categoryAvgViews =
    viewPeers.length >= BENCHMARK_MIN_PEERS_FOR_METRIC
      ? Math.round(
          viewPeers.reduce((acc, p) => acc + p.views, 0) / viewPeers.length,
        )
      : null;

  const categoryAvgActions =
    actionPeers.length >= BENCHMARK_MIN_PEERS_FOR_METRIC
      ? Math.round(
          actionPeers.reduce((acc, p) => acc + p.actions, 0) / actionPeers.length,
        )
      : null;

  const categoryAvgConversionRate = meanConversion(peers);
  const categoryAvgCtr = meanCtr(peers);

  if (categoryAvgViews == null && categoryAvgActions == null) {
    return {
      status: 'INSUFFICIENT_DATA',
      categoryTitle,
      cohortSize,
      message: 'Недостаточно сопоставимых метрик по категории.',
    };
  }

  return {
    status: 'AVAILABLE',
    categoryTitle,
    cohortSize,
    businessViews,
    categoryAvgViews: categoryAvgViews ?? 0,
    viewsDeltaPercent:
      categoryAvgViews != null ? deltaPercent(businessViews, categoryAvgViews) : null,
    businessActions,
    categoryAvgActions: categoryAvgActions ?? 0,
    actionsDeltaPercent:
      categoryAvgActions != null ? deltaPercent(businessActions, categoryAvgActions) : null,
    businessConversionRate,
    categoryAvgConversionRate,
    conversionDeltaPercent:
      businessConversionRate != null && categoryAvgConversionRate != null
        ? deltaPercent(businessConversionRate, categoryAvgConversionRate)
        : null,
    businessCtr,
    categoryAvgCtr,
    ctrDeltaPercent:
      businessCtr != null && categoryAvgCtr != null
        ? deltaPercent(businessCtr, categoryAvgCtr)
        : null,
  };
}

/** @internal test helper */
export function aggregatePeerMeansForTest(peers: PeerPeriodTotals[]): {
  categoryAvgViews: number | null;
  categoryAvgConversionRate: number | null;
} {
  const viewPeers = peers.filter((p) => p.views > 0);
  return {
    categoryAvgViews:
      viewPeers.length >= BENCHMARK_MIN_PEERS_FOR_METRIC
        ? Math.round(viewPeers.reduce((a, p) => a + p.views, 0) / viewPeers.length)
        : null,
    categoryAvgConversionRate: meanConversion(peers),
  };
}
