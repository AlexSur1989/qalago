import { BusinessPlanTier } from '@prisma/client';
import {
  getAnalyticsCapabilitiesForPlan,
  getAnalyticsLockedSections,
} from './analytics-capabilities.util';

describe('analytics-capabilities.util', () => {
  it('FREE exposes views and 30-day window without actions', () => {
    const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.FREE);
    expect(caps.maxDays).toBe(30);
    expect(caps.views).toBe(true);
    expect(caps.viewTrend).toBe(true);
    expect(caps.actions).toBe(false);
    expect(caps.actionTrend).toBe(false);
  });

  it('BASIC unlocks customer actions', () => {
    const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.BASIC);
    expect(caps.actions).toBe(true);
    expect(caps.actionTrend).toBe(true);
    expect(caps.trafficSources).toBe(false);
  });

  it('PREMIUM unlocks sources, conversion and comparison', () => {
    const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.PREMIUM);
    expect(caps.maxDays).toBe(90);
    expect(caps.trafficSources).toBe(true);
    expect(caps.conversion).toBe(true);
    expect(caps.periodComparison).toBe(true);
    expect(caps.popularTimes).toBe(false);
  });

  it('VIP unlocks advanced insights', () => {
    const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.VIP);
    expect(caps.maxDays).toBe(365);
    expect(caps.popularTimes).toBe(true);
    expect(caps.benchmark).toBe(true);
    expect(caps.recommendations).toBe(true);
  });

  it('FREE locks actions with BASIC upgrade message', () => {
    const locked = getAnalyticsLockedSections(BusinessPlanTier.FREE);
    expect(locked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'actions',
          message: 'Доступно с BASIC',
        }),
      ]),
    );
  });

  it('BASIC locks premium analytics sections', () => {
    const locked = getAnalyticsLockedSections(BusinessPlanTier.BASIC);
    expect(locked.map((item) => item.id)).toEqual(
      expect.arrayContaining(['sources', 'conversion', 'comparison']),
    );
  });
});
