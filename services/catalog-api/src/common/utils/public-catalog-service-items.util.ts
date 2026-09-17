import { BusinessPlanTier } from '@prisma/client';
import { PLAN_CATALOG } from '../services/plan-limits.service';
import { resolveEffectivePlanTier } from './business-rank.util';
import { CatalogSortableItem, sortCatalogItems } from './catalog-sort.util';
import { sliceToPublicLimit } from './plan-entitlements.util';

/** Canonical max visible service items for a business plan (expired paid → FREE). */
export function getPublishedServiceItemLimit(
  planTier: BusinessPlanTier,
  planExpiresAt: Date | null,
): number {
  const effectiveTier = resolveEffectivePlanTier({ planTier, planExpiresAt });
  const catalog = PLAN_CATALOG.find((plan) => plan.tier === effectiveTier);
  if (!catalog) {
    return PLAN_CATALOG.find((plan) => plan.tier === BusinessPlanTier.FREE)!.limits
      .maxServiceItems;
  }
  return catalog.limits.maxServiceItems;
}

/** Same ordering + cap as consumer catalog (`getPublishedCatalogItems`). */
export function selectPublishedCatalogServiceItems<T extends CatalogSortableItem>(
  items: readonly T[],
  planTier: BusinessPlanTier,
  planExpiresAt: Date | null,
): T[] {
  const limit = getPublishedServiceItemLimit(planTier, planExpiresAt);
  return sliceToPublicLimit(sortCatalogItems(items), limit);
}

/** When plan context already resolved effective tier (e.g. PlanLimitsService). */
export function selectPublishedCatalogServiceItemsForEffectiveTier<
  T extends CatalogSortableItem,
>(items: readonly T[], effectiveTier: BusinessPlanTier): T[] {
  const catalog = PLAN_CATALOG.find((plan) => plan.tier === effectiveTier);
  const limit =
    catalog?.limits.maxServiceItems ??
    PLAN_CATALOG.find((plan) => plan.tier === BusinessPlanTier.FREE)!.limits
      .maxServiceItems;
  return sliceToPublicLimit(sortCatalogItems(items), limit);
}
