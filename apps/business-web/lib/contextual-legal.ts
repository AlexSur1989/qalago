import {
  legalApi,
  type LegalPendingDocument,
  type LegalRequirementContext,
} from './api';
import type { AppLocale } from './locale';
import {
  contextualLegalAcceptFailed,
  contextualLegalConfirmRequired,
  contextualLegalUnavailable,
  contextualLegalVersionStale,
} from './contextual-legal-copy';

export type { LegalRequirementContext };

function apiLocale(locale: AppLocale): 'RU' | 'KK' {
  return locale === 'kk' ? 'KK' : 'RU';
}

function acceptanceSourceForContext(
  context: LegalRequirementContext,
): 'CHECKOUT' | 'BUSINESS_APPLICATION' {
  return context === 'BUSINESS_APPLICATION' ? 'BUSINESS_APPLICATION' : 'CHECKOUT';
}

export function parseContextualLegalError(locale: AppLocale, err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('LEGAL_VERSION_STALE') || raw.includes('Legal document version is stale')) {
    return contextualLegalVersionStale(locale);
  }
  if (raw.includes('LEGAL_DOCUMENT_NOT_PUBLISHED') || raw.includes('not published')) {
    return contextualLegalUnavailable(locale);
  }
  if (raw.includes('LEGAL_ACCEPTANCE_REQUIRED')) {
    return contextualLegalConfirmRequired(locale);
  }
  try {
    const parsed = JSON.parse(raw) as { code?: string; message?: string };
    if (parsed.code === 'LEGAL_VERSION_STALE') return contextualLegalVersionStale(locale);
    if (parsed.code === 'LEGAL_DOCUMENT_NOT_PUBLISHED') return contextualLegalUnavailable(locale);
    if (parsed.code === 'LEGAL_ACCEPTANCE_REQUIRED') return contextualLegalConfirmRequired(locale);
  } catch {
    /* not JSON */
  }
  return contextualLegalAcceptFailed(locale);
}

export async function fetchContextualLegalRequired(
  token: string,
  locale: AppLocale,
  context: LegalRequirementContext,
) {
  return legalApi.fetchRequired(token, context, apiLocale(locale));
}

export async function acceptContextualLegalPending(
  token: string,
  locale: AppLocale,
  context: LegalRequirementContext,
  pending: LegalPendingDocument[],
): Promise<void> {
  await legalApi.acceptRequired(token, pending, apiLocale(locale), {
    context,
    acceptanceSource: acceptanceSourceForContext(context),
  });
}

/** Persist pending contextual documents when user confirmed checkbox; no-op if none pending. */
export async function ensureContextualLegalAccepted(
  token: string,
  locale: AppLocale,
  context: LegalRequirementContext,
  checkboxConfirmed: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const required = await fetchContextualLegalRequired(token, locale, context);
  const pending = required.pendingAcceptance ?? [];
  if (!required.acceptanceRequired || pending.length === 0) {
    return { ok: true };
  }
  if (!checkboxConfirmed) {
    return { ok: false, message: contextualLegalConfirmRequired(locale) };
  }
  try {
    await acceptContextualLegalPending(token, locale, context, pending);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: parseContextualLegalError(locale, err) };
  }
}
