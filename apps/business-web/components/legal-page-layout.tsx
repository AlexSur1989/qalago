import Link from 'next/link';
import { ReactNode } from 'react';
import { publicLegalUrl } from '@/lib/legal-config';

type LegalPageLayoutProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
  draftNotice?: boolean;
};

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
  draftNotice = true,
}: LegalPageLayoutProps) {
  return (
    <main className="legal-page">
      <div className="legal-page-inner">
        <header className="legal-page-header">
          <Link href="/" className="legal-page-brand">
            QalaGo
          </Link>
          <h1>{title}</h1>
          <p className="legal-page-meta">Обновлено: {lastUpdated}</p>
          {draftNotice && (
            <p className="legal-page-draft">
              Черновик на основе фактического поведения приложения. Требуется проверка
              юриста перед публикацией в production.
            </p>
          )}
        </header>
        <article className="legal-page-content">{children}</article>
        <footer className="legal-page-footer">
          <nav aria-label="Юридические документы">
            <Link href="/privacy">Политика конфиденциальности</Link>
            <Link href="/terms">Условия использования</Link>
            <Link href="/account-deletion">Удаление аккаунта</Link>
          </nav>
          <p className="legal-page-footer-note">
            Production URL: {publicLegalUrl('/privacy')} (после развёртывания на qalago.kz)
          </p>
        </footer>
      </div>
    </main>
  );
}
