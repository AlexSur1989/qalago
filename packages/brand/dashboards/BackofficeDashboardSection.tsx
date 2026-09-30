'use client';

import type { ReactNode } from 'react';

export type BackofficeDashboardSectionProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  statusSlot?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function BackofficeDashboardSection({
  title,
  description,
  actions,
  statusSlot,
  children,
  className,
}: BackofficeDashboardSectionProps) {
  return (
    <section className={`bo-dashboard-section${className ? ` ${className}` : ''}`}>
      <div className="bo-dashboard-section__header">
        <div>
          <h2 className="bo-dashboard-section__title">{title}</h2>
          {description ? <p className="bo-dashboard-section__description">{description}</p> : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      {statusSlot}
      {children}
    </section>
  );
}
