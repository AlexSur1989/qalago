'use client';

import { useEffect, useMemo } from 'react';
import { PublicEmptyState } from '@/components/public/PublicState';
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
    <div className="page">
      <PublicEmptyState
        title={labels.errorTitle}
        message={labels.errorMessage}
        action={
          <button type="button" className="public-btn public-btn--primary" onClick={() => reset()}>
            {labels.retry}
          </button>
        }
      />
    </div>
  );
}
