import { LegalPageLayout } from '@/components/LegalPageLayout';
import { LegalMarkdownBody } from '@/lib/legal-markdown';
import {
  legalPackDocumentVersion,
  loadLegalPackBody,
  loadLegalPackTitle,
  type LegalPackPageKey,
} from '@/lib/legal-pack-loader';
import { getServerLocale } from '@/lib/locale-server';
import type { PublicLegalRootSegment } from '@/lib/legal-paths';
import type { ExtendedLegalRootSegment } from '@/lib/legal-paths';

type LegalPackPageProps = {
  packKey: LegalPackPageKey;
  layoutPage: PublicLegalRootSegment | ExtendedLegalRootSegment;
};

export async function LegalPackPage({ packKey, layoutPage }: LegalPackPageProps) {
  const locale = await getServerLocale();
  const body = loadLegalPackBody(packKey, locale);
  const title = loadLegalPackTitle(packKey, locale);
  const version = legalPackDocumentVersion();

  return (
    <LegalPageLayout
      page={layoutPage}
      lastUpdated="2026-10-03"
      documentVersion={version}
      headingOverride={title}
    >
      <LegalMarkdownBody markdown={body} />
    </LegalPageLayout>
  );
}
