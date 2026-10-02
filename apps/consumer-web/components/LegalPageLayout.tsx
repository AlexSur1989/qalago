import Link from 'next/link';
import { ReactNode } from 'react';
import { getServerLocale } from '@/lib/locale-server';
import { LEGAL_UI, legalPageHeading } from '@/lib/legal-ui';
import { getConsumerWebOrigin } from '@/lib/seo/canonical';
import { publicLegalPath, type PublicLegalRootSegment } from '@/lib/legal-paths';

type LegalPageLayoutProps = {
  page: PublicLegalRootSegment;
  lastUpdated: string;
  documentVersion?: string;
  children: ReactNode;
  draftNotice?: boolean;
};

export async function LegalPageLayout({
  page,
  lastUpdated,
  documentVersion,
  children,
  draftNotice = true,
}: LegalPageLayoutProps) {
  const locale = await getServerLocale();
  const ui = LEGAL_UI[locale];
  const title = legalPageHeading(locale, page);
  const origin = getConsumerWebOrigin();
  const sampleProductionUrl = `${origin}${publicLegalPath('privacy')}`;

  return (
    <div className="legal-page">
      <div className="legal-page-inner">
        <header className="legal-page-header">
          <h1>{title}</h1>
          <p className="legal-page-meta">
            {ui.legalUpdatedLabel}: {lastUpdated}
            {documentVersion ? ` · v${documentVersion}` : null}
          </p>
          {draftNotice && <p className="legal-page-draft">{ui.legalDraftNotice}</p>}
        </header>
        <article className="legal-page-content">{children}</article>
        <footer className="legal-page-footer">
          <nav aria-label={ui.legalNavAria}>
            <Link href={publicLegalPath('privacy')}>{ui.legalPrivacyLink}</Link>
            <Link href={publicLegalPath('terms')}>{ui.legalTermsLink}</Link>
            <Link href={publicLegalPath('account-deletion')}>
              {ui.legalAccountDeletionLink}
            </Link>
          </nav>
          <p className="legal-page-footer-note">
            {ui.legalProductionUrlNote.replace('{url}', sampleProductionUrl)}
          </p>
        </footer>
      </div>
    </div>
  );
}
