import { BusinessPlanTier } from '@prisma/client';

export type BusinessRankInput = {
  planTier: BusinessPlanTier;
  planExpiresAt: Date | null;
  isFeatured: boolean;
  featuredSlot: number | null;
  title?: string;
};

/** Resolves expired paid plans to FREE for display/enforcement only — not for ranking. */
export function resolveEffectivePlanTier(business: {
  planTier: BusinessPlanTier;
  planExpiresAt: Date | null;
}): BusinessPlanTier {
  if (business.planTier === BusinessPlanTier.FREE) {
    return BusinessPlanTier.FREE;
  }
  if (business.planExpiresAt && business.planExpiresAt < new Date()) {
    return BusinessPlanTier.FREE;
  }
  return business.planTier;
}

/** Subscription and legacy featured fields do not affect organic ranking (Stage 4C). */
export function compareBusinessTierRank(_a: BusinessRankInput, _b: BusinessRankInput): number {
  return 0;
}

/** Organic catalog order: title only. Paid visibility via AdCampaign. */
export function compareBusinessCatalogRank(
  a: BusinessRankInput,
  b: BusinessRankInput,
): number {
  return (a.title ?? '').localeCompare(b.title ?? '', 'ru');
}
