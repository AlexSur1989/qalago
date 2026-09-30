'use client';

import { useUi } from '@/components/locale-provider';
import { BackofficeFeatureUnavailable } from '@qalago/brand/states';
import Link from 'next/link';

export function BusinessPlatformFeatureUnavailable() {
  const ui = useUi();

  return (
    <BackofficeFeatureUnavailable
      title={ui.platformFeatureUnavailableTitle}
      description={ui.platformFeatureTeamDisabledHint}
      action={
        <Link href="/dashboard" className="btn btn-primary">
          {ui.ownerSectionAccessDeniedAction}
        </Link>
      }
    />
  );
}
