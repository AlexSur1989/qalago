import Link from 'next/link';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { legalPageUrl } from '@/lib/legal-links';
import { UI_LABELS, type AppLocale } from '@/lib/locale';

export function PublicShell({
  locale,
  children,
}: {
  locale: AppLocale;
  children: React.ReactNode;
}) {
  const labels = UI_LABELS[locale];

  return (
    <div className="public-shell">
      <header className="public-shell__header">
        <div className="public-shell__brand">
          <Link href="/" className="public-shell__logo" aria-label={labels.navHome}>
            QalaGo
          </Link>
        </div>
        <nav className="public-shell__nav" aria-label={labels.mainNavAria}>
          <Link href="/">{labels.navHome}</Link>
          <Link href="/categories">{labels.categories}</Link>
        </nav>
        <LocaleSwitcher locale={locale} labels={labels} />
      </header>
      <div className="public-shell__content">{children}</div>
      <footer className="public-shell__footer">
        <nav className="public-shell__legal" aria-label={labels.footerLegalAria}>
          <a href={legalPageUrl('privacy')}>{labels.footerPrivacy}</a>
          <a href={legalPageUrl('terms')}>{labels.footerTerms}</a>
          <a href={legalPageUrl('accountDeletion')}>{labels.footerAccountDeletion}</a>
          <a href={legalPageUrl('help')}>{labels.footerSupport}</a>
        </nav>
        <p className="public-shell__copyright">{labels.footerCopyright}</p>
      </footer>
    </div>
  );
}
