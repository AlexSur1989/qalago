'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SafeReportText } from '@/components/safe-report-text';
import { useLegalContext } from '@/components/legal/legal-layout-client';
import { legalApi, type GovernmentRequestRow } from '@/lib/legal-api';
import { canAccessGovernmentSecurity, mapLegalError } from '@/lib/legal-utils';
import { formatDateTime } from '@/lib/monetization-utils';
import { useState } from 'react';

export default function GovernmentRequestsPage() {
  const router = useRouter();
  const { token, user } = useLegalContext();
  const [items, setItems] = useState<GovernmentRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canAccessGovernmentSecurity(user.role)) {
      router.replace('/legal/documents');
    }
  }, [user.role, router]);

  useEffect(() => {
    if (!canAccessGovernmentSecurity(user.role)) return;
    setLoading(true);
    legalApi
      .listGovernmentRequests(token, { page: 1, limit: 50 })
      .then((res) => setItems(res.items))
      .catch((err: unknown) => setError(mapLegalError(String(err))))
      .finally(() => setLoading(false));
  }, [token, user.role]);

  if (!canAccessGovernmentSecurity(user.role)) {
    return null;
  }

  return (
    <div className="card">
      <p className="muted" style={{ marginTop: 0 }}>
        SUPER_ADMIN only · LEGAL_REVIEW_REQUIRED — регламент ответов на запросы госорганов.
      </p>
      {error && <p className="error-text">{error}</p>}
      {loading && <p>Загрузка…</p>}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Получено</th>
              <th>Орган</th>
              <th>Тип</th>
              <th>Статус</th>
              <th>Основание</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{formatDateTime(row.receivedAt)}</td>
                <td>{row.requestingAuthority}</td>
                <td>{row.requestType}</td>
                <td>{row.status}</td>
                <td>
                  <SafeReportText text={row.legalBasisNote} emptyLabel="—" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && (
          <p className="muted" style={{ padding: '1rem' }}>
            Записей нет. API: GET /api/v1/admin/legal/government-requests
          </p>
        )}
      </div>
    </div>
  );
}
