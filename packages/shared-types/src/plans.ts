export enum BusinessPlanTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP',
}

/** User-facing plan code (Stage 6.4). Internal DB enum may differ. */
export type PublicPlanCode = 'FREE' | 'BUSINESS' | 'PRO' | 'VIP';

export type AnalyticsTier = 'BASIC' | 'EXTENDED' | 'FULL' | 'ANALYTICS_360';

export interface PlanDisplayDto {
  publicCode: PublicPlanCode;
  nameKey: string;
  nameRu: string;
}

export interface PlanLimitsDto {
  maxPhotos: number;
  maxServiceItems: number;
  maxActivePromotions: number;
  maxPromotionDurationDays: number;
  maxPromotionsCreatedPerDay: number;
  maxManagers: number;
  maxAnalyticsDays: number;
  advertisingDiscountPercent: number;
  monthlyAdBonusKzt: number;
  canReplyToReviews: boolean;
  extendedStyling: boolean;
  analyticsTier: AnalyticsTier;
  supportPriority: 'STANDARD' | 'PRIORITY' | 'HIGHEST';
  moderationPriority: 'STANDARD' | 'PRIORITY' | 'HIGHEST';
  /** Always false for consumer-facing badge policy (Stage 6.4). */
  showPlanBadge: boolean;
}

export interface PlanCatalogItemDto {
  tier: BusinessPlanTier;
  slug: string;
  nameRu: string;
  display: PlanDisplayDto;
  priceKzt: number;
  periodDays: number | null;
  features: string[];
  limits: PlanLimitsDto;
}

export interface PlanTeamEntitlementsDto {
  activeManagers: number;
  pendingInvitations: number;
  limit: number;
  slotsUsed: number;
  overLimit: boolean;
  canAddManager: boolean;
}

export interface BusinessPlanStatusDto {
  businessId: string;
  tier: BusinessPlanTier;
  effectiveTier: BusinessPlanTier;
  expiresAt: string | null;
  isFeatured: boolean;
  featuredSlot: number | null;
  catalog: PlanCatalogItemDto;
  limits: PlanLimitsDto;
  usage: {
    photos: number;
    serviceItems: number;
    activePromotions: number;
  };
  team?: PlanTeamEntitlementsDto;
}

export interface MockPlanCheckoutResponse {
  success: boolean;
  mock: boolean;
  message: string;
  business: {
    id: string;
    planTier: BusinessPlanTier;
    planExpiresAt: string | null;
    isFeatured: boolean;
    featuredSlot: number | null;
  };
  plan: BusinessPlanStatusDto;
}
