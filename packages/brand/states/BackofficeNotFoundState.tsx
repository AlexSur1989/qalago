'use client';

import type { ReactNode } from 'react';
import { QalaIcon } from '../icons';

export type BackofficeNotFoundStateProps = {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  density?: 'page' | 'section';
  className?: string;
};

export function BackofficeNotFoundState({
  title = 'Страница не найдена',
  description = 'Проверьте адрес или вернитесь в рабочий раздел.',
  action,
  density = 'page',
  className,
}: BackofficeNotFoundStateProps) {
  return (
    <div
      className={`bo-not-found bo-state-panel bo-state-panel--${density}${className ? ` ${className}` : ''}`}
      role="status"
    >
      <div className="bo-empty-state" style={{ margin: '0 auto' }}>
        <div className="bo-empty-state-icon" aria-hidden>
          <QalaIcon name="empty" size="lg" decorative />
        </div>
        <h2 className="bo-empty-state-title">{title}</h2>
        {description ? <p className="bo-empty-state-description">{description}</p> : null}
        {action ? <div className="bo-empty-state-actions">{action}</div> : null}
      </div>
    </div>
  );
}
