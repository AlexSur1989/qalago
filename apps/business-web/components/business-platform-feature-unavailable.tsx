'use client';

import { useUi } from '@/components/locale-provider';
import Link from 'next/link';

export function BusinessPlatformFeatureUnavailable() {
  const ui = useUi();

  return (
    <div className="empty-state" style={{ maxWidth: 480 }}>
      <h2>{ui.platformFeatureUnavailableTitle}</h2>
      <p style={{ color: 'var(--text-muted)' }}>{ui.platformFeatureTeamDisabledHint}</p>
      <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 16 }}>
        {ui.ownerSectionAccessDeniedAction}
      </Link>
    </div>
  );
}
