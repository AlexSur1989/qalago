'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useReportPage } from '@/lib/reporting/use-report-page';
import { fetchStaffAnomalies } from '@/lib/reporting/reporting-api';
import { formatCount } from '@/lib/reporting/format';
import { ReportForbiddenState, ReportSkeleton, ReportEmptyState } from '@/components/reports/ReportStates';

type StaffAnomalySignal = {
  code: string;
  message: string;
  requiresReview: boolean;
  data?: { actorUserId?: string | null; action?: string; count?: number };
};

function anomalyTitle(code: string): string {
  switch (code) {
    case 'HIGH_ACTION_VOLUME':
      return 'Повышенный объём привилегированных действий';
    default:
      return code;
  }
}

export default function StaffAnomaliesPage() {
  const { token, user, ready, allowed } = useReportPage('staff');
  const [signals, setSignals] = useState<StaffAnomalySignal[]>([]);
  const [windowHours, setWindowHours] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !allowed) return;
    setLoading(true);
    fetchStaffAnomalies(token)
      .then((r) => {
        setWindowHours(r.windowHours ?? null);
        setSignals((r.signals ?? []) as StaffAnomalySignal[]);
      })
      .catch(() => setSignals([]))
      .finally(() => setLoading(false));
  }, [token, allowed]);

  if (!ready) return <ReportSkeleton />;
  if (!user || !allowed) return <ReportForbiddenState />;

  return (
    <div className="report-page">
      <h1>Аномалии staff</h1>
      <p className="muted">
        Детерминированные сигналы за {windowHours != null ? `${windowHours} ч` : 'окно'} — формулировка «требует
        проверки», без автоматических обвинений.
      </p>
      <Link href="/reports/staff" className="text-link">
        ← Staff
      </Link>
      {loading ? (
        <ReportSkeleton rows={3} />
      ) : signals.length ? (
        <ul className="report-anomaly-list">
          {signals.map((s, i) => {
            const actorId = s.data?.actorUserId;
            return (
              <li key={`${s.code}-${actorId ?? i}`} className="card report-anomaly-card">
                <div className="report-anomaly-card__head">
                  <strong>{anomalyTitle(s.code)}</strong>
                  {s.requiresReview ? (
                    <span className="report-badge report-badge--neutral">Требует проверки</span>
                  ) : null}
                </div>
                <p className="muted">{s.message}</p>
                {s.data?.action != null ? (
                  <p>
                    Действие: <code>{s.data.action}</code>
                    {s.data.count != null ? ` · ${formatCount(s.data.count)} за окно` : null}
                  </p>
                ) : null}
                {actorId ? (
                  <Link href={`/reports/staff/${actorId}`} className="text-link">
                    Карточка сотрудника →
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <ReportEmptyState title="Сигналов нет" hint="Недостаточно данных или порог не превышен." />
      )}
    </div>
  );
}
