import { canModerate } from '@qalago/shared-types';

export type ModerationSubNavId = 'cases';

export function canAccessModerationConsole(role: string): boolean {
  return canModerate(role);
}

export function moderationCaseStatusLabel(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'Открыто';
    case 'TRIAGED':
      return 'Триаж';
    case 'IN_REVIEW':
      return 'На проверке';
    case 'ACTION_REQUIRED':
      return 'Нужно действие';
    case 'RESOLVED':
      return 'Закрыто';
    case 'DISMISSED':
      return 'Отклонено';
    case 'APPEALED':
      return 'Апелляция';
    default:
      return status;
  }
}

export function moderationCaseStatusClass(status: string): string {
  switch (status) {
    case 'OPEN':
    case 'TRIAGED':
    case 'IN_REVIEW':
    case 'ACTION_REQUIRED':
      return 'tag tag-warning';
    case 'RESOLVED':
      return 'tag tag-success';
    case 'DISMISSED':
      return 'tag tag-muted';
    case 'APPEALED':
      return 'tag tag-danger';
    default:
      return 'tag tag-muted';
  }
}

export function moderationPriorityLabel(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'Низкий';
    case 'NORMAL':
      return 'Обычный';
    case 'HIGH':
      return 'Высокий';
    case 'URGENT':
      return 'Срочный';
    default:
      return priority;
  }
}

export function moderationTargetTypeLabel(targetType: string): string {
  switch (targetType) {
    case 'BUSINESS':
      return 'Заведение';
    case 'REVIEW':
      return 'Отзыв';
    case 'PROMOTION':
      return 'Акция';
    case 'MEDIA':
      return 'Медиа';
    case 'USER':
      return 'Пользователь';
    default:
      return targetType;
  }
}

export function contentReportReasonLabel(reason: string): string {
  switch (reason) {
    case 'SPAM':
      return 'Спам';
    case 'FRAUD_OR_SCAM':
      return 'Мошенничество';
    case 'INAPPROPRIATE_CONTENT':
      return 'Неприемлемый контент';
    case 'HARASSMENT':
      return 'Домогательства';
    case 'FALSE_INFORMATION':
      return 'Ложная информация';
    case 'IMPERSONATION':
      return 'Выдача за другого';
    case 'COPYRIGHT_OR_IP':
      return 'Авторские права';
    case 'PRIVACY':
      return 'Конфиденциальность';
    case 'DANGEROUS_OR_ILLEGAL':
      return 'Опасный / незаконный';
    case 'OTHER':
      return 'Другое';
    default:
      return reason;
  }
}

export function mapModerationError(raw: string): string {
  if (raw.includes('403') || raw.includes('Forbidden')) {
    return 'Недостаточно прав для модерации.';
  }
  if (raw.includes('404')) {
    return 'Кейс не найден.';
  }
  if (raw.includes('Failed to fetch') || raw.includes('NetworkError')) {
    return 'Не удалось связаться с API. Проверьте catalog-api.';
  }
  return raw.length > 200 ? 'Ошибка сервера модерации.' : raw;
}
