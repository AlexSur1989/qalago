'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnalyticsDashboard, BusinessRow, ownerApi } from '@/lib/api';
import {
  actionMetricLabel,
  availablePeriodOptions,
  formatPercent,
  isLockedSection,
  lockedSectionMessage,
} from '@/lib/analytics-utils';
import { formatNumber, formatTodayHeader } from '@/lib/business-utils';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell, useSelectedBusiness } from '@/components/business-shell';
import { ViewsChart } from '@/components/views-chart';

function LockedCard({
  label,
  message,
}: {
  label: string;
  message: string;
}) {
  return (
    <article className="card analytics-locked-card">
      <div className="card-header">
        <h2>{label}</h2>
        <span className="badge badge-muted">{message}</span>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
        Раздел недоступен на текущем тарифе.
      </p>
      <Link href="/plan" className="btn btn-primary btn-sm">
        Улучшить тариф
      </Link>
    </article>
  );
}

export default function StatisticsPage() {
  const { token, user, ready, logout } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const business = useSelectedBusiness(businesses);
  const [days, setDays] = useState(30);
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    ownerApi.listMyBusinesses(token).then(setBusinesses).catch((err) => setError(String(err)));
  }, [token]);

  useEffect(() => {
    if (!token || !business) return;
    setLoading(true);
    ownerApi
      .analyticsDashboard(token, business.id, days)
      .then((data) => {
        setDashboard(data);
        setError(null);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [token, business?.id, days]);

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

  const periodOptions = dashboard
    ? availablePeriodOptions(dashboard.capabilities.maxDays)
    : [7, 30];

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
              <h1>Статистика бизнеса</h1>
              <p className="page-header-meta">
                {formatTodayHeader()} · {business.title}
              </p>
              {dashboard && (
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{dashboard.headline}</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link href="/monetization/campaigns" className="btn btn-ghost">
                Статистика рекламы →
              </Link>
              <Link href="/dashboard" className="btn btn-ghost">
                ← Обзор
              </Link>
            </div>
          </header>

          <div className="btn-row" style={{ marginBottom: 16 }}>
            {periodOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`btn ${days === option ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setDays(option)}
              >
                {option} дн
              </button>
            ))}
          </div>

          {loading && !dashboard ? (
            <p>Загрузка статистики…</p>
          ) : dashboard ? (
            <>
              <section className="kpi-grid">
                <article className="kpi-card">
                  <div className="kpi-label">Просмотры</div>
                  <div className="kpi-value">{formatNumber(dashboard.overview.views)}</div>
                </article>
                {dashboard.actions ? (
                  <>
                    <article className="kpi-card">
                      <div className="kpi-label">Действия клиентов</div>
                      <div className="kpi-value">{formatNumber(dashboard.actions.total)}</div>
                    </article>
                    {(
                      [
                        'calls',
                        'whatsapp',
                        'routes',
                        'website',
                        'instagram',
                        'favorites',
                        'promotionViews',
                      ] as const
                    ).map((key) => (
                      <article key={key} className="kpi-card">
                        <div className="kpi-label">{actionMetricLabel(key)}</div>
                        <div className="kpi-value">{formatNumber(dashboard.actions![key])}</div>
                      </article>
                    ))}
                  </>
                ) : (
                  <LockedCard
                    label="Действия клиентов"
                    message={lockedSectionMessage(dashboard, 'actions') ?? 'Доступно с BASIC'}
                  />
                )}
              </section>

              <article className="card" style={{ marginTop: 16 }}>
                <div className="card-header">
                  <h2>Просмотры за {dashboard.effectiveRange.days} дней</h2>
                </div>
                <ViewsChart items={dashboard.trends.views} days={dashboard.effectiveRange.days} />
              </article>

              {dashboard.trends.actions ? (
                <article className="card" style={{ marginTop: 16 }}>
                  <div className="card-header">
                    <h2>Действия клиентов за {dashboard.effectiveRange.days} дней</h2>
                  </div>
                  <ViewsChart
                    items={dashboard.trends.actions}
                    days={dashboard.effectiveRange.days}
                  />
                </article>
              ) : null}

              {dashboard.sources && dashboard.sources.length > 0 ? (
                <article className="card" style={{ marginTop: 16 }}>
                  <div className="card-header">
                    <h2>Источники просмотров</h2>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Источник</th>
                        <th>Просмотры</th>
                        <th>Доля</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.sources.map((row) => (
                        <tr key={row.source}>
                          <td>{row.label}</td>
                          <td>{formatNumber(row.views)}</td>
                          <td>{row.share}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </article>
              ) : dashboard.sourcesStatus === 'DEFERRED' ? (
                <article className="card" style={{ marginTop: 16 }}>
                  <div className="card-header">
                    <h2>Источники просмотров</h2>
                    <span className="badge badge-muted">Скоро</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Детальная атрибуция источников появится после внедрения отслеживания
                    referrer. Сейчас доли по источникам не показываются, чтобы не вводить в
                    заблуждение.
                  </p>
                </article>
              ) : isLockedSection(dashboard, 'sources') ? (
                <div style={{ marginTop: 16 }}>
                  <LockedCard
                    label="Источники"
                    message={lockedSectionMessage(dashboard, 'sources') ?? 'Доступно с PREMIUM'}
                  />
                </div>
              ) : dashboard.capabilities.trafficSources ? (
                <article className="card" style={{ marginTop: 16 }}>
                  <div className="card-header">
                    <h2>Источники просмотров</h2>
                  </div>
                  <p style={{ color: 'var(--text-muted)' }}>Недостаточно данных</p>
                </article>
              ) : null}

              {dashboard.conversion ? (
                <article className="card" style={{ marginTop: 16 }}>
                  <div className="card-header">
                    <h2>Конверсия</h2>
                  </div>
                  <p>
                    {formatNumber(dashboard.conversion.actions)} действий из{' '}
                    {formatNumber(dashboard.conversion.views)} просмотров —{' '}
                    <strong>{dashboard.conversion.rate}%</strong>
                  </p>
                </article>
              ) : isLockedSection(dashboard, 'conversion') ? (
                <div style={{ marginTop: 16 }}>
                  <LockedCard
                    label="Конверсия"
                    message={lockedSectionMessage(dashboard, 'conversion') ?? 'Доступно с PREMIUM'}
                  />
                </div>
              ) : null}

              {dashboard.comparison ? (
                <article className="card" style={{ marginTop: 16 }}>
                  <div className="card-header">
                    <h2>Сравнение периодов</h2>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Метрика</th>
                        <th>Текущий период</th>
                        <th>Предыдущий</th>
                        <th>Изменение</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.comparison.metrics.map((row) => (
                        <tr key={row.key}>
                          <td>{row.label}</td>
                          <td>{formatNumber(row.current)}</td>
                          <td>{formatNumber(row.previous)}</td>
                          <td>{formatPercent(row.deltaPercent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </article>
              ) : isLockedSection(dashboard, 'comparison') ? (
                <div style={{ marginTop: 16 }}>
                  <LockedCard
                    label="Сравнение периодов"
                    message={lockedSectionMessage(dashboard, 'comparison') ?? 'Доступно с PREMIUM'}
                  />
                </div>
              ) : null}

              {dashboard.popularTimes ? (
                <article className="card" style={{ marginTop: 16 }}>
                  <div className="card-header">
                    <h2>Популярные дни и часы</h2>
                  </div>
                  <div className="kpi-grid">
                    {dashboard.popularTimes.byWeekday.map((row) => (
                      <article key={row.weekday} className="kpi-card">
                        <div className="kpi-label">{row.label}</div>
                        <div className="kpi-value">{formatNumber(row.count)}</div>
                      </article>
                    ))}
                  </div>
                </article>
              ) : isLockedSection(dashboard, 'popularTimes') ? (
                <div style={{ marginTop: 16 }}>
                  <LockedCard
                    label="Популярные часы"
                    message={lockedSectionMessage(dashboard, 'popularTimes') ?? 'Доступно с VIP'}
                  />
                </div>
              ) : null}

              {dashboard.benchmark ? (
                <article className="card" style={{ marginTop: 16 }}>
                  <div className="card-header">
                    <h2>Сравнение с категорией · {dashboard.benchmark.categoryTitle}</h2>
                  </div>
                  {dashboard.benchmark.status === 'INSUFFICIENT_DATA' ? (
                    <p style={{ color: 'var(--text-muted)' }}>
                      {dashboard.benchmark.message ??
                        'Недостаточно данных для сравнения с категорией.'}
                    </p>
                  ) : (
                    <>
                      <p>
                        Просмотры: {formatNumber(dashboard.benchmark.businessViews ?? 0)} vs
                        среднее {formatNumber(dashboard.benchmark.categoryAvgViews ?? 0)}
                      </p>
                      <p>
                        Действия: {formatNumber(dashboard.benchmark.businessActions ?? 0)} vs
                        среднее {formatNumber(dashboard.benchmark.categoryAvgActions ?? 0)}
                      </p>
                    </>
                  )}
                </article>
              ) : isLockedSection(dashboard, 'benchmark') ? (
                <div style={{ marginTop: 16 }}>
                  <LockedCard
                    label="Сравнение с категорией"
                    message={lockedSectionMessage(dashboard, 'benchmark') ?? 'Доступно с VIP'}
                  />
                </div>
              ) : null}

              {dashboard.recommendations ? (
                <section style={{ marginTop: 16 }}>
                  <h2>Рекомендации</h2>
                  {dashboard.recommendations.map((item) => (
                    <article key={item.id} className="card" style={{ marginTop: 8 }}>
                      <h3>{item.title}</h3>
                      <p style={{ color: 'var(--text-muted)' }}>{item.body}</p>
                    </article>
                  ))}
                </section>
              ) : isLockedSection(dashboard, 'recommendations') ? (
                <div style={{ marginTop: 16 }}>
                  <LockedCard
                    label="Рекомендации"
                    message={lockedSectionMessage(dashboard, 'recommendations') ?? 'Доступно с VIP'}
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </BusinessShell>
  );
}
