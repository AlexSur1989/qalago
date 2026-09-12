'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useReportPage } from '@/lib/reporting/use-report-page';
import { fetchStaffMember } from '@/lib/reporting/reporting-api';
import { formatDateTime } from '@/lib/reporting/format';
import { ReportForbiddenState, ReportSkeleton } from '@/components/reports/ReportStates';

export default function StaffMemberReportPage() {
  const params = useParams();
  const userId = String(params.userId ?? '');
  const { token, user, ready, allowed } = useReportPage('staff');
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!token || !allowed || !userId) return;
    fetchStaffMember(token, userId)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [token, allowed, userId]);

  if (!ready) return <ReportSkeleton />;
  if (!user || !allowed) return <ReportForbiddenState />;

  const staff = detail?.staff as Record<string, unknown> | undefined;
  const timeline = (detail?.auditTimeline as Record<string, unknown>[]) ?? [];

  return (
    <div className="report-page">
      <Link href="/reports/staff" className="text-link">
        ← Staff
      </Link>
      <h1>Staff: {String((staff?.user as { name?: string })?.name ?? userId)}</h1>
      <p className="muted">
        MFA:{' '}
        {String(staff?.mfaStatus ?? 'NOT_CONFIGURED') === 'ENABLED'
          ? 'включена'
          : String(staff?.mfaStatus) === 'ENROLLMENT_REQUIRED'
            ? 'требуется настройка'
            : 'не настроена'}
      </p>
      {!detail ? (
        <ReportSkeleton rows={4} />
      ) : (
        <>
          <div className="card">
            <p>
              Роль: <strong>{String(staff?.staffRole)}</strong>
            </p>
            <p>Активен: {staff?.isActive ? 'да' : 'нет'}</p>
            <p>Активные сессии: {String(staff?.activeSessions ?? '—')}</p>
          </div>
          <h2>Аудит</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Время</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((row) => (
                <tr key={String(row.id)}>
                  <td>{formatDateTime(row.createdAt as string)}</td>
                  <td>{String(row.action)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
