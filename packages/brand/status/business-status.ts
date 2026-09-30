import type { BackofficeStatusPresentation } from './types';

/** Canonical business lifecycle status (Admin + Business). Values unchanged — presentation only. */
export function businessStatusPresentation(status: string): BackofficeStatusPresentation {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Активно', tone: 'success' };
    case 'PENDING':
      return { label: 'На модерации', tone: 'warning' };
    case 'BLOCKED':
      return { label: 'Заблокировано', tone: 'danger' };
    default:
      return { label: 'Неизвестный статус', tone: 'neutral' };
  }
}

export function featureFlagPresentation(enabled: boolean): BackofficeStatusPresentation {
  return enabled
    ? { label: 'Включено', tone: 'success' }
    : { label: 'Выключено', tone: 'neutral' };
}

export function planTierPresentation(tier?: string | null): BackofficeStatusPresentation {
  switch (tier) {
    case 'FREE':
      return { label: 'Бесплатный', tone: 'neutral' };
    case 'BASIC':
      return { label: 'BUSINESS', tone: 'info' };
    case 'PREMIUM':
      return { label: 'PRO', tone: 'info' };
    case 'VIP':
      return { label: 'VIP', tone: 'warning' };
    default:
      return { label: 'Бесплатный', tone: 'neutral' };
  }
}
