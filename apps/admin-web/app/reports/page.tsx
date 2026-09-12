'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/use-auth';
import { fetchReport } from '@/lib/reports-api';
import { canViewReport } from '@/lib/report-rbac';

export default function ReportsOverviewPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user || !canViewReport(user.role, 'overview')) return;
    fetchReport(token, 'overview')
      .then((res) => setData(res as Record<string, unknown>))
      .catch((e) => setError(String(e)));
  }, [token, user]);

  if (!user || !canViewReport(user.role, 'overview')) {
    return <p className="tag tag-danger">Нет доступа к обзору</p>;
  }

  return (
    <div className="page-stack">
      <h1>Обзор платформы</h1>
      {error ? <p className="tag tag-danger">{error}</p> : null}
      {data ? (
        <pre className="code-block" style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className="muted">Загрузка…</p>
      )}
    </div>
  );
}
