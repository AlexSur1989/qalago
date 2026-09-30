'use client';

import type { ReactNode } from 'react';

export type BackofficeSummaryCardProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function BackofficeSummaryCard({
  title,
  description,
  actions,
  children,
  className,
}: BackofficeSummaryCardProps) {
  return (
    <article className={`bo-summary-card${className ? ` ${className}` : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h3 className="bo-summary-card__title">{title}</h3>
        {actions}
      </div>
      {description ? (
        <p className="bo-dashboard-section__description" style={{ marginBottom: 12 }}>
          {description}
        </p>
      ) : null}
      {children}
    </article>
  );
}
