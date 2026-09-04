import { BusinessPlanTier } from '@prisma/client';
import {
  BusinessRankInput,
  compareBusinessCatalogRank,
  compareBusinessTierRank,
  resolveEffectivePlanTier,
} from './business-rank.util';

describe('business-rank.util', () => {
  const basic = (title: string): BusinessRankInput => ({
    planTier: BusinessPlanTier.BASIC,
    planExpiresAt: null,
    isFeatured: false,
    featuredSlot: null,
    title,
  });

  const pro = (title: string): BusinessRankInput => ({
    planTier: BusinessPlanTier.PRO,
    planExpiresAt: new Date(Date.now() + 86400000),
    isFeatured: true,
    featuredSlot: null,
    title,
  });

  const top = (title: string, slot: number): BusinessRankInput => ({
    planTier: BusinessPlanTier.TOP_CITY,
    planExpiresAt: new Date(Date.now() + 86400000),
    isFeatured: true,
    featuredSlot: slot,
    title,
  });

  it('orders TOP before PRO before BASIC', () => {
    const items = [basic('Z'), pro('M'), top('A', 1)];
    items.sort(compareBusinessCatalogRank);
    expect(items.map((i) => i.title)).toEqual(['A', 'M', 'Z']);
  });

  it('orders TOP by featuredSlot ascending', () => {
    const items = [top('B', 2), top('A', 1)];
    items.sort(compareBusinessCatalogRank);
    expect(items.map((i) => i.title)).toEqual(['A', 'B']);
  });

  it('treats expired paid tier as BASIC', () => {
    const expired: BusinessRankInput = {
      planTier: BusinessPlanTier.PRO,
      planExpiresAt: new Date(Date.now() - 86400000),
      isFeatured: true,
      featuredSlot: null,
      title: 'Expired',
    };
    expect(resolveEffectivePlanTier(expired)).toBe(BusinessPlanTier.BASIC);
    expect(compareBusinessTierRank(expired, basic('Free'))).toBe(0);
  });
});
