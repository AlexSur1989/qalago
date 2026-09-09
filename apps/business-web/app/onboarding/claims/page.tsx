'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { OwnershipClaimRow, ownerApi } from '@/lib/api';
import { OnboardingShell } from '@/components/onboarding-shell';
import { useAuth } from '@/lib/use-auth';
import { claimStatusLabel, mapOnboardingError } from '@/lib/onboarding-utils';

export default function OnboardingClaimsPage() {
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
      .catch((err: unknown) => setError(mapOnboardingError(String(err))))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelClaim(id: string) {
    if (!token || !window.confirm('Отменить заявку?')) return;
    setMutatingId(id);
    setError(null);
    try {
      await ownerApi.cancelOwnershipClaim(token, id);
      load();
    } catch (err: unknown) {
      setError(mapOnboardingError(String(err)));
    } finally {
      setMutatingId(null);
    }
  }

  return (
    <OnboardingShell title="Подтверждение прав" subtitle="Заявки на владение существующим бизнесом.">
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p>Загрузка…</p>}
      {!loading && items.length === 0 && (
        <div className="empty-state">
          <p>Заявок на подтверждение пока нет.</p>
          <Link href="/onboarding/search" className="btn btn-primary">
            Найти свой бизнес
          </Link>
        </div>
      )}
      {!loading && items.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          {items.map((item) => (
            <li key={item.id} className="card card-muted">
              <strong>{item.business?.title ?? 'Бизнес'}</strong>
              <p className="muted" style={{ margin: '4px 0' }}>
                {claimStatusLabel(item.status)}
              </p>
              {item.rejectionReason && <p>Причина: {item.rejectionReason}</p>}
              {item.status === 'PENDING' && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  disabled={mutatingId === item.id}
                  onClick={() => cancelClaim(item.id)}
                >
                  Отменить
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="btn btn-ghost" style={{ marginTop: 16 }} onClick={load}>
        Обновить
      </button>
    </OnboardingShell>
  );
}
