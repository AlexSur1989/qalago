export enum BusinessPlanTier {
  BASIC = 'BASIC',
  PRO = 'PRO',
  TOP_CITY = 'TOP_CITY',
}

export interface PlanLimitsDto {
  maxPhotos: number | null;
  maxActivePromotions: number;
  maxPromotionsInFeed: number;
  maxPromotionDurationDays: number;
  maxPromotionsCreatedPerDay: number;
  maxAnalyticsDays: number;
  vipBadge: boolean;
  topCitySlot: boolean;
  feedPriority: number;
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
