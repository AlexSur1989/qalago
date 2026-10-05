import type { PlanLimits } from '../services/plan-limits.service';

const ANALYTICS_TIER_RANK: Record<PlanLimits['analyticsTier'], number> = {
  BASIC: 0,
  EXTENDED: 1,
  FULL: 2,
  ANALYTICS_360: 3,
};

const SUPPORT_RANK: Record<PlanLimits['supportPriority'], number> = {
  STANDARD: 0,
  PRIORITY: 1,
  HIGHEST: 2,
};

const MODERATION_RANK: Record<PlanLimits['moderationPriority'], number> = {
  STANDARD: 0,
  PRIORITY: 1,
  HIGHEST: 2,
};

function maxAnalyticsTier(
  a: PlanLimits['analyticsTier'],
  b: PlanLimits['analyticsTier'],
): PlanLimits['analyticsTier'] {
  return ANALYTICS_TIER_RANK[a] >= ANALYTICS_TIER_RANK[b] ? a : b;
}

function maxSupportPriority(
  a: PlanLimits['supportPriority'],
  b: PlanLimits['supportPriority'],
): PlanLimits['supportPriority'] {
  return SUPPORT_RANK[a] >= SUPPORT_RANK[b] ? a : b;
}

function maxModerationPriority(
  a: PlanLimits['moderationPriority'],
  b: PlanLimits['moderationPriority'],
): PlanLimits['moderationPriority'] {
  return MODERATION_RANK[a] >= MODERATION_RANK[b] ? a : b;
}

/** BASIC-like owner ops without commercial ad perks (Stage 6.18L.1). */
export function getLaunchPlanLimits(): PlanLimits {
  return {
    maxPhotos: 20,
    maxServiceItems: 50,
    maxActivePromotions: 3,
    maxPromotionDurationDays: 30,
    maxPromotionsCreatedPerDay: 2,
    maxManagers: 1,
    maxAnalyticsDays: 30,
    advertisingDiscountPercent: 0,
    monthlyAdBonusKzt: 0,
    canReplyToReviews: true,
    extendedStyling: true,
    analyticsTier: 'EXTENDED',
    supportPriority: 'STANDARD',
    moderationPriority: 'STANDARD',
    showPlanBadge: false,
  };
}

export function mergePlanLimitsMax(actual: PlanLimits, launch: PlanLimits): PlanLimits {
  return {
    maxPhotos: Math.max(actual.maxPhotos, launch.maxPhotos),
    maxServiceItems: Math.max(actual.maxServiceItems, launch.maxServiceItems),
    maxActivePromotions: Math.max(actual.maxActivePromotions, launch.maxActivePromotions),
    maxPromotionDurationDays: Math.max(
      actual.maxPromotionDurationDays,
      launch.maxPromotionDurationDays,
    ),
    maxPromotionsCreatedPerDay: Math.max(
      actual.maxPromotionsCreatedPerDay,
      launch.maxPromotionsCreatedPerDay,
    ),
    maxManagers: Math.max(actual.maxManagers, launch.maxManagers),
    maxAnalyticsDays: Math.max(actual.maxAnalyticsDays, launch.maxAnalyticsDays),
    advertisingDiscountPercent: actual.advertisingDiscountPercent,
    monthlyAdBonusKzt: actual.monthlyAdBonusKzt,
    canReplyToReviews: actual.canReplyToReviews || launch.canReplyToReviews,
    extendedStyling: actual.extendedStyling || launch.extendedStyling,
    analyticsTier: maxAnalyticsTier(actual.analyticsTier, launch.analyticsTier),
    supportPriority: maxSupportPriority(actual.supportPriority, launch.supportPriority),
    moderationPriority: maxModerationPriority(actual.moderationPriority, launch.moderationPriority),
    showPlanBadge: false,
  };
}
