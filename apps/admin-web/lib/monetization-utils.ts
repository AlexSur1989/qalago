export type MonetizationSubNavId =
  | 'overview'
  | 'orders'
  | 'payments'
  | 'planPayments'
  | 'campaigns'
  | 'creatives'
  | 'placements'
  | 'pricing';

/** Monetization area subnav routes (includes plan billing separate from ad payments). */
export const MONETIZATION_SUBNAV_HREFS: readonly string[] = [
  '/monetization',
  '/monetization/orders',
  '/monetization/payments',
  '/plans/payments',
  '/monetization/campaigns',
  '/monetization/creatives',
  '/monetization/placements',
  '/monetization/pricing',
];

/** Parse admin KZT amount (positive integer). */
export function parseAdminProductPriceAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, '');
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(value) || value < 1) return null;
  return value;
}

export function validateAdminProductPriceAmount(amount: number | null): string | null {
  if (amount == null) return 'Укажите целую сумму в KZT (минимум 1)';
  if (!Number.isSafeInteger(amount) || amount < 1) {
    return 'Цена должна быть положительным целым числом KZT';
  }
  return null;
}

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

export function formatCtr(ctr: number): string {
  return `${ctr.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`;
}

export function formatDuration(days: number | null, hours: number | null): string {
  if (days != null) {
    if (days === 1) return '1 день';
    if (days >= 2 && days <= 4) return `${days} дня`;
    return `${days} дней`;
  }
  if (hours != null) {
    if (hours === 1) return '1 час';
    if (hours >= 2 && hours <= 4) return `${hours} часа`;
    return `${hours} часов`;
  }
  return '—';
}

export function productLabel(code?: string | null): string {
  switch (code) {
    case 'BOOST':
      return 'Продвижение в категории';
    case 'TOP_CATEGORY':
      return 'ТОП категории';
    case 'PROMOTED_PROMOTION':
      return 'Продвижение акции';
    case 'FEATURED_BUSINESS':
      return 'Продвижение на главной';
    case 'VIP_BANNER':
      return 'Баннер на главной';
    case 'PACKAGE':
      return 'Пакет';
    default:
      return code ?? '—';
  }
}

export function placementLabel(code?: string | null): string {
  switch (code) {
    case 'HOME_VIP_BANNER':
      return 'Баннер на главной';
    case 'HOME_FEATURED':
      return 'Продвижение на главной';
    case 'HOME_PROMOTIONS':
      return 'Продвижение акции';
    case 'CATEGORY_TOP':
      return 'ТОП категории';
    case 'CATEGORY_BOOST':
      return 'Продвижение в категории';
    case 'SEARCH_TOP':
      return 'Поиск (топ)';
    case 'MAP_FEATURED':
      return 'Карта (избранное)';
    default:
      return code ?? '—';
  }
}

export function orderStatusLabel(status: string): string {
  switch (status) {
    case 'AWAITING_PAYMENT':
      return 'Ожидает оплаты';
    case 'PAID':
      return 'Оплачен';
    case 'CANCELLED':
      return 'Отменён';
    case 'REFUNDED':
      return 'Возврат';
    case 'PARTIALLY_REFUNDED':
      return 'Частичный возврат';
    case 'DRAFT':
      return 'Черновик';
    default:
      return status;
  }
}

export function paymentStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Ожидает';
    case 'PAID':
      return 'Оплачен';
    case 'FAILED':
      return 'Ошибка';
    case 'CANCELLED':
      return 'Отменён';
    case 'REFUNDED':
      return 'Возврат';
    case 'PARTIALLY_REFUNDED':
      return 'Частичный возврат';
    default:
      return status;
  }
}

export function campaignStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING_MODERATION':
      return 'На модерации';
    case 'AWAITING_PAYMENT':
      return 'Ожидает оплаты';
    case 'SCHEDULED':
      return 'Запланировано';
    case 'ACTIVE':
      return 'Активно';
    case 'PAUSED':
      return 'Приостановлено';
    case 'COMPLETED':
      return 'Завершено';
    case 'CANCELLED':
      return 'Отменено';
    case 'REJECTED':
      return 'Отклонено';
    default:
      return status;
  }
}

export function creativeModerationLabel(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'Черновик';
    case 'PENDING':
      return 'На проверке';
    case 'APPROVED':
      return 'Одобрен';
    case 'REJECTED':
      return 'Отклонён';
    default:
      return status;
  }
}

export function creativeStatusLabel(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'Черновик';
    case 'PENDING':
      return 'На модерации';
    case 'APPROVED':
      return 'Одобрено';
    case 'REJECTED':
      return 'Отклонено';
    default:
      return status;
  }
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

export function analyticsActionLabel(type: string): string {
  switch (type) {
    case 'AD_CARD_OPEN':
      return 'Открытия карточки';
    case 'AD_CALL_CLICK':
      return 'Звонки';
    case 'AD_WHATSAPP_CLICK':
      return 'WhatsApp';
    case 'AD_ROUTE_CLICK':
      return 'Маршруты';
    case 'AD_WEBSITE_CLICK':
      return 'Сайт';
    case 'AD_INSTAGRAM_CLICK':
      return 'Instagram';
    case 'AD_PROMOTION_OPEN':
      return 'Открытия акции';
    default:
      return type;
  }
}

export type CampaignAction = 'pause' | 'resume' | 'cancel';

export function campaignActionsForStatus(status: string): CampaignAction[] {
  switch (status) {
    case 'ACTIVE':
      return ['pause', 'cancel'];
    case 'PAUSED':
      return ['resume', 'cancel'];
    case 'SCHEDULED':
      return ['pause', 'cancel'];
    default:
      return [];
  }
}

export function canConfirmPayment(status: string, provider: string): boolean {
  return status === 'PENDING' && provider === 'MANUAL';
}

export function parseApiError(err: unknown): string {
  if (!(err instanceof Error)) return 'Неизвестная ошибка';
  const raw = err.message;
  try {
    const parsed = JSON.parse(raw) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message.join(', ');
    if (parsed.message) return String(parsed.message);
  } catch {
    // not JSON
  }
  return raw || 'Неизвестная ошибка';
}
