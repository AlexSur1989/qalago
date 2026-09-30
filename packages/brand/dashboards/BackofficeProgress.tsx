'use client';

export type BackofficeProgressProps = {
  label: string;
  value: number;
  max: number;
  valueLabel?: string;
  tone?: 'default' | 'warning' | 'danger';
};

export function BackofficeProgress({ label, value, max, valueLabel, tone = 'default' }: BackofficeProgressProps) {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.min(100, Math.round((value / safeMax) * 100));
  const fillClass =
    tone === 'danger' ? 'bo-progress__fill--danger' : tone === 'warning' ? 'bo-progress__fill--warning' : 'bo-progress__fill';

  return (
    <div className="bo-progress">
      <div className="bo-progress__label-row">
        <span>{label}</span>
        <strong>{valueLabel ?? `${value} / ${max}`}</strong>
      </div>
      <div
        className="bo-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={value}
        aria-label={label}
      >
        <div className={fillClass} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
