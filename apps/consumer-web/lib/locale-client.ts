import { LOCALE_COOKIE_NAME, normalizeLocale, type AppLocale } from './locale';

/** Read persisted locale in client components (error boundary, etc.). */
export function readClientLocale(): AppLocale {
  if (typeof document === 'undefined') return 'ru';
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`));
  return normalizeLocale(match?.[1] ? decodeURIComponent(match[1]) : null);
}
