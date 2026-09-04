import { BusinessPlanTier } from '@prisma/client';

export type BusinessRankInput = {
  planTier: BusinessPlanTier;
  planExpiresAt: Date | null;
  isFeatured: boolean;
  featuredSlot: number | null;
  title?: string;
};

const TIER_PRIORITY: Record<BusinessPlanTier, number> = {
  [BusinessPlanTier.BASIC]: 0,
  [BusinessPlanTier.PRO]: 1,
  [BusinessPlanTier.TOP_CITY]: 2,
};

export function resolveEffectivePlanTier(business: {
  planTier: BusinessPlanTier;
  planExpiresAt: Date | null;
}): BusinessPlanTier {
  if (business.planTier === BusinessPlanTier.BASIC) {
    return BusinessPlanTier.BASIC;
  }
  if (business.planExpiresAt && business.planExpiresAt < new Date()) {
    return BusinessPlanTier.BASIC;
  }
  return business.planTier;
}

function effectiveFeatured(business: BusinessRankInput): boolean {
  const tier = resolveEffectivePlanTier(business);
  return tier !== BusinessPlanTier.BASIC && business.isFeatured;
}

function effectiveFeaturedSlot(business: BusinessRankInput): number | null {
  const tier = resolveEffectivePlanTier(business);
  if (tier !== BusinessPlanTier.TOP_CITY) {
    return null;
  }
  return business.featuredSlot;
}

/** Tier + slot + featured only (no title tie-breaker). */
export function compareBusinessTierRank(
  a: BusinessRankInput,
  b: BusinessRankInput,
): number {
  const tierA = resolveEffectivePlanTier(a);
  const tierB = resolveEffectivePlanTier(b);
  const priorityDiff = TIER_PRIORITY[tierB] - TIER_PRIORITY[tierA];
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  const slotA = effectiveFeaturedSlot(a) ?? 999;
  const slotB = effectiveFeaturedSlot(b) ?? 999;
  if (slotA !== slotB) {
    return slotA - slotB;
  }

  const featuredA = effectiveFeatured(a);
  const featuredB = effectiveFeatured(b);
  if (featuredA !== featuredB) {
    return featuredA ? -1 : 1;
  }

  return 0;
}

/** Negative = a before b. Order: TOP → PRO → BASIC, then featuredSlot asc, then VIP, then title. */
export function compareBusinessCatalogRank(
  a: BusinessRankInput,
  b: BusinessRankInput,
): number {
  const tierDiff = compareBusinessTierRank(a, b);
  if (tierDiff !== 0) {
    return tierDiff;
  }

  return (a.title ?? '').localeCompare(b.title ?? '', 'ru');
}
