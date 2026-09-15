import Link from 'next/link';
import { ReactNode } from 'react';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { UI_LABELS } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';
import { publicLegalUrl } from '@/lib/legal-config';

type LegalPageLayoutProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
  draftNotice?: boolean;
};

export async function LegalPageLayout({
  title,
  lastUpdated,
  children,
  draftNotice = true,
}: LegalPageLayoutProps) {
  const locale = await getServerLocale();
  const ui = UI_LABELS[locale];

  return (
    <main className="legal-page">
      <div className="legal-page-inner">
        <header className="legal-page-header">
          <div className="legal-page-header-row">
            <Link href="/" className="legal-page-brand">
              QalaGo
            </Link>
            <LocaleSwitcher locale={locale} labels={ui} />
          </div>
          <h1>{title}</h1>
          <p className="legal-page-meta">
            {ui.legalUpdatedLabel}: {lastUpdated}
          </p>
          {draftNotice && <p className="legal-page-draft">{ui.legalDraftNotice}</p>}
        </header>
        <article className="legal-page-content">{children}</article>
        <footer className="legal-page-footer">
          <nav aria-label={ui.__affb23}>
            <Link href="/privacy">{ui.legalPrivacyLink}</Link>
            <Link href="/terms">{ui.legalTermsLink}</Link>
            <Link href="/account-deletion">{ui.legalAccountDeletionLink}</Link>
          </nav>
          <p className="legal-page-footer-note">
            {ui.legalProductionUrlNote.replace('{url}', publicLegalUrl('/privacy'))}
          </p>
        </footer>
      </div>
    </main>
  );
}
