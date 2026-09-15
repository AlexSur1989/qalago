'use client';

import { useEffect, useMemo } from 'react';
import { UI_LABELS } from '@/lib/locale';
import { readClientLocale } from '@/lib/locale-client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const labels = useMemo(() => UI_LABELS[readClientLocale()], []);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="page">
      <h1>{labels.errorTitle}</h1>
      <p style={{ color: 'var(--muted)' }}>{labels.errorMessage}</p>
      <button type="button" onClick={() => reset()}>
        {labels.retry}
      </button>
    </main>
  );
}
