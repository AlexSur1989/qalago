import { BusinessPlanTier } from '@prisma/client';
import {
  getAnalyticsCapabilitiesForPlan,
  getAnalyticsLockedSections,
} from './analytics-capabilities.util';

describe('Stage 5F entitlement matrix', () => {
  it('FREE: views only, 30-day window, actions locked', () => {
    const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.FREE);
    expect(caps.maxDays).toBe(30);
    expect(caps.views).toBe(true);
    expect(caps.actions).toBe(false);
    expect(caps.trafficSources).toBe(false);
    const locked = getAnalyticsLockedSections(BusinessPlanTier.FREE);
    expect(locked.some((s) => s.id === 'actions')).toBe(true);
  });

  it('BASIC: views + actions, premium sections locked', () => {
    const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.BASIC);
    expect(caps.maxDays).toBe(30);
    expect(caps.actions).toBe(true);
    expect(caps.trafficSources).toBe(false);
    const locked = getAnalyticsLockedSections(BusinessPlanTier.BASIC);
    expect(locked.map((s) => s.id)).toEqual(
      expect.arrayContaining(['sources', 'conversion']),
    );
    expect(locked.some((s) => s.id === 'comparison')).toBe(false);
  });

  it('PREMIUM: 90-day window with advanced metrics, VIP locked', () => {
    const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.PREMIUM);
    expect(caps.maxDays).toBe(90);
    expect(caps.trafficSources).toBe(true);
    expect(caps.conversion).toBe(true);
    expect(caps.periodComparison).toBe(true);
    expect(caps.popularTimes).toBe(false);
    const locked = getAnalyticsLockedSections(BusinessPlanTier.PREMIUM);
    expect(locked.map((s) => s.id)).toEqual(
      expect.arrayContaining([
        'popularTimes',
        'benchmark',
        'recommendations',
        'audienceGeography',
      ]),
    );
  });

  it('VIP: 365-day window with full advanced analytics', () => {
    const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.VIP);
    expect(caps.maxDays).toBe(365);
    expect(caps.popularTimes).toBe(true);
    expect(caps.benchmark).toBe(true);
    expect(caps.recommendations).toBe(true);
    expect(getAnalyticsLockedSections(BusinessPlanTier.VIP)).toHaveLength(0);
  });

  it('Stage 5J: audience geography VIP-only; search queries PREMIUM+', () => {
    for (const tier of [BusinessPlanTier.FREE, BusinessPlanTier.BASIC]) {
      const caps = getAnalyticsCapabilitiesForPlan(tier);
      expect(caps.searchQueries).toBe(false);
      expect(caps.audienceGeography).toBe(false);
    }
    expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.PREMIUM).searchQueries).toBe(true);
    expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.PREMIUM).audienceGeography).toBe(
      false,
    );
    expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.VIP).searchQueries).toBe(true);
    expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.VIP).audienceGeography).toBe(true);
  });

  it('Stage 6.6B: report export PRO+ with permission', () => {
    expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.VIP).reportExport).toBe(true);
    expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.PREMIUM).reportExport).toBe(true);
    expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.BASIC).reportExport).toBe(false);
    expect(getAnalyticsLockedSections(BusinessPlanTier.BASIC).some((s) => s.id === 'reportExport')).toBe(
      true,
    );
    expect(getAnalyticsLockedSections(BusinessPlanTier.VIP)).toHaveLength(0);
  });
});
