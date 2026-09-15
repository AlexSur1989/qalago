import type { BusinessPlanStatus } from '@/lib/api';
import type { AppLocale } from '@/lib/locale';
import * as pres from '@/lib/presentation';

export function manualPaymentNotice(locale: AppLocale): string {
  return pres.manualPaymentNotice(locale);
}

export function vipModerationPlacementNotice(locale: AppLocale): string {
  return pres.vipModerationPlacementNotice(locale);
}

export function vipPlanDisclaimer(locale: AppLocale): string {
  return pres.vipPlanDisclaimer(locale);
}

export function photoOverLimitHint(locale: AppLocale): string {
  return pres.photoOverLimitHint(locale);
}

export const planTierLabelRu = (tier?: string | null) => pres.planTierLabel('ru', tier);

export function formatPlanUsageLine(
  locale: AppLocale,
  label: string,
  usage: number,
  limit: number,
  entitlements?: { published?: number; overLimit?: boolean },
): string {
  let line = `${label}: ${usage} / ${limit}`;
  if (entitlements?.overLimit && entitlements.published != null) {
    line += pres.planUsagePublishedSuffix(locale, entitlements.published);
  }
  return line;
}

export function buildPlanUsageSummary(locale: AppLocale, plan: BusinessPlanStatus): string[] {
  const e = plan.entitlements;
  return [
    formatPlanUsageLine(
      locale,
      pres.planUsageResourceLabel(locale, 'photos'),
      plan.usage.photos,
      plan.limits.maxPhotos,
      e?.photos,
    ),
    formatPlanUsageLine(
      locale,
      pres.planUsageResourceLabel(locale, 'serviceItems'),
      plan.usage.serviceItems,
      plan.limits.maxServiceItems,
      e?.serviceItems,
    ),
    formatPlanUsageLine(
      locale,
      pres.planUsageResourceLabel(locale, 'activePromotions'),
      plan.usage.activePromotions,
      plan.limits.maxActivePromotions,
      e?.activePromotions,
    ),
  ];
}

export function photoPublishState(
  index: number,
  plan: BusinessPlanStatus | null,
): 'published' | 'hidden' | 'unknown' {
  if (!plan) return 'unknown';
  const publishedCount =
    plan.entitlements?.photos.published ?? plan.limits.maxPhotos;
  return index < publishedCount ? 'published' : 'hidden';
}

export const photoPublishLabel = pres.photoPublishLabel;
export const businessAnalyticsLabel = pres.businessAnalyticsLabel;
export const campaignAnalyticsLabel = pres.campaignAnalyticsLabel;
