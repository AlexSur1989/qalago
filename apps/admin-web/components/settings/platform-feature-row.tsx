'use client';

import { BackofficeBadge } from '@qalago/brand/badges';
import { BackofficeSwitch } from '@qalago/brand/forms';
import { featureFlagPresentation } from '@qalago/brand/status';

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
  const flag = featureFlagPresentation(enabled);

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <BackofficeSwitch
        label={title}
        description={description}
        checked={enabled}
        disabled={disabled}
        loading={busy}
        onCheckedChange={onToggle}
      />
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {busy ? <span className="muted">Сохранение…</span> : null}
        {!busy ? <BackofficeBadge label={flag.label} tone={flag.tone} size="compact" /> : null}
        {error ? <p className="bo-field-error" role="alert">{error}</p> : null}
      </div>
    </div>
  );
}
