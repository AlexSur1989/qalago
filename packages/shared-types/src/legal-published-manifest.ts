/**
 * Canonical platform legal metadata (KZ-C.2 / 6.15L.2).
 * Content version tracks docs/legal pack; PUBLISHED status is set in DB only after validation.
 */
import {
  LEGAL_DOCUMENT_PUBLIC_PATHS,
  LEGAL_PACK_CONTENT_VERSION,
  type LegalDocumentTypeSlug,
} from './legal-requirements-manifest';

export const MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES = [
  'TERMS_OF_SERVICE',
  'PRIVACY_POLICY',
] as const;

export type MandatoryPlatformLegalDocumentType =
  (typeof MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES)[number];

export type PublishedLegalVersionMeta = {
  version: string;
  effectiveDate: string | null;
  publicPath: '/terms' | '/privacy';
};

export const PUBLISHED_PLATFORM_LEGAL_VERSIONS: Record<
  MandatoryPlatformLegalDocumentType,
  PublishedLegalVersionMeta
> = {
  TERMS_OF_SERVICE: {
    version: LEGAL_PACK_CONTENT_VERSION,
    effectiveDate: null,
    publicPath: '/terms',
  },
  PRIVACY_POLICY: {
    version: LEGAL_PACK_CONTENT_VERSION,
    effectiveDate: null,
    publicPath: '/privacy',
  },
};

export function mandatoryLegalPublicPath(
  type: MandatoryPlatformLegalDocumentType,
): '/terms' | '/privacy' {
  return PUBLISHED_PLATFORM_LEGAL_VERSIONS[type].publicPath;
}

export function legalPublicPathForType(type: LegalDocumentTypeSlug): string | null {
  return LEGAL_DOCUMENT_PUBLIC_PATHS[type];
}

export { LEGAL_PACK_CONTENT_VERSION };
