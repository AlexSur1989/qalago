import { BusinessPlanTier } from '@prisma/client';
import {
  BusinessRankInput,
  compareBusinessCatalogRank,
  compareBusinessTierRank,
  resolveEffectivePlanTier,
} from './business-rank.util';

describe('business-rank.util', () => {
  const free = (title: string): BusinessRankInput => ({
    planTier: BusinessPlanTier.FREE,
    planExpiresAt: null,
    isFeatured: false,
    featuredSlot: null,
    title,
  });

  const premium = (title: string): BusinessRankInput => ({
    planTier: BusinessPlanTier.PREMIUM,
    planExpiresAt: new Date(Date.now() + 86400000),
    isFeatured: true,
    featuredSlot: 1,
    title,
  });

  const vip = (title: string, slot: number): BusinessRankInput => ({
    planTier: BusinessPlanTier.VIP,
    planExpiresAt: new Date(Date.now() + 86400000),
    isFeatured: true,
    featuredSlot: slot,
    title,
  });

  it('orders catalog by title only (plan-neutral)', () => {
    const items = [free('Z Cafe'), premium('M Cafe'), vip('A Cafe', 1)];
    items.sort(compareBusinessCatalogRank);
    expect(items.map((i) => i.title)).toEqual(['A Cafe', 'M Cafe', 'Z Cafe']);
  });

  it('ignores featuredSlot for catalog rank', () => {
    const items = [vip('B', 2), vip('A', 1)];
    items.sort(compareBusinessCatalogRank);
    expect(items.map((i) => i.title)).toEqual(['A', 'B']);
  });

  it('treats expired paid tier as FREE', () => {
    const expired: BusinessRankInput = {
      planTier: BusinessPlanTier.PREMIUM,
      planExpiresAt: new Date(Date.now() - 86400000),
      isFeatured: true,
      featuredSlot: null,
      title: 'Expired',
    };
    expect(resolveEffectivePlanTier(expired)).toBe(BusinessPlanTier.FREE);
    expect(compareBusinessTierRank(expired, free('Free'))).toBe(0);
  });
});
