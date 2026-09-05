'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AnalyticsSummary,
  AnalyticsTrends,
  BusinessRow,
  ownerApi,
} from '@/lib/api';
import {
  comparePeriods,
  deltaClass,
  formatDelta,
  formatNumber,
  formatTodayHeader,
} from '@/lib/business-utils';
import { businessAnalyticsLabel } from '@/lib/owner-utils';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell, useSelectedBusiness } from '@/components/business-shell';
import { ViewsChart, aggregateViewTrends } from '@/components/views-chart';

const KPI_KEYS = [
  'VIEW_BUSINESS',
  'CALL_CLICK',
  'WHATSAPP_CLICK',
  'ROUTE_CLICK',
  'FAVORITE_ADD',
] as const;

export default function StatisticsPage() {
  const { token, user, ready, logout } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const business = useSelectedBusiness(businesses);
  const [summary7, setSummary7] = useState<AnalyticsSummary | null>(null);
  const [summaryPrev, setSummaryPrev] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    ownerApi.listMyBusinesses(token).then(setBusinesses).catch((err) => setError(String(err)));
  }, [token]);

  useEffect(() => {
    if (!token || !business) return;
    (async () => {
      try {
        const [s7, s14, t] = await Promise.all([
          ownerApi.analyticsSummary(token, business.id, 7),
          ownerApi.analyticsSummary(token, business.id, 14),
          ownerApi.analyticsTrends(token, business.id, 7),
        ]);
        setSummary7(s7);
        setSummaryPrev({
          ...s14,
          byType: Object.fromEntries(
            Object.entries(s14.byType).map(([k, v]) => [k, v - (s7.byType[k] ?? 0)]),
          ),
          total: s14.total - s7.total,
        });
        setTrends(t);
      } catch (err) {
        setError(String(err));
      }
    })();
  }, [token, business?.id]);

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

  const metrics =
    summary7 && summaryPrev ? comparePeriods(summary7, summaryPrev) : null;
  const viewSeries = trends ? aggregateViewTrends(trends.items) : [];

  return (
    <BusinessShell
      activeNav="stats"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      {error && <div className="alert alert-error">{error}</div>}

      {!business ? (
        <div className="empty-state">
          <h2>Нет заведений</h2>
          <p>Зарегистрируйте заведение, чтобы видеть статистику.</p>
          <Link href="/register" className="btn btn-primary" style={{ marginTop: 16 }}>
            Зарегистрировать заведение
          </Link>
        </div>
      ) : (
        <>
          <header className="page-header">
            <div>
              <h1>Статистика</h1>
              <p className="page-header-meta">
                {formatTodayHeader()} · {business.title}
              </p>
            </div>
            <Link href="/dashboard" className="btn btn-ghost">
              ← Обзор
            </Link>
          </header>

          <section className="kpi-grid">
            {KPI_KEYS.map((key) => {
              const current = metrics?.[key]?.current ?? 0;
              const previous = metrics?.[key]?.previous ?? 0;
              const delta = formatDelta(current, previous);
              return (
                <article key={key} className="kpi-card">
                  <div className="kpi-label">{businessAnalyticsLabel(key)}</div>
                  <div className="kpi-value">{formatNumber(current)}</div>
                  {delta && (
                    <div className={deltaClass(current, previous)}>{delta} за неделю</div>
                  )}
                </article>
              );
            })}
          </section>

          <article className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <h2>Просмотры карточки за 7 дней</h2>
            </div>
            <ViewsChart items={viewSeries} days={7} />
          </article>

          <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Подробная аналитика рекламных кампаний — в разделе{' '}
            <Link href="/monetization/campaigns">Мои кампании</Link>.
          </p>
        </>
      )}
    </BusinessShell>
  );
}
