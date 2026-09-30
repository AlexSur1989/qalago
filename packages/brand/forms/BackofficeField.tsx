'use client';

import type { ReactNode } from 'react';
import { useId } from 'react';

export type BackofficeFieldProps = {
  label: string;
  required?: boolean;
  helperText?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  className?: string;
};

export function BackofficeField({
  label,
  required,
  helperText,
  error,
  htmlFor,
  children,
  className,
}: BackofficeFieldProps) {
  const autoId = useId();
  const id = htmlFor ?? autoId;
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`bo-field${className ? ` ${className}` : ''}`}>
      <label className="bo-field-label" htmlFor={id}>
        {label}
        {required ? <span className="bo-field-required" aria-hidden="true"> *</span> : null}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {helperText ? (
        <p className="bo-field-helper" id={helperId}>
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p className="bo-field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function BackofficeHelperText({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p className="bo-field-helper" id={id}>
      {children}
    </p>
  );
}

export function BackofficeFieldError({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p className="bo-field-error" id={id} role="alert">
      {children}
    </p>
  );
}
