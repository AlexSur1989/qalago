'use client';

import type { ReactNode } from 'react';
import { QalaIcon } from '../icons';
import type { QalaBackofficeIconName } from '../icons/types';

export type BackofficeEmptyStateProps = {
  title: string;
  description?: ReactNode;
  icon?: QalaBackofficeIconName;
  actions?: ReactNode;
  className?: string;
  density?: 'page' | 'section';
};

export function BackofficeEmptyState({
  title,
  description,
  icon = 'empty',
  actions,
  className,
  density = 'section',
}: BackofficeEmptyStateProps) {
  return (
    <div
      className={`bo-empty-state bo-state-panel bo-state-panel--${density}${className ? ` ${className}` : ''}`}
      role="status"
    >
      <div className="bo-empty-state-icon" aria-hidden>
        <QalaIcon name={icon} size="lg" decorative />
      </div>
      <h2 className="bo-empty-state-title">{title}</h2>
      {description ? <p className="bo-empty-state-description">{description}</p> : null}
      {actions ? <div className="bo-empty-state-actions">{actions}</div> : null}
    </div>
  );
}
