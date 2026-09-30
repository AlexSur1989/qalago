'use client';

import type { ReactNode } from 'react';
import { QalaIcon } from '../icons';
import { BackofficeAlert } from './BackofficeAlert';

export type BackofficeErrorStateProps = {
  title?: string;
  message: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  backAction?: ReactNode;
  density?: 'page' | 'section';
  className?: string;
};

export function BackofficeErrorState({
  title = 'Не удалось загрузить данные',
  message,
  onRetry,
  retryLabel = 'Повторить',
  retrying = false,
  backAction,
  density = 'section',
  className,
}: BackofficeErrorStateProps) {
  return (
    <div
      className={`bo-error-state bo-state-panel bo-state-panel--${density}${className ? ` ${className}` : ''}`}
    >
      <BackofficeAlert
        variant="danger"
        title={title}
        message={message}
        actions={
          <>
            {onRetry ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onRetry}
                disabled={retrying}
                aria-busy={retrying}
              >
                {!retrying ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <QalaIcon name="refresh" size="sm" decorative />
                    {retryLabel}
                  </span>
                ) : (
                  retryLabel
                )}
              </button>
            ) : null}
            {backAction}
          </>
        }
      />
    </div>
  );
}
