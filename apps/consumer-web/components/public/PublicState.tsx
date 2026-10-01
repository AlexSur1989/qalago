import type { ReactNode } from 'react';

type PublicEmptyStateProps = {
  title?: string;
  message: string;
  action?: ReactNode;
};

export function PublicEmptyState({ title, message, action }: PublicEmptyStateProps) {
  return (
    <div className="public-state public-state--empty" role="status">
      {title ? <p className="public-state__title">{title}</p> : null}
      <p className="public-state__message">{message}</p>
      {action ? <div className="public-state__action">{action}</div> : null}
    </div>
  );
}

export function PublicPageLoading() {
  return (
    <div className="public-state public-state--loading" role="status" aria-live="polite">
      <div className="public-skeleton public-skeleton--title" />
      <div className="public-skeleton public-skeleton--line" />
      <div className="public-skeleton public-skeleton--line public-skeleton--short" />
    </div>
  );
}
