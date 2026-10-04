import { LegalLocale } from '@prisma/client';

type LocaleRequest = {
  headers?: Record<string, string | string[] | undefined>;
};

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Resolve legal locale from client hint; default RU when unknown. */
export function resolveLegalLocaleFromRequest(req: LocaleRequest): LegalLocale {
  const explicit =
    headerValue(req.headers?.['x-qalago-locale']) ??
    headerValue(req.headers?.['x-qalago-legal-locale']);
  if (explicit) {
    const norm = explicit.toUpperCase();
    if (norm === 'KK' || norm.startsWith('KK')) return LegalLocale.KK;
    if (norm === 'RU' || norm.startsWith('RU')) return LegalLocale.RU;
  }
  const accept = headerValue(req.headers?.['accept-language']);
  if (accept?.toLowerCase().includes('kk')) {
    return LegalLocale.KK;
  }
  return LegalLocale.RU;
}

export function appLocaleToLegalLocale(locale: 'ru' | 'kk' | string): LegalLocale {
  return locale.startsWith('kk') ? LegalLocale.KK : LegalLocale.RU;
}
