'use client';

import type { ReactNode } from 'react';
import { QalaIcon } from '../icons';

export type BackofficeFeatureUnavailableProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  density?: 'page' | 'section';
  className?: string;
};

/** Platform/feature flag off — not the same as permission denied (UXA.9). */
export function BackofficeFeatureUnavailable({
  title,
  description,
  action,
  density = 'section',
  className,
}: BackofficeFeatureUnavailableProps) {
  return (
    <div
      className={`bo-feature-unavailable bo-state-panel bo-state-panel--${density}${className ? ` ${className}` : ''}`}
      role="status"
    >
      <div className="bo-empty-state" style={{ margin: 0, maxWidth: 'none', textAlign: 'left', padding: 0 }}>
        <div className="bo-empty-state-icon" aria-hidden>
          <QalaIcon name="settings" size="lg" decorative />
        </div>
        <h2 className="bo-empty-state-title">{title}</h2>
        {description ? <p className="bo-empty-state-description">{description}</p> : null}
        {action ? <div className="bo-empty-state-actions" style={{ justifyContent: 'flex-start' }}>{action}</div> : null}
      </div>
    </div>
  );
}
