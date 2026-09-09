import { BusinessPlanTier } from '@prisma/client';

/** User-facing plan codes (Stage 6.4). Internal DB enum may differ. */
export type PublicPlanCode = 'FREE' | 'BUSINESS' | 'PRO' | 'VIP';

export interface PlanDisplayMetadata {
  publicCode: PublicPlanCode;
  nameKey: string;
  nameRu: string;
}

const DISPLAY_BY_TIER: Record<BusinessPlanTier, PlanDisplayMetadata> = {
  [BusinessPlanTier.FREE]: {
    publicCode: 'FREE',
    nameKey: 'plan.free',
    nameRu: 'Бесплатный',
  },
  [BusinessPlanTier.BASIC]: {
    publicCode: 'BUSINESS',
    nameKey: 'plan.business',
    nameRu: 'Бизнес',
  },
  [BusinessPlanTier.PREMIUM]: {
    publicCode: 'PRO',
    nameKey: 'plan.pro',
    nameRu: 'PRO',
  },
  [BusinessPlanTier.VIP]: {
    publicCode: 'VIP',
    nameKey: 'plan.vip',
    nameRu: 'VIP',
  },
};

export function getPlanDisplayMetadata(tier: BusinessPlanTier): PlanDisplayMetadata {
  return DISPLAY_BY_TIER[tier];
}

export function publicPlanLabelRu(tier: BusinessPlanTier | string | null | undefined): string {
  if (!tier) return DISPLAY_BY_TIER[BusinessPlanTier.FREE].nameRu;
  const key = tier as BusinessPlanTier;
  return DISPLAY_BY_TIER[key]?.nameRu ?? String(tier);
}

/** Maps legacy/internal tier string to public label (for admin/historical records). */
export function internalTierToPublicLabel(tier?: string | null): string {
  switch (tier) {
    case 'FREE':
      return 'Бесплатный';
    case 'BASIC':
      return 'Бизнес';
    case 'PREMIUM':
      return 'PRO';
    case 'VIP':
      return 'VIP';
    default:
      return tier ?? 'Бесплатный';
  }
}
