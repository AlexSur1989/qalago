export type AdminTabId =
  | 'moderation'
  | 'featured'
  | 'reviews'
  | 'categories'
  | 'content'
  | 'users'
  | 'cities'
  | 'monetization';

export function statusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Активно';
    case 'PENDING':
      return 'На модерации';
    case 'BLOCKED':
      return 'Заблокировано';
    default:
      return status;
  }
}

export function statusClass(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'tag tag-success';
    case 'PENDING':
      return 'tag tag-warning';
    case 'BLOCKED':
      return 'tag tag-danger';
    default:
      return 'tag tag-muted';
  }
}

export function isPublicVisible(status: string): boolean {
  return status === 'ACTIVE';
}

export function publicVisibilityLabel(status: string): string {
  return isPublicVisible(status) ? 'В приложении' : 'Не в приложении';
}

export function publicVisibilityClass(status: string): string {
  return isPublicVisible(status) ? 'tag tag-success' : 'tag tag-muted';
}

export function confirmAction(message: string): boolean {
  return window.confirm(message);
}

export function planTierLabel(tier?: string | null): string {
  switch (tier) {
    case 'PRO':
      return 'Pro';
    case 'TOP_CITY':
      return 'Топ города';
    default:
      return 'Базовый';
  }
}
