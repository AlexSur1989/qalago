'use client';

import type { ReactNode } from 'react';
import { BackofficeErrorState } from '../states';
import { BackofficeLoadingState } from '../states';
import { BackofficeEmptyState } from '../states';

export type BackofficeChartContainerProps = {
  title: string;
  description?: ReactNode;
  legend?: ReactNode;
  loading?: boolean;
  error?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  onRetry?: () => void;
  children?: ReactNode;
  className?: string;
};

export function BackofficeChartContainer({
  title,
  description,
  legend,
  loading,
  error,
  emptyTitle,
  emptyDescription,
  onRetry,
  children,
  className,
}: BackofficeChartContainerProps) {
  return (
    <div className={`bo-chart-container${className ? ` ${className}` : ''}`}>
      <div className="bo-chart-container__header">
        <h3 className="bo-chart-container__title">{title}</h3>
        {description ? <p className="bo-chart-container__description">{description}</p> : null}
        {legend}
      </div>
      {loading ? <BackofficeLoadingState density="section" label="…" /> : null}
      {!loading && error ? (
        <BackofficeErrorState message={String(error)} onRetry={onRetry} />
      ) : null}
      {!loading && !error && emptyTitle && !children ? (
        <BackofficeEmptyState title={emptyTitle} description={emptyDescription} density="section" icon="analytics" />
      ) : null}
      {!loading && !error && children}
    </div>
  );
}
