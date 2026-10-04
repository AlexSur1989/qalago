import { LegalDocumentType, LegalLocale } from '@prisma/client';
import { allLegalPackSeedTypes, loadLegalPackMarkdown } from './legal-pack-loader';

const PLACEHOLDER_PATTERNS = [
  /\[OPERATOR_LEGAL_NAME\]/,
  /\[BIN\]/,
  /\[LEGAL_ADDRESS\]/,
  /\[POSTAL_ADDRESS\]/,
  /\[SUPPORT_EMAIL\]/,
  /\[PRIVACY_EMAIL\]/,
  /\[PHONE\]/,
  /\[WEBSITE\]/,
  /\[REGISTRATION_DETAILS_IF_REQUIRED\]/,
  /\[REFUND_POLICY[^\]]*\]/,
];

export type LegalPublicationValidationResult =
  | { ok: true }
  | { ok: false; reasons: string[] };

export function findUnresolvedLegalPlaceholders(content: string): string[] {
  const hits: string[] = [];
  for (const re of PLACEHOLDER_PATTERNS) {
    if (re.test(content)) {
      hits.push(re.source);
    }
  }
  return hits;
}

export function validateLegalDocumentContentForPublish(content: string): LegalPublicationValidationResult {
  const reasons: string[] = [];
  if (!content.trim()) {
    reasons.push('EMPTY_CONTENT');
  }
  const placeholders = findUnresolvedLegalPlaceholders(content);
  if (placeholders.length) {
    reasons.push(`UNRESOLVED_PLACEHOLDERS:${placeholders.join(',')}`);
  }
  return reasons.length ? { ok: false, reasons } : { ok: true };
}

/** Ensures KK counterpart file exists for pack-backed types (dev/seed guard). */
export function assertLegalPackLocalePair(type: LegalDocumentType, locale: LegalLocale): void {
  if (!allLegalPackSeedTypes().includes(type as never)) {
    return;
  }
  loadLegalPackMarkdown(type as never, locale);
}
