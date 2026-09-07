import type { BusinessPlanTier } from './plans';

export type BusinessTrafficSource =
  | 'HOME'
  | 'SEARCH'
  | 'CATEGORY'
  | 'MAP'
  | 'PROMOTIONS'
  | 'FAVORITES'
  | 'AD'
  | 'DIRECT'
  | 'UNKNOWN';

export type AnalyticsEventType =
  | 'VIEW_BUSINESS'
  | 'CALL_CLICK'
  | 'WHATSAPP_CLICK'
  | 'ROUTE_CLICK'
  | 'WEBSITE_CLICK'
  | 'INSTAGRAM_CLICK'
  | 'FAVORITE_ADD'
  | 'FAVORITE_REMOVE'
  | 'PROMOTION_VIEW';

export interface AnalyticsCapabilitiesDto {
  maxDays: number;
  views: boolean;
  viewTrend: boolean;
  actions: boolean;
  actionTrend: boolean;
  trafficSources: boolean;
  conversion: boolean;
  periodComparison: boolean;
  promotionAnalytics: boolean;
  popularTimes: boolean;
  benchmark: boolean;
  recommendations: boolean;
  searchQueries: boolean;
  audienceGeography: boolean;
}

export interface AnalyticsLockedSectionDto {
  id: string;
  label: string;
  requiredPlan: BusinessPlanTier;
  message: string;
}

export interface AnalyticsEffectiveRangeDto {
  days: number;
  from: string;
  to: string;
}

export interface AnalyticsOverviewDto {
  views: number;
  totalCustomerActions?: number;
}

export interface AnalyticsActionsDto {
  total: number;
  calls: number;
  whatsapp: number;
  routes: number;
  website: number;
  instagram: number;
  favorites: number;
  promotionViews: number;
}

export interface AnalyticsTrendPointDto {
  date: string;
  count: number;
}

export interface AnalyticsTrendsDto {
  views: AnalyticsTrendPointDto[];
  actions?: AnalyticsTrendPointDto[];
}

export interface AnalyticsSourceItemDto {
  source: BusinessTrafficSource | string;
  label: string;
  views: number;
  share: number;
}

export interface AnalyticsSearchQueryItemDto {
  query: string;
  count: number;
  percentage: number;
}

export interface AnalyticsConversionDto {
  views: number;
  actions: number;
  rate: number;
}

export interface AnalyticsComparisonMetricDto {
  key: string;
  label: string;
  current: number;
  previous: number;
  deltaPercent: number | null;
}

export interface AnalyticsComparisonDto {
  currentDays: number;
  previousDays: number;
  metrics: AnalyticsComparisonMetricDto[];
}

export interface AnalyticsPromotionItemDto {
  promotionViews: number;
}

export interface AnalyticsPopularTimesDto {
  byHour: Array<{ hour: number; count: number }>;
  byWeekday: Array<{ weekday: number; label: string; count: number }>;
}

export interface AnalyticsBenchmarkDto {
  categoryTitle: string;
  businessViews: number;
  categoryAvgViews: number;
  businessActions: number;
  categoryAvgActions: number;
}

export interface AnalyticsRecommendationDto {
  id: string;
  title: string;
  body: string;
}

export interface BusinessAnalyticsDashboardDto {
  businessId: string;
  plan: BusinessPlanTier;
  effectivePlan: BusinessPlanTier;
  headline: string;
  capabilities: AnalyticsCapabilitiesDto;
  lockedSections: AnalyticsLockedSectionDto[];
  effectiveRange: AnalyticsEffectiveRangeDto;
  overview: AnalyticsOverviewDto;
  actions: AnalyticsActionsDto | null;
  trends: AnalyticsTrendsDto;
  sources: AnalyticsSourceItemDto[] | null;
  /** Legacy Stage 5F placeholder — null after Stage 5H implementation. */
  sourcesStatus?: 'DEFERRED' | null;
  searchQueries: AnalyticsSearchQueryItemDto[] | null;
  searchQueriesStatus?: 'AVAILABLE' | 'INSUFFICIENT_DATA' | null;
  searchQueriesOtherCount?: number | null;
  conversion: AnalyticsConversionDto | null;
  comparison: AnalyticsComparisonDto | null;
  promotions: AnalyticsPromotionItemDto | null;
  popularTimes: AnalyticsPopularTimesDto | null;
  benchmark: AnalyticsBenchmarkDto | null;
  recommendations: AnalyticsRecommendationDto[] | null;
}
