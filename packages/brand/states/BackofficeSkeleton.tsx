'use client';

import type { BackofficeSkeletonVariant } from './types';

const VARIANT_CLASS: Record<BackofficeSkeletonVariant, string> = {
  line: 'bo-skeleton-line',
  title: 'bo-skeleton-title',
  card: 'bo-skeleton-card',
  'table-row': 'bo-skeleton-table-row',
  kpi: 'bo-skeleton-kpi',
};

export type BackofficeSkeletonProps = {
  variant?: BackofficeSkeletonVariant;
  count?: number;
  className?: string;
};

export function BackofficeSkeleton({
  variant = 'line',
  count = 1,
  className,
}: BackofficeSkeletonProps) {
  const cls = VARIANT_CLASS[variant];
  return (
    <div className={`bo-skeleton-stack${className ? ` ${className}` : ''}`} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bo-skeleton ${cls}`} />
      ))}
    </div>
  );
}
