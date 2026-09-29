'use client';

import { useUi } from '@/components/locale-provider';
import Link from 'next/link';

export function BusinessSectionAccessDenied() {
  const ui = useUi();

  return (
    <div className="empty-state" style={{ maxWidth: 480 }}>
      <h2>{ui.ownerSectionAccessDeniedTitle}</h2>
      <p style={{ color: 'var(--text-muted)' }}>{ui.ownerSectionAccessDeniedHint}</p>
      <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 16 }}>
        {ui.ownerSectionAccessDeniedAction}
      </Link>
    </div>
  );
}
