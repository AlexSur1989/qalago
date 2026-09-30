'use client';

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type ControlSize = 'sm' | 'md' | 'lg';

function controlClass(invalid: boolean | undefined, size: ControlSize, extra?: string) {
  const sizeClass = size === 'sm' ? ' bo-control--sm' : size === 'lg' ? ' bo-control--lg' : '';
  return `bo-control${sizeClass}${invalid ? ' bo-control--invalid' : ''}${extra ? ` ${extra}` : ''}`;
}

export type BackofficeInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  inputSize?: ControlSize;
};

export function BackofficeInput({ invalid, inputSize = 'md', className, ...props }: BackofficeInputProps) {
  return <input className={controlClass(invalid, inputSize, className)} aria-invalid={invalid || undefined} {...props} />;
}

export type BackofficeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function BackofficeTextarea({ invalid, className, ...props }: BackofficeTextareaProps) {
  return <textarea className={controlClass(invalid, 'md', className)} aria-invalid={invalid || undefined} {...props} />;
}

export type BackofficeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
  inputSize?: ControlSize;
};

export function BackofficeSelect({ invalid, inputSize = 'md', className, children, ...props }: BackofficeSelectProps) {
  return (
    <select className={controlClass(invalid, inputSize, className)} aria-invalid={invalid || undefined} {...props}>
      {children}
    </select>
  );
}

export type BackofficeCheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  id?: string;
};

export function BackofficeCheckbox({
  label,
  checked,
  onChange,
  disabled,
  helperText,
  error,
  id,
}: BackofficeCheckboxProps) {
  const inputId = id ?? `bo-check-${label.replace(/\s+/g, '-').slice(0, 24)}`;
  return (
    <div className="bo-field">
      <label className={`bo-check${disabled ? ' bo-check--disabled' : ''}`} htmlFor={inputId}>
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label}</span>
      </label>
      {helperText ? <p className="bo-field-helper">{helperText}</p> : null}
      {error ? <p className="bo-field-error" role="alert">{error}</p> : null}
    </div>
  );
}

export type BackofficeRadioProps = {
  name: string;
  label: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
};

export function BackofficeRadio({ name, label, value, checked, onChange, disabled, id }: BackofficeRadioProps) {
  const inputId = id ?? `${name}-${value}`;
  return (
    <label className={`bo-radio${disabled ? ' bo-radio--disabled' : ''}`} htmlFor={inputId}>
      <input
        id={inputId}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
      />
      <span>{label}</span>
    </label>
  );
}
