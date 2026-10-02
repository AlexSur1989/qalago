import { BusinessPlanTier } from '@prisma/client';

const TIER_RANK: Record<BusinessPlanTier, number> = {
  [BusinessPlanTier.FREE]: 0,
  [BusinessPlanTier.BASIC]: 1,
  [BusinessPlanTier.PREMIUM]: 2,
  [BusinessPlanTier.VIP]: 3,
};

export function planTierRank(tier: BusinessPlanTier): number {
  return TIER_RANK[tier] ?? 0;
}

export function isHigherPlanTier(a: BusinessPlanTier, b: BusinessPlanTier): boolean {
  return planTierRank(a) > planTierRank(b);
}
