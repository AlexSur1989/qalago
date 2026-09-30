'use client';

import type { BackofficeLoadingDensity } from './types';

export type BackofficeLoadingStateProps = {
  density?: BackofficeLoadingDensity;
  label?: string;
  className?: string;
};

export function BackofficeLoadingState({
  density = 'section',
  label,
  className,
}: BackofficeLoadingStateProps) {
  return (
    <div
      className={`bo-loading bo-loading--${density}${className ? ` ${className}` : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="bo-loading-spinner" aria-hidden />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
