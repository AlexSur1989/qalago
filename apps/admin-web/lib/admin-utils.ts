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

const AUTH_METHOD_LABELS: Record<string, string> = {
  GOOGLE: 'Google',
  APPLE: 'Apple',
  PHONE: 'Телефон',
};

export function formatUserAuthMethods(methods?: string[] | null): string {
  if (!methods || methods.length === 0) return '—';
  return methods.map((method) => AUTH_METHOD_LABELS[method] ?? method).join(' + ');
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
    case 'FREE':
      return 'Free';
    case 'BASIC':
      return 'Basic';
    case 'PREMIUM':
      return 'Premium';
    case 'VIP':
      return 'VIP';
    default:
      return 'Free';
  }
}
