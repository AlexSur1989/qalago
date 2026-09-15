import type { MonetizationPackage } from '@/lib/api';
import type { AppLocale } from '@/lib/locale';
import * as pres from '@/lib/presentation';

export type MonetizationSubNavId =
  | 'overview'
  | 'products'
  | 'packages'
  | 'orders'
  | 'campaigns';

export function formatKzt(amount: number, currency = 'KZT'): string {
  if (currency !== 'KZT') {
    return `${amount.toLocaleString('ru-RU')} ${currency}`;
  }
  return `${amount.toLocaleString('ru-RU')} ₸`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(
  locale: AppLocale,
  days: number | null | undefined,
  hours: number | null | undefined,
): string {
  return pres.formatDuration(locale, days, hours);
}

export const purchaseStateLabel = pres.purchaseStateLabel;
export const purchaseActionLabel = pres.purchaseActionLabel;
export const productLabel = pres.productLabel;
export const placementLabel = pres.placementLabel;
export const orderStatusLabel = pres.orderStatusLabel;
export const paymentStatusLabel = pres.paymentStatusLabel;
export const campaignStatusLabel = pres.campaignStatusLabel;
export const creativeStatusLabel = pres.creativeStatusLabel;
export const vipCampaignDisplayStatus = pres.vipCampaignDisplayStatus;
export const vipModerationNotice = pres.vipModerationNotice;
export const planTierLabel = pres.planTierLabel;
export const analyticsActionLabel = pres.analyticsActionLabel;

export function canSubmitCreative(creative?: { moderationStatus?: string } | null): boolean {
  return creative?.moderationStatus === 'DRAFT' || creative?.moderationStatus === 'REJECTED';
}

export function formatEffectivePeriod(
  locale: AppLocale,
  campaign: {
    startAt?: string | null;
    endAt?: string | null;
    effectivePeriodStarted?: boolean;
  },
): string {
  const pending = pres.formatEffectivePeriodLabel(locale, campaign);
  if (pending) return pending;
  if (!campaign.startAt || !campaign.endAt) return '—';
  return `${formatDate(campaign.startAt)} — ${formatDate(campaign.endAt)}`;
}

export function monetizationStatusClass(status: string): string {
  switch (status) {
    case 'ACTIVE':
    case 'PAID':
    case 'APPROVED':
      return 'tag tag-success';
    case 'SCHEDULED':
      return 'tag tag-info';
    case 'PENDING':
    case 'PENDING_MODERATION':
    case 'AWAITING_PAYMENT':
    case 'PAUSED':
      return 'tag tag-warning';
    case 'REJECTED':
    case 'CANCELLED':
    case 'FAILED':
      return 'tag tag-danger';
    case 'COMPLETED':
      return 'tag tag-muted';
    default:
      return 'tag tag-muted';
  }
}

export function packageHasVip(pkg: Pick<MonetizationPackage, 'items'>): boolean {
  return pkg.items.some(
    (item) => item.productCode === 'VIP_BANNER' || item.productType === 'VIP_BANNER',
  );
}

export function packageHasPromotedPromotion(pkg: Pick<MonetizationPackage, 'items'>): boolean {
  return pkg.items.some(
    (item) =>
      item.productCode === 'PROMOTED_PROMOTION' ||
      item.productType === 'PROMOTED_PROMOTION',
  );
}

export function parseApiError(locale: AppLocale, err: unknown): string {
  return pres.parseApiErrorMessage(locale, err);
}
