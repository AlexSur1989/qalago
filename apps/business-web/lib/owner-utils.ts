import type { BusinessPlanStatus, PlanEntitlements } from '@/lib/api';

export const MANUAL_PAYMENT_NOTICE =
  'Оплата подтверждается администратором вручную. Автоматического списания нет — статус заказа обновится после подтверждения.';

export const VIP_MODERATION_NOTICE =
  'VIP-размещение не начнёт расходовать оплаченный срок, пока баннер не одобрен.';

export const VIP_PLAN_DISCLAIMER =
  'Рекламные размещения приобретаются отдельно.';

export const PHOTO_OVER_LIMIT_HINT =
  'На текущем тарифе публикуется ограниченное число фото. Остальные сохранены и снова появятся после повышения тарифа.';

export function planTierLabelRu(tier?: string | null): string {
  switch (tier) {
    case 'FREE':
      return 'Free';
    case 'BASIC':
      return 'Basic';
    case 'PREMIUM':
      return 'Premium';
    case 'VIP':
      return 'VIP';
    default:
      return tier ?? 'Free';
  }
}

export function formatPlanUsageLine(
  label: string,
  usage: number,
  limit: number,
  entitlements?: { published?: number; overLimit?: boolean },
): string {
  let line = `${label}: ${usage} / ${limit}`;
  if (entitlements?.overLimit && entitlements.published != null) {
    line += ` (опубликовано ${entitlements.published})`;
  }
  return line;
}

export function buildPlanUsageSummary(plan: BusinessPlanStatus): string[] {
  const e = plan.entitlements;
  return [
    formatPlanUsageLine('Фото', plan.usage.photos, plan.limits.maxPhotos, e?.photos),
    formatPlanUsageLine(
      'Товары и услуги',
      plan.usage.serviceItems,
      plan.limits.maxServiceItems,
      e?.serviceItems,
    ),
    formatPlanUsageLine(
      'Активные акции',
      plan.usage.activePromotions,
      plan.limits.maxActivePromotions,
      e?.activePromotions,
    ),
  ];
}

/** Gallery index (0-based) → owner-facing publish state. */
export function photoPublishState(
  index: number,
  plan: BusinessPlanStatus | null,
): 'published' | 'hidden' | 'unknown' {
  if (!plan) return 'unknown';
  const publishedCount =
    plan.entitlements?.photos.published ?? plan.limits.maxPhotos;
  return index < publishedCount ? 'published' : 'hidden';
}

export function photoPublishLabel(state: ReturnType<typeof photoPublishState>): string | null {
  switch (state) {
    case 'published':
      return 'Опубликовано';
    case 'hidden':
      return 'Не публикуется по лимиту тарифа';
    default:
      return null;
  }
}

export function businessAnalyticsLabel(type: string): string {
  switch (type) {
    case 'VIEW_BUSINESS':
      return 'Просмотры карточки';
    case 'CALL_CLICK':
      return 'Звонки';
    case 'WHATSAPP_CLICK':
      return 'WhatsApp';
    case 'ROUTE_CLICK':
      return 'Маршруты';
    case 'FAVORITE_ADD':
      return 'Добавления в избранное';
    case 'VIEW_PROMOTION':
      return 'Просмотры акции';
    default:
      return type;
  }
}

export function campaignAnalyticsLabel(key: string): string {
  switch (key) {
    case 'served':
    case 'servedCount':
      return 'Показы';
    case 'impressions':
    case 'qualifiedImpressions':
      return 'Просмотры';
    case 'clicks':
    case 'clickCount':
      return 'Клики';
    case 'ctr':
      return 'CTR';
    default:
      return key;
  }
}
