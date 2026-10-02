import type { PlanPaymentRow } from '@/lib/api';
import type { AppLocale } from '@/lib/locale';
import { planTierLabel } from '@/lib/presentation';

/** Mirrors backend tier rank (FREE < BASIC < PREMIUM < VIP). */
const TIER_RANK: Record<string, number> = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  VIP: 3,
};

export function planTierRank(tier: string): number {
  return TIER_RANK[tier] ?? 0;
}

export function findPendingPlanPayment(
  payments: PlanPaymentRow[],
): PlanPaymentRow | undefined {
  return payments.find((p) => p.status === 'PENDING');
}

export function isLowerPaidPlanTier(targetTier: string, effectiveTier: string): boolean {
  if (targetTier === 'FREE') return false;
  return planTierRank(targetTier) < planTierRank(effectiveTier);
}

export function isSameTierRenewal(targetTier: string, effectiveTier: string): boolean {
  return targetTier === effectiveTier && effectiveTier !== 'FREE';
}

/** Whether owner may start a plan purchase for `targetTier` (UI guard; backend is authoritative). */
export function canOfferPlanPurchase(
  effectiveTier: string,
  targetTier: string,
  hasPendingPayment: boolean,
): boolean {
  if (targetTier === 'FREE') return false;
  if (hasPendingPayment) return false;
  if (isLowerPaidPlanTier(targetTier, effectiveTier)) return false;
  if (effectiveTier === 'FREE') return true;
  if (isSameTierRenewal(targetTier, effectiveTier)) return true;
  return planTierRank(targetTier) > planTierRank(effectiveTier);
}

/** Tiers that should appear as purchasable actions for the current effective tier. */
export function listOfferedPlanPurchaseTiers(effectiveTier: string): string[] {
  switch (effectiveTier) {
    case 'FREE':
      return ['BASIC', 'PREMIUM', 'VIP'];
    case 'BASIC':
      return ['BASIC', 'PREMIUM', 'VIP'];
    case 'PREMIUM':
      return ['PREMIUM', 'VIP'];
    case 'VIP':
      return ['VIP'];
    default:
      return ['BASIC', 'PREMIUM', 'VIP'];
  }
}

export function planCatalogDisplayName(
  locale: AppLocale,
  tier: string,
  nameRu?: string | null,
): string {
  if (locale === 'ru' && nameRu) return nameRu;
  return planTierLabel(locale, tier);
}

export type PlanPurchaseActionKind = 'choose' | 'renew' | 'upgrade';

export function planPurchaseActionKind(
  effectiveTier: string,
  targetTier: string,
): PlanPurchaseActionKind {
  if (effectiveTier === 'FREE') return 'choose';
  if (isSameTierRenewal(targetTier, effectiveTier)) return 'renew';
  return 'upgrade';
}
