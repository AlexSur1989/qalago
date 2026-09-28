import type { Metadata } from 'next';
import { LEGAL_PLACEHOLDERS } from '@/lib/legal-config';
import { HELP_UI } from '@/lib/help-ui';
import { getServerLocale } from '@/lib/locale-server';
import { metadataForHelpPage } from '@/lib/seo/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return metadataForHelpPage(locale);
}

export default async function HelpPage() {
  const locale = await getServerLocale();
  const ui = HELP_UI[locale];
  const supportEmail = LEGAL_PLACEHOLDERS.supportContactEmail;

  return (
    <div className="legal-page">
      <div className="legal-page-inner">
        <header className="legal-page-header">
          <h1>{ui.pageHeading}</h1>
          <p className="legal-page-meta">{ui.tagline}</p>
        </header>
        <article className="legal-page-content">
          <h2>{ui.faqTitle}</h2>
          {ui.faq.map((item) => (
            <details key={item.q} className="faq-item" style={{ marginBottom: 12 }}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}

          <h2>{ui.needSupport}</h2>
          <p>{ui.supportBody}</p>
          <p>
            {ui.supportContactLabel}: {supportEmail}
          </p>
          <p className="legal-page-draft" style={{ marginTop: 16 }}>
            {ui.supportPlaceholderNote}
          </p>
        </article>
      </div>
    </div>
  );
}
