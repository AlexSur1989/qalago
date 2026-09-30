'use client';

import type { KeyboardEvent } from 'react';
import { QalaIcon } from '../icons';

export type BackofficeSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  /** Visible label (visually hidden but accessible). */
  label: string;
  id?: string;
  name?: string;
  disabled?: boolean;
};

export function BackofficeSearchField({
  value,
  onChange,
  onClear,
  placeholder,
  label,
  id,
  name,
  disabled,
}: BackofficeSearchFieldProps) {
  const inputId = id ?? 'bo-table-search';

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape' && value) {
      e.preventDefault();
      onChange('');
      onClear?.();
    }
  }

  return (
    <div className="bo-table-search">
      <label htmlFor={inputId} className="bo-sr-only">
        {label}
      </label>
      <span className="bo-table-search-icon" aria-hidden>
        <QalaIcon name="search" size="sm" decorative />
      </span>
      <input
        id={inputId}
        name={name}
        type="search"
        className="bo-table-search-input"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {value ? (
        <button
          type="button"
          className="bo-table-search-clear"
          aria-label={`${label}: очистить`}
          disabled={disabled}
          onClick={() => {
            onChange('');
            onClear?.();
          }}
        >
          <QalaIcon name="close" size="sm" decorative />
        </button>
      ) : null}
    </div>
  );
}
