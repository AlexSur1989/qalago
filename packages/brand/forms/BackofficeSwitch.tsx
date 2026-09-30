'use client';

import type { ReactNode } from 'react';

export type BackofficeSwitchProps = {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
};

export function BackofficeSwitch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  loading = false,
  id,
}: BackofficeSwitchProps) {
  const switchId = id ?? `bo-switch-${label.replace(/\s+/g, '-').slice(0, 24)}`;
  const descId = description ? `${switchId}-desc` : undefined;
  const busy = disabled || loading;

  return (
    <div className="bo-switch-row">
      <div className="bo-switch-copy">
        <p className="bo-switch-title" id={`${switchId}-label`}>
          {label}
        </p>
        {description ? (
          <p className="bo-switch-description" id={descId}>
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        id={switchId}
        className="bo-switch"
        aria-checked={checked}
        aria-labelledby={`${switchId}-label`}
        aria-describedby={descId}
        aria-busy={loading || undefined}
        disabled={busy}
        onClick={() => onCheckedChange(!checked)}
      >
        <span className="bo-switch-thumb" aria-hidden />
      </button>
    </div>
  );
}
