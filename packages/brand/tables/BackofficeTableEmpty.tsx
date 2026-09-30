'use client';

import type { ReactNode } from 'react';
import { BackofficeEmptyState } from '../states';

export type BackofficeTableEmptyProps = {
  /** True when filters/search exclude all rows but data may exist. */
  filtered?: boolean;
  emptyTitle: string;
  emptyDescription?: ReactNode;
  filteredTitle?: string;
  filteredDescription?: ReactNode;
  resetLabel?: string;
  onResetFilters?: () => void;
  icon?: Parameters<typeof BackofficeEmptyState>[0]['icon'];
};

export function BackofficeTableEmpty({
  filtered = false,
  emptyTitle,
  emptyDescription,
  filteredTitle,
  filteredDescription,
  resetLabel = 'Сбросить фильтры',
  onResetFilters,
  icon = 'empty',
}: BackofficeTableEmptyProps) {
  if (filtered) {
    return (
      <BackofficeEmptyState
        title={filteredTitle ?? emptyTitle}
        description={filteredDescription}
        icon={icon}
        density="section"
        actions={
          onResetFilters ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onResetFilters}>
              {resetLabel}
            </button>
          ) : null
        }
      />
    );
  }

  return (
    <BackofficeEmptyState
      title={emptyTitle}
      description={emptyDescription}
      icon={icon}
      density="section"
    />
  );
}
