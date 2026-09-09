export type ApplicationStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

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

export function membershipRoleLabel(role: string): string {
  switch (role) {
    case 'OWNER':
      return 'Владелец';
    case 'MANAGER':
      return 'Менеджер';
    default:
      return role;
  }
}

export function mapOnboardingError(raw: string): string {
  const lower = raw.toLowerCase();
  if (raw.includes('409') || lower.includes('conflict') || lower.includes('pending')) {
    return 'Заявка уже отправлена или статус изменился. Обновите страницу.';
  }
  if (lower.includes('duplicate') || lower.includes('already exists')) {
    return 'Похожий бизнес уже есть в QalaGo. Попробуйте найти существующий.';
  }
  if (lower.includes('already an active owner') || lower.includes('already have')) {
    return 'У вас уже есть права владельца этого бизнеса.';
  }
  if (lower.includes('suspended') || lower.includes('revoked')) {
    return 'Доступ ограничен. Обратитесь к администратору.';
  }
  if (lower.includes('not active') || lower.includes('inactive')) {
    return 'Этот бизнес пока недоступен для заявки.';
  }
  if (raw.includes('429') || lower.includes('too many')) {
    return 'Слишком много попыток. Попробуйте позже.';
  }
  try {
    const parsed = JSON.parse(raw) as { message?: string | string[] };
    const msg = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
    if (msg) return mapOnboardingError(msg);
  } catch {
    /* not JSON */
  }
  return 'Не удалось выполнить действие. Попробуйте ещё раз.';
}
