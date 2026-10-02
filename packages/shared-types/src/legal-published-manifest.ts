/**
 * Canonical published platform legal versions (KZ-C.2).
 * Consumer Web F.7 bodies and backend LegalDocument seed must stay aligned with these values.
 * Does not imply counsel approval — see docs/legal-review-required.md.
 */
export const MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES = [
  'TERMS_OF_SERVICE',
  'PRIVACY_POLICY',
] as const;

export type MandatoryPlatformLegalDocumentType =
  (typeof MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES)[number];

export type PublishedLegalVersionMeta = {
  version: string;
  effectiveDate: string;
  publicPath: '/terms' | '/privacy';
};

export const PUBLISHED_PLATFORM_LEGAL_VERSIONS: Record<
  MandatoryPlatformLegalDocumentType,
  PublishedLegalVersionMeta
> = {
  TERMS_OF_SERVICE: {
    version: '2026-09-10',
    effectiveDate: '2026-09-10',
    publicPath: '/terms',
  },
  PRIVACY_POLICY: {
    version: '2026-09-10',
    effectiveDate: '2026-09-10',
    publicPath: '/privacy',
  },
};

export function mandatoryLegalPublicPath(
  type: MandatoryPlatformLegalDocumentType,
): '/terms' | '/privacy' {
  return PUBLISHED_PLATFORM_LEGAL_VERSIONS[type].publicPath;
}
