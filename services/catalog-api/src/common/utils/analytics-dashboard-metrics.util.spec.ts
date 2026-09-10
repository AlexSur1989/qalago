import {
  periodCtrPercent,
  sumDailyMetricRows,
  sumIntentActionsFromDaily,
  viewToIntentConversionPercent,
} from './analytics-dashboard-metrics.util';

describe('analytics-dashboard-metrics.util', () => {
  it('sums daily rollup rows', () => {
    const totals = sumDailyMetricRows([
      {
        metricDate: '2026-01-01',
        impressions: 10,
        views: 4,
        callClicks: 1,
        whatsappClicks: 0,
        routeClicks: 0,
        websiteClicks: 0,
        instagramClicks: 0,
        favoriteAdds: 0,
        promotionImpressions: 0,
        promotionViews: 2,
        promotionActions: 0,
        catalogImpressions: 0,
        catalogViews: 0,
        catalogActions: 0,
        uniqueVisitorsApprox: 3,
        sessionsApprox: 2,
      },
      {
        metricDate: '2026-01-02',
        impressions: 5,
        views: 2,
        callClicks: 0,
        whatsappClicks: 1,
        routeClicks: 0,
        websiteClicks: 0,
        instagramClicks: 0,
        favoriteAdds: 0,
        promotionImpressions: 0,
        promotionViews: 0,
        promotionActions: 0,
        catalogImpressions: 0,
        catalogViews: 0,
        catalogActions: 0,
        uniqueVisitorsApprox: 2,
        sessionsApprox: 1,
      },
    ]);
    expect(totals.impressions).toBe(15);
    expect(totals.views).toBe(6);
    expect(sumIntentActionsFromDaily(totals)).toBe(4);
    expect(totals.uniqueVisitorsApprox).toBe(5);
  });

  it('computes aggregate CTR', () => {
    expect(periodCtrPercent(25, 100)).toBe(25);
    expect(periodCtrPercent(1, 3)).toBe(33.3);
    expect(periodCtrPercent(10, 0)).toBeNull();
  });

  it('computes view-to-intent conversion', () => {
    expect(viewToIntentConversionPercent(5, 20)).toBe(25);
    expect(viewToIntentConversionPercent(0, 0)).toBeNull();
  });
});
