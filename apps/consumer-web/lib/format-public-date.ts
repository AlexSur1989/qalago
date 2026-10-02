import type { AppLocale } from './locale';

export function formatReviewDate(iso: string, locale: AppLocale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'kk' ? 'kk-KZ' : 'ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
