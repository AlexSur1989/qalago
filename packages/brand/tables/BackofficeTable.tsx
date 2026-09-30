'use client';

import type { HTMLAttributes, ReactNode, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

export type BackofficeTableDensity = 'normal' | 'compact';

export type BackofficeTableContainerProps = HTMLAttributes<HTMLDivElement>;

export function BackofficeTableContainer({ className, ...props }: BackofficeTableContainerProps) {
  return <div className={`bo-table-wrap${className ? ` ${className}` : ''}`} {...props} />;
}

export type BackofficeTableProps = TableHTMLAttributes<HTMLTableElement> & {
  density?: BackofficeTableDensity;
};

export function BackofficeTable({ density = 'normal', className, ...props }: BackofficeTableProps) {
  return (
    <table
      className={`bo-table bo-table--${density}${className ? ` ${className}` : ''}`}
      {...props}
    />
  );
}

export function BackofficeTableHead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}

export function BackofficeTableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function BackofficeTableRow(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} />;
}

export type BackofficeTableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  variant?: 'default' | 'numeric' | 'actions' | 'truncate' | 'mono';
};

export function BackofficeTableCell({ variant = 'default', className, ...props }: BackofficeTableCellProps) {
  const variantClass =
    variant === 'numeric'
      ? 'bo-table-cell--numeric'
      : variant === 'actions'
        ? 'bo-table-cell--actions'
        : variant === 'truncate'
          ? 'bo-table-cell--truncate'
          : variant === 'mono'
            ? 'bo-table-cell--mono'
            : '';
  return <td className={`${variantClass}${className ? ` ${className}` : ''}`} {...props} />;
}

export type BackofficeTableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement> & {
  variant?: 'default' | 'numeric' | 'actions';
};

export function BackofficeTableHeaderCell({
  variant = 'default',
  className,
  scope = 'col',
  ...props
}: BackofficeTableHeaderCellProps) {
  const variantClass =
    variant === 'numeric'
      ? 'bo-table-cell--numeric'
      : variant === 'actions'
        ? 'bo-table-cell--actions'
        : '';
  return <th scope={scope} className={`${variantClass}${className ? ` ${className}` : ''}`} {...props} />;
}

export type BackofficeTableToolbarProps = {
  start?: ReactNode;
  end?: ReactNode;
  meta?: ReactNode;
  className?: string;
};

export function BackofficeTableToolbar({ start, end, meta, className }: BackofficeTableToolbarProps) {
  return (
    <div className={`bo-table-toolbar${className ? ` ${className}` : ''}`}>
      <div className="bo-table-toolbar-start">{start}</div>
      {end ? <div className="bo-table-toolbar-end">{end}</div> : null}
      {meta ? <p className="bo-table-toolbar-meta">{meta}</p> : null}
    </div>
  );
}

export type BackofficeFilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function BackofficeFilterChip({ label, active, onClick }: BackofficeFilterChipProps) {
  return (
    <button type="button" className="bo-filter-chip" aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  );
}

export type BackofficeFilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  id?: string;
};

export function BackofficeFilterSelect({ label, value, onChange, options, id }: BackofficeFilterSelectProps) {
  const selectId = id ?? `bo-filter-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <label className="bo-table-filter-label" htmlFor={selectId}>
      {label}
      <select id={selectId} className="filter-select city-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value || '__all'} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
