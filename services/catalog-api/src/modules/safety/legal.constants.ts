import { LegalDocumentType } from '@prisma/client';
import { MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES } from '@qalago/shared-types';

/** Platform Terms/Privacy require tracked acceptance (KZ-C.2). */
export const MANDATORY_ACCEPTANCE_LEGAL_TYPES: readonly LegalDocumentType[] =
  MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES as unknown as LegalDocumentType[];
