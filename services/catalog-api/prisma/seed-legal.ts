import {
  LegalDocumentStatus,
  LegalDocumentType,
  LegalLocale,
  PrismaClient,
} from '@prisma/client';
import {
  MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES,
  PUBLISHED_PLATFORM_LEGAL_VERSIONS,
} from '@qalago/shared-types';

const LEGAL_SEED_CONTENT_RU: Record<
  (typeof MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES)[number],
  { title: string; content: string }
> = {
  TERMS_OF_SERVICE: {
    title: 'Условия использования QalaGo',
    content:
      'Canonical presentation: Consumer Web /terms (F.7). LEGAL_REVIEW_REQUIRED — do not treat this DB stub as counsel-approved text.',
  },
  PRIVACY_POLICY: {
    title: 'Политика конфиденциальности QalaGo',
    content:
      'Canonical presentation: Consumer Web /privacy (F.7). LEGAL_REVIEW_REQUIRED — do not treat this DB stub as counsel-approved text.',
  },
};

export async function seedPublishedPlatformLegalDocuments(prisma: PrismaClient) {
  for (const type of MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES) {
    const meta = PUBLISHED_PLATFORM_LEGAL_VERSIONS[type];
    const copy = LEGAL_SEED_CONTENT_RU[type];
    await prisma.legalDocument.upsert({
      where: {
        type_version_locale: {
          type: type as LegalDocumentType,
          version: meta.version,
          locale: LegalLocale.RU,
        },
      },
      create: {
        type: type as LegalDocumentType,
        version: meta.version,
        locale: LegalLocale.RU,
        title: copy.title,
        content: copy.content,
        status: LegalDocumentStatus.PUBLISHED,
        requiresReacceptance: true,
        effectiveAt: new Date(`${meta.effectiveDate}T00:00:00.000Z`),
        publishedAt: new Date(),
      },
      update: {
        title: copy.title,
        content: copy.content,
        status: LegalDocumentStatus.PUBLISHED,
        requiresReacceptance: true,
        effectiveAt: new Date(`${meta.effectiveDate}T00:00:00.000Z`),
      },
    });
  }
}
