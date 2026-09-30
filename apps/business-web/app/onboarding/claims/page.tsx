'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { OwnershipClaimRow, ownerApi } from '@/lib/api';
import { OnboardingShell } from '@/components/onboarding-shell';
import { useAuth } from '@/lib/use-auth';
import { backofficeConfirm } from '@qalago/brand/confirm';
import { claimStatusLabel, mapOnboardingError } from '@/lib/onboarding-utils';
import { onboardingRejectionReasonLabel } from '@/lib/presentation';

export default function OnboardingClaimsPage() {
  const locale = useLocale();
  const ui = useUi();

  const { token } = useAuth();
  const [items, setItems] = useState<OwnershipClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    ownerApi
      .listMyClaims(token)
      .then((res) => setItems(res.items))
      .catch((err: unknown) => setError(mapOnboardingError(locale, String(err))))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelClaim(id: string) {
    if (!token || !(await backofficeConfirm({ title: ui.__c50c8f, variant: 'warning' }))) return;
    setMutatingId(id);
    setError(null);
    try {
      await ownerApi.cancelOwnershipClaim(token, id);
      load();
    } catch (err: unknown) {
      setError(mapOnboardingError(locale, String(err)));
    } finally {
      setMutatingId(null);
    }
  }

  return (
    <OnboardingShell title={ui.__618c5e} subtitle={ui.____ad8d65}>
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p>{ui.text_89d69a}</p>}
      {!loading && items.length === 0 && (
        <div className="empty-state">
          <p>{ui.____2eeb9c}</p>
          <Link href="/onboarding/search" className="btn btn-primary">{ui.___612420}</Link>
        </div>
      )}
      {!loading && items.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          {items.map((item) => (
            <li key={item.id} className="card card-muted">
              <strong>{item.business?.title ?? ui.text_1c5009}</strong>
              <p className="muted" style={{ margin: '4px 0' }}>
                {claimStatusLabel(locale, item.status)}
              </p>
              {item.rejectionReason && (
                <p>
                  {onboardingRejectionReasonLabel(locale)} {item.rejectionReason}
                </p>
              )}
              {item.status === 'PENDING' && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  disabled={mutatingId === item.id}
                  onClick={() => cancelClaim(item.id)}
                >
                  {ui.text_cancelAction}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="btn btn-ghost" style={{ marginTop: 16 }} onClick={load}>{ui.text_dbe544}</button>
    </OnboardingShell>
  );
}
