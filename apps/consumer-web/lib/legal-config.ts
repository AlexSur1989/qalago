/**
 * Public legal page configuration (Stage 6.3 / F.7).
 * Production values must be set before store submission — see docs/legal-review-required.md
 */

export type LegalPlaceholderKey =
  | 'operatorName'
  | 'legalAddress'
  | 'legalContactEmail'
  | 'privacyContactEmail'
  | 'supportContactEmail'
  | 'legalJurisdiction';

export const LEGAL_PLACEHOLDERS: Record<LegalPlaceholderKey, string> = {
  operatorName: process.env.NEXT_PUBLIC_LEGAL_OPERATOR_NAME ?? '[LEGAL_OPERATOR_NAME]',
  legalAddress: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? '[LEGAL_ADDRESS]',
  legalContactEmail:
    process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL ?? '[LEGAL_CONTACT_EMAIL]',
  privacyContactEmail:
    process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL ?? '[PRIVACY_CONTACT_EMAIL]',
  supportContactEmail:
    process.env.NEXT_PUBLIC_SUPPORT_CONTACT_EMAIL ?? '[SUPPORT_CONTACT_EMAIL]',
  legalJurisdiction:
    process.env.NEXT_PUBLIC_LEGAL_JURISDICTION ?? '[LEGAL_JURISDICTION]',
};

export function hasUnresolvedLegalPlaceholders(): boolean {
  return Object.values(LEGAL_PLACEHOLDERS).some((value) =>
    /^\[[A-Z0-9_]+\]$/.test(value),
  );
}
