import { ReactNode } from 'react';
import Link from 'next/link';

type BackofficePageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export function BackofficePageHeader({
  title,
  description,
  backHref,
  backLabel = '← Назад',
  actions,
}: BackofficePageHeaderProps) {
  return (
    <header className="backoffice-page-header">
      {backHref ? (
        <Link href={backHref} className="backoffice-back-link">
          {backLabel}
        </Link>
      ) : null}
      <div className="backoffice-page-header-top">
        <div>
          <h1>{title}</h1>
          {description ? <p className="backoffice-page-header-desc">{description}</p> : null}
        </div>
        {actions ? <div className="backoffice-page-header-actions">{actions}</div> : null}
      </div>
    </header>
  );
}
