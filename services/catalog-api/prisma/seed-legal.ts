import {
  LegalDocumentStatus,
  LegalDocumentType,
  LegalLocale,
  PrismaClient,
} from '@prisma/client';
import {
  allLegalPackSeedTypes,
  legalPackSeedVersion,
  loadLegalPackDocument,
} from '../src/modules/safety/legal-pack-loader';

const LOCALES: LegalLocale[] = [LegalLocale.RU, LegalLocale.KK];

/**
 * Seeds docs/legal pack into LegalDocument rows as DRAFT (6.15L.2).
 * Does NOT publish — counsel/operator approval required.
 */
export async function seedDraftLegalDocumentPack(prisma: PrismaClient) {
  const version = legalPackSeedVersion();
  for (const type of allLegalPackSeedTypes()) {
    for (const locale of LOCALES) {
      const { title, content: markdown } = loadLegalPackDocument(type, locale);
      await prisma.legalDocument.upsert({
        where: {
          type_version_locale: {
            type: type as LegalDocumentType,
            version,
            locale,
          },
        },
        create: {
          type: type as LegalDocumentType,
          version,
          locale,
          title,
          content: markdown,
          status: LegalDocumentStatus.DRAFT,
          requiresReacceptance: true,
          effectiveAt: null,
          publishedAt: null,
        },
        update: {
          title,
          content: markdown,
          status: LegalDocumentStatus.DRAFT,
          requiresReacceptance: true,
        },
      });
    }
  }
}

/** @deprecated Use seedDraftLegalDocumentPack — published stubs removed from default seed. */
export async function seedPublishedPlatformLegalDocuments(prisma: PrismaClient) {
  await seedDraftLegalDocumentPack(prisma);
}
