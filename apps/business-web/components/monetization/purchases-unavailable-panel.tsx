'use client';

import Link from 'next/link';
import { useLocale } from '@/components/locale-provider';
import { monetizationPurchasesDisabledNotice } from '@/lib/platform-monetization-ui';

type PurchasesUnavailablePanelProps = {
  backHref?: string;
  backLabel?: string;
};

/** Read-only state for direct URLs when monetization purchases are disabled (LAUNCH/DISABLED). */
export function PurchasesUnavailablePanel({
  backHref = '/monetization',
  backLabel,
}: PurchasesUnavailablePanelProps) {
  const locale = useLocale();
  return (
    <section className="form-card" style={{ maxWidth: 640 }} role="status">
      <p style={{ margin: 0 }}>{monetizationPurchasesDisabledNotice(locale)}</p>
      {backHref ? (
        <Link href={backHref} className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
          {backLabel ?? '←'}
        </Link>
      ) : null}
    </section>
  );
}
