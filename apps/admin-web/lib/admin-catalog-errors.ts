import type { AdminCatalogLocale } from './admin-catalog-labels';
import { adminCatalogLabel } from './admin-catalog-labels';

export type AdminCatalogErrorKind =
  | 'duplicate_slug'
  | 'validation'
  | 'forbidden'
  | 'unauthorized'
  | 'network'
  | 'generic';

export type ParsedAdminCatalogError = {
  kind: AdminCatalogErrorKind;
  message: string;
  raw?: string;
};

export function parseAdminCatalogApiError(
  err: unknown,
  locale: AdminCatalogLocale = 'ru',
): ParsedAdminCatalogError {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const lower = raw.toLowerCase();

  if (raw.includes('401') || lower.includes('unauthorized')) {
    return { kind: 'unauthorized', message: adminCatalogLabel(locale, 'errUnauthorized'), raw };
  }
  if (raw.includes('403') || lower.includes('forbidden') || lower.includes('not allowed')) {
    return { kind: 'forbidden', message: adminCatalogLabel(locale, 'errForbidden'), raw };
  }
  if (
    raw.includes('409') ||
    lower.includes('slug already exists') ||
    lower.includes('already exists')
  ) {
    return { kind: 'duplicate_slug', message: adminCatalogLabel(locale, 'errDuplicateSlug'), raw };
  }
  if (
    raw.includes('400') ||
    lower.includes('bad request') ||
    lower.includes('invalid') ||
    lower.includes('must be')
  ) {
    return { kind: 'validation', message: adminCatalogLabel(locale, 'errValidation'), raw };
  }
  if (lower.includes('fetch') || lower.includes('network') || raw.includes('500')) {
    return { kind: 'network', message: adminCatalogLabel(locale, 'errNetwork'), raw };
  }
  return { kind: 'generic', message: adminCatalogLabel(locale, 'errGeneric'), raw };
}
