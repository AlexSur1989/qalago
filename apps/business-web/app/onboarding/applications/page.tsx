'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BusinessApplicationRow, ownerApi } from '@/lib/api';
import { OnboardingShell } from '@/components/onboarding-shell';
import { useAuth } from '@/lib/use-auth';
import { applicationStatusLabel, mapOnboardingError } from '@/lib/onboarding-utils';

export default function OnboardingApplicationsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<BusinessApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    ownerApi
      .listMyApplications(token)
      .then(setItems)
      .catch((err: unknown) => setError(mapOnboardingError(String(err))))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <OnboardingShell title="Мои заявки" subtitle="Заявки на добавление нового бизнеса.">
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p>Загрузка…</p>}
      {!loading && items.length === 0 && (
        <div className="empty-state">
          <p>Заявок пока нет.</p>
          <Link href="/onboarding/apply" className="btn btn-primary">
            Добавить бизнес
          </Link>
        </div>
      )}
      {!loading && items.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          {items.map((item) => (
            <li key={item.id} className="card card-muted">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <strong>{item.title}</strong>
                  <p className="muted" style={{ margin: '4px 0' }}>
                    {item.city?.nameRu} · {applicationStatusLabel(item.status)}
                  </p>
                  {item.rejectionReason && (
                    <p style={{ margin: '4px 0' }}>Причина: {item.rejectionReason}</p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(item.status === 'DRAFT' || item.status === 'REJECTED') && (
                    <Link href={`/onboarding/apply?id=${item.id}`} className="btn btn-sm btn-primary">
                      {item.status === 'REJECTED' ? 'Исправить' : 'Продолжить'}
                    </Link>
                  )}
                  {item.status === 'APPROVED' && item.approvedBusiness && (
                    <Link href="/dashboard" className="btn btn-sm">
                      Кабинет
                    </Link>
                  )}
                </div>
              </div>
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
