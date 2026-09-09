import { canModerate } from '@qalago/shared-types';

export type BusinessApplicationStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type BusinessOwnershipClaimStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type BusinessOwnershipClaimVerificationMethod = 'MANUAL';

export type BusinessRequestsSubNavId = 'applications' | 'claims';

export function canAccessBusinessRequests(role: string): boolean {
  return canModerate(role);
}

export function applicationStatusLabel(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'Черновик';
    case 'PENDING':
      return 'На проверке';
    case 'APPROVED':
      return 'Одобрено';
    case 'REJECTED':
      return 'Отклонено';
    case 'CANCELLED':
      return 'Отменено';
    default:
      return status;
  }
}

export function applicationStatusClass(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'tag tag-warning';
    case 'APPROVED':
      return 'tag tag-success';
    case 'REJECTED':
    case 'CANCELLED':
      return 'tag tag-danger';
    case 'DRAFT':
      return 'tag tag-muted';
    default:
      return 'tag tag-muted';
  }
}

export function claimStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'На проверке';
    case 'APPROVED':
      return 'Одобрено';
    case 'REJECTED':
      return 'Отклонено';
    case 'CANCELLED':
      return 'Отменено';
    default:
      return status;
  }
}

export function claimStatusClass(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'tag tag-warning';
    case 'APPROVED':
      return 'tag tag-success';
    case 'REJECTED':
    case 'CANCELLED':
      return 'tag tag-danger';
    default:
      return 'tag tag-muted';
  }
}

export function verificationMethodLabel(method: string): string {
  switch (method) {
    case 'MANUAL':
      return 'Ручная проверка';
    default:
      return method;
  }
}

export function canModerateApplication(status: string): boolean {
  return status === 'PENDING';
}

export function canModerateClaim(status: string): boolean {
  return status === 'PENDING';
}

export const REJECTION_REASON_MIN = 3;
export const REJECTION_REASON_MAX = 500;

export function isValidRejectionReason(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length >= REJECTION_REASON_MIN && trimmed.length <= REJECTION_REASON_MAX
  );
}

/** Map backend error JSON/text to user-safe Russian messages. */
export function mapBusinessRequestError(raw: string): string {
  const lower = raw.toLowerCase();
  if (raw.includes('409') || lower.includes('conflict') || lower.includes('no longer pending')) {
    return 'Статус заявки уже изменился. Обновите страницу.';
  }
  if (raw.includes('403') || lower.includes('forbidden')) {
    return 'Недостаточно прав для этого действия.';
  }
  if (raw.includes('404') || lower.includes('not found')) {
    return 'Заявка не найдена или недоступна.';
  }
  if (lower.includes('duplicate') || lower.includes('already exists')) {
    return 'Похожий бизнес уже существует. Проверьте карточку перед одобрением.';
  }
  if (
    lower.includes('suspended') ||
    lower.includes('revoked') ||
    lower.includes('invitation')
  ) {
    return 'Нельзя подтвердить права: доступ пользователя ограничен. Требуется решение администратора.';
  }
  if (lower.includes('already an active owner') || lower.includes('already have')) {
    return 'Пользователь уже имеет права владельца.';
  }
  try {
    const parsed = JSON.parse(raw) as { message?: string | string[] };
    const msg = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
    if (msg) return mapBusinessRequestError(msg);
  } catch {
    /* not JSON */
  }
  return 'Не удалось выполнить действие. Попробуйте ещё раз.';
}

export function buildListQuery(params: {
  page?: number;
  limit?: number;
  status?: string;
  citySlug?: string;
  businessId?: string;
}): string {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.status) qs.set('status', params.status);
  if (params.citySlug) qs.set('citySlug', params.citySlug);
  if (params.businessId) qs.set('businessId', params.businessId);
  const s = qs.toString();
  return s ? `?${s}` : '';
}
