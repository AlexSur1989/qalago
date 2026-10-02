import {
  MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES,
  PUBLISHED_PLATFORM_LEGAL_VERSIONS,
  type MandatoryPlatformLegalDocumentType,
} from '@qalago/shared-types';
import type { PublicLegalRootSegment } from './legal-paths';

export { MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES, PUBLISHED_PLATFORM_LEGAL_VERSIONS };

const SEGMENT_BY_TYPE: Record<MandatoryPlatformLegalDocumentType, PublicLegalRootSegment> = {
  TERMS_OF_SERVICE: 'terms',
  PRIVACY_POLICY: 'privacy',
};

export function publishedLegalMetaForPage(page: PublicLegalRootSegment): {
  version: string;
  effectiveDate: string;
} | null {
  for (const type of MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES) {
    if (SEGMENT_BY_TYPE[type] === page) {
      const meta = PUBLISHED_PLATFORM_LEGAL_VERSIONS[type];
      return { version: meta.version, effectiveDate: meta.effectiveDate };
    }
  }
  return null;
}
