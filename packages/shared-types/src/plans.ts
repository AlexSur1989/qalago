export enum BusinessPlanTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP',
}

export type AnalyticsTier = 'BASIC' | 'EXTENDED' | 'FULL';

export interface PlanLimitsDto {
  maxPhotos: number;
  maxServiceItems: number;
  maxActivePromotions: number;
  maxPromotionDurationDays: number;
  maxPromotionsCreatedPerDay: number;
  maxAnalyticsDays: number;
  advertisingDiscountPercent: number;
  analyticsTier: AnalyticsTier;
  supportPriority: 'STANDARD' | 'PRIORITY' | 'HIGHEST';
  moderationPriority: 'STANDARD' | 'PRIORITY' | 'HIGHEST';
  showPlanBadge: boolean;
}

export interface PlanCatalogItemDto {
  tier: BusinessPlanTier;
  slug: string;
  nameRu: string;
  priceKzt: number;
  periodDays: number | null;
  features: string[];
  limits: PlanLimitsDto;
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
