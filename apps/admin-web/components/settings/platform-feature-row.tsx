'use client';

type PlatformFeatureRowProps = {
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  onToggle: (next: boolean) => void;
};

export function PlatformFeatureRow({
  title,
  description,
  enabled,
  disabled = false,
  loading = false,
  saving = false,
  error,
  onToggle,
}: PlatformFeatureRowProps) {
  const busy = loading || saving;

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h3 style={{ margin: '0 0 8px' }}>{title}</h3>
          <p className="muted" style={{ margin: 0 }}>
            {description}
          </p>
          {error ? <p style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</p> : null}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={enabled}
            disabled={disabled || busy}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span>{busy ? '…' : enabled ? 'Вкл.' : 'Выкл.'}</span>
        </label>
      </div>
    </div>
  );
}
