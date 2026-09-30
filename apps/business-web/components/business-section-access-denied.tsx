'use client';

import { useUi } from '@/components/locale-provider';
import { BackofficeAccessDenied } from '@qalago/brand/states';
import Link from 'next/link';

export function BusinessSectionAccessDenied() {
  const ui = useUi();

  return (
    <BackofficeAccessDenied
      title={ui.ownerSectionAccessDeniedTitle}
      description={ui.ownerSectionAccessDeniedHint}
      action={
        <Link href="/dashboard" className="btn btn-primary">
          {ui.ownerSectionAccessDeniedAction}
        </Link>
      }
    />
  );
}
