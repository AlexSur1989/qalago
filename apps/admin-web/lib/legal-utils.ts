import { canModerate, isSuperAdminRole } from '@qalago/shared-types';

export type LegalSubNavId =
  | 'documents'
  | 'data-requests'
  | 'government'
  | 'security';

export function canAccessLegalConsole(role: string): boolean {
  return canModerate(role);
}

export function canAccessGovernmentSecurity(role: string): boolean {
  return isSuperAdminRole(role);
}

export function legalDocumentTypeLabel(type: string): string {
  switch (type) {
    case 'TERMS_OF_SERVICE':
      return 'Пользовательское соглашение';
    case 'PRIVACY_POLICY':
      return 'Политика конфиденциальности';
    case 'COMMUNITY_GUIDELINES':
      return 'Правила сообщества';
    case 'BUSINESS_TERMS':
      return 'Условия для бизнеса';
    case 'ADVERTISING_TERMS':
      return 'Рекламные условия';
    default:
      return type;
  }
}

export function legalDocumentStatusLabel(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'Черновик';
    case 'PUBLISHED':
      return 'Опубликован';
    case 'ARCHIVED':
      return 'Архив';
    default:
      return status;
  }
}

export function legalDocumentStatusClass(status: string): string {
  switch (status) {
    case 'PUBLISHED':
      return 'tag tag-success';
    case 'DRAFT':
      return 'tag tag-warning';
    case 'ARCHIVED':
      return 'tag tag-muted';
    default:
      return 'tag tag-muted';
  }
}

export function dataRightsRequestTypeLabel(type: string): string {
  switch (type) {
    case 'ACCESS':
      return 'Доступ к данным';
    case 'EXPORT':
      return 'Экспорт';
    case 'CORRECTION':
      return 'Исправление';
    case 'DELETE_ACCOUNT':
      return 'Удаление аккаунта';
    case 'DELETE_DATA':
      return 'Удаление данных';
    case 'OTHER':
      return 'Другое';
    default:
      return type;
  }
}

export function dataRightsRequestStatusLabel(status: string): string {
  switch (status) {
    case 'SUBMITTED':
      return 'Получено';
    case 'IDENTITY_VERIFICATION_REQUIRED':
      return 'Нужна верификация';
    case 'IN_REVIEW':
      return 'На рассмотрении';
    case 'APPROVED':
      return 'Одобрено';
    case 'PROCESSING':
      return 'В обработке';
    case 'COMPLETED':
      return 'Завершено';
    case 'REJECTED':
      return 'Отклонено';
    case 'CANCELLED':
      return 'Отменено';
    default:
      return status;
  }
}

export function dataRightsRequestStatusClass(status: string): string {
  switch (status) {
    case 'SUBMITTED':
    case 'IN_REVIEW':
    case 'PROCESSING':
      return 'tag tag-warning';
    case 'COMPLETED':
    case 'APPROVED':
      return 'tag tag-success';
    case 'REJECTED':
    case 'CANCELLED':
      return 'tag tag-danger';
    case 'IDENTITY_VERIFICATION_REQUIRED':
      return 'tag tag-muted';
    default:
      return 'tag tag-muted';
  }
}

export function mapLegalError(raw: string): string {
  if (raw.includes('403') || raw.includes('Forbidden')) {
    return 'Недостаточно прав для раздела Legal.';
  }
  if (raw.includes('404')) {
    return 'Запись не найдена.';
  }
  if (raw.includes('Failed to fetch') || raw.includes('NetworkError')) {
    return 'Не удалось связаться с API. Проверьте catalog-api.';
  }
  return raw.length > 200 ? 'Ошибка legal API.' : raw;
}
