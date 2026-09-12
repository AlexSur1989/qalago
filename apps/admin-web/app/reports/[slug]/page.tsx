'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/use-auth';
import { fetchReport } from '@/lib/reports-api';
import { canViewReport, type ReportNavId } from '@/lib/report-rbac';

const SLUGS: ReportNavId[] = [
  'users',
  'businesses',
  'cities',
  'categories',
  'search',
  'activity',
  'reviews',
  'promotions',
  'ads',
  'plans',
  'moderation',
  'finance',
  'staff',
  'audit',
  'security',
  'system',
];

export default function ReportDetailPage() {
  const params = useParams();
  const slug = String(params.slug ?? '') as ReportNavId;
  const router = useRouter();
  const { token, user } = useAuth();
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (!SLUGS.includes(slug) || !canViewReport(user.role, slug)) {
      router.replace('/reports');
    }
  }, [user, slug, router]);

  useEffect(() => {
    if (!token || !user || !canViewReport(user.role, slug)) return;
    fetchReport(token, slug)
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [token, user, slug]);

  if (!user || !canViewReport(user.role, slug)) {
    return null;
  }

  return (
    <div className="page-stack">
      <h1>Отчёт: {slug}</h1>
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
