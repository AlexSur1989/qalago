'use client';

import { QalaIcon } from '../icons';

export type BackofficePaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Optional total row count for meta line. */
  totalItems?: number;
  pageSize?: number;
  prevLabel?: string;
  nextLabel?: string;
  disabled?: boolean;
  className?: string;
};

export function BackofficePagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  prevLabel = 'Назад',
  nextLabel = 'Вперёд',
  disabled = false,
  className,
}: BackofficePaginationProps) {
  if (totalPages <= 1) return null;

  const metaParts = [`Страница ${page} из ${totalPages}`];
  if (totalItems != null && pageSize != null) {
    metaParts.push(`· ${totalItems} записей`);
  }

  return (
    <nav
      className={`bo-table-pagination${className ? ` ${className}` : ''}`}
      aria-label="Навигация по страницам"
    >
      <button
        type="button"
        className="btn btn-sm btn-secondary bo-table-pagination-btn"
        disabled={disabled || page <= 1}
        aria-label={prevLabel}
        onClick={() => onPageChange(page - 1)}
      >
        <QalaIcon name="chevron-left" size="sm" decorative />
        {prevLabel}
      </button>
      <span className="bo-table-pagination-meta" aria-current="page">
        {metaParts.join(' ')}
      </span>
      <button
        type="button"
        className="btn btn-sm btn-secondary bo-table-pagination-btn"
        disabled={disabled || page >= totalPages}
        aria-label={nextLabel}
        onClick={() => onPageChange(page + 1)}
      >
        {nextLabel}
        <QalaIcon name="chevron-right" size="sm" decorative />
      </button>
    </nav>
  );
}
