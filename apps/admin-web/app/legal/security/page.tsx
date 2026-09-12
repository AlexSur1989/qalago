'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SafeReportText } from '@/components/safe-report-text';
import { useLegalContext } from '@/components/legal/legal-layout-client';
import { legalApi, type SecurityIncidentRow } from '@/lib/legal-api';
import { canAccessGovernmentSecurity, mapLegalError } from '@/lib/legal-utils';
import { formatDateTime } from '@/lib/monetization-utils';

export default function SecurityIncidentsPage() {
  const router = useRouter();
  const { token, user } = useLegalContext();
  const [items, setItems] = useState<SecurityIncidentRow[]>([]);
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
      .listSecurityIncidents(token, { page: 1, limit: 50 })
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
        SUPER_ADMIN only · LEGAL_REVIEW_REQUIRED — уведомления регулятору / субъектам при утечках.
      </p>
      {error && <p className="error-text">{error}</p>}
      {loading && <p>Загрузка…</p>}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Обнаружен</th>
              <th>Критичность</th>
              <th>Заголовок</th>
              <th>Статус</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{formatDateTime(row.detectedAt)}</td>
                <td>{row.severity}</td>
                <td>{row.title}</td>
                <td>{row.status}</td>
                <td>
                  <SafeReportText text={row.summary} emptyLabel="—" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && (
          <p className="muted" style={{ padding: '1rem' }}>
            Инцидентов нет. API: GET /api/v1/admin/legal/security-incidents
          </p>
        )}
      </div>
    </div>
  );
}
