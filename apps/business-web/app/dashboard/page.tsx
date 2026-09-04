'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AnalyticsSummary,
  AnalyticsTrends,
  BusinessPlanStatus,
  BusinessRow,
  PromotionRow,
  ownerApi,
} from '@/lib/api';
import {
  buildRecentActions,
  comparePeriods,
  deltaClass,
  formatDelta,
  formatNumber,
  formatTodayHeader,
  profileCompletion,
} from '@/lib/business-utils';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell, useSelectedBusiness } from '@/components/business-shell';
import { ViewsChart, aggregateViewTrends } from '@/components/views-chart';

const KPI_CONFIG = [
  { key: 'VIEW_BUSINESS', label: 'Просмотры карточки' },
  { key: 'CALL_CLICK', label: 'Клики по телефону' },
  { key: 'WHATSAPP_CLICK', label: 'Клики по WhatsApp' },
  { key: 'ROUTE_CLICK', label: 'Построения маршрута' },
  { key: 'FAVORITE_ADD', label: 'Добавления в избранное' },
] as const;

export default function DashboardPage() {
  const { token, user, ready, logout } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const business = useSelectedBusiness(businesses);
  const [summary7, setSummary7] = useState<AnalyticsSummary | null>(null);
  const [summaryPrev, setSummaryPrev] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [planStatus, setPlanStatus] = useState<BusinessPlanStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    ownerApi
      .listMyBusinesses(token)
      .then(setBusinesses)
      .catch((err) => setError(String(err)));
  }, [token]);

  useEffect(() => {
    if (!token || !business) return;
    (async () => {
      try {
        const [s7, s14, t, promos, plan] = await Promise.all([
          ownerApi.analyticsSummary(token, business.id, 7),
          ownerApi.analyticsSummary(token, business.id, 14),
          ownerApi.analyticsTrends(token, business.id, 7),
          ownerApi.listPromotions(token, business.id),
          ownerApi.getBusinessPlan(token, business.id),
        ]);
        setSummary7(s7);
        setSummaryPrev({
          ...s14,
          byType: Object.fromEntries(
            Object.entries(s14.byType).map(([k, v]) => [
              k,
              v - (s7.byType[k] ?? 0),
            ]),
          ),
          total: s14.total - s7.total,
        });
        setTrends(t);
        setPromotions(promos.items.filter((p) => p.status === 'ACTIVE'));
        setPlanStatus(plan);
      } catch (err) {
        setError(String(err));
      }
    })();
  }, [token, business?.id]);

  if (!ready || !token) {
    return <p className="page-content">Загрузка…</p>;
  }

  const metrics =
    summary7 && summaryPrev ? comparePeriods(summary7, summaryPrev) : null;
  const viewSeries = trends ? aggregateViewTrends(trends.items) : [];
  const actions = business ? buildRecentActions(business, promotions) : [];
  const completion = business ? profileCompletion(business) : 0;
  const totalActions = summary7?.total ?? 0;

  return (
    <BusinessShell
      activeNav="home"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      {error && <div className="alert alert-error">{error}</div>}

      {!business ? (
        <div className="empty-state">
          <h2>Нет заведений</h2>
          <p>Зарегистрируйте заведение — после модерации оно появится в приложении QalaGo.</p>
          <Link href="/register" className="btn btn-primary" style={{ marginTop: 16 }}>
            Зарегистрировать заведение
          </Link>
        </div>
      ) : (
        <>
          <header className="page-header">
            <div>
              <h1>Добро пожаловать, {business.title}! 👋</h1>
              <p className="page-header-meta">
                {formatTodayHeader()} · У вас{' '}
                <strong>{formatNumber(summary7?.byType.VIEW_BUSINESS ?? 0)}</strong> просмотров
                и <strong>{formatNumber(totalActions)}</strong> действий за 7 дней
              </p>
            </div>
            <div className="page-actions">
              <Link href={`/business/${business.id}`} className="btn">
                👁 Предпросмотр
              </Link>
              <Link href={`/business/${business.id}`} className="btn btn-primary">
                ✏️ Редактировать профиль
              </Link>
            </div>
          </header>

          <section className="kpi-grid">
            {KPI_CONFIG.map(({ key, label }) => {
              const current = metrics?.[key]?.current ?? 0;
              const previous = metrics?.[key]?.previous ?? 0;
              const delta = formatDelta(current, previous);
              return (
                <article key={key} className="kpi-card">
                  <div className="kpi-label">{label}</div>
                  <div className="kpi-value">{formatNumber(current)}</div>
                  {delta && (
                    <div className={deltaClass(current, previous)}>{delta} за неделю</div>
                  )}
                </article>
              );
            })}
          </section>

          <div className="dashboard-grid">
            <div className="dashboard-main">
              <article className="card">
                <div className="card-header">
                  <h2>Просмотры за 7 дней</h2>
                </div>
                <ViewsChart items={viewSeries} days={7} />
              </article>

              <div className="bottom-row">
                <article className="card">
                  <div className="card-header">
                    <h2>Недавние действия</h2>
                  </div>
                  {actions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Пока нет событий</p>
                  ) : (
                    <ul className="action-list">
                      {actions.map((action) => (
                        <li key={`${action.title}-${action.time}`} className="action-item">
                          <div className="action-icon">{action.icon}</div>
                          <div className="action-text">
                            <strong>{action.title}</strong>
                            <span>{action.time}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>

                <article className="card">
                  <div className="card-header">
                    <h2>Активные акции</h2>
                    <Link href={`/business/${business.id}/promotions`} className="card-link">
                      Все акции
                    </Link>
                  </div>
                  {promotions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Нет активных акций</p>
                  ) : (
                    promotions.slice(0, 3).map((p) => (
                      <div key={p.id} className="promo-item">
                        <div className="promo-thumb">🏷️</div>
                        <div className="promo-body">
                          <strong>{p.title}</strong>
                          <p>{p.description ?? p.discountText ?? 'Без описания'}</p>
                          <span className="tag tag-success">Активна</span>
                        </div>
                      </div>
                    ))
                  )}
                  <Link
                    href={`/business/${business.id}/promotions`}
                    className="card-link"
                    style={{ display: 'inline-block', marginTop: 12 }}
                  >
                    + Создать новую акцию
                  </Link>
                </article>
              </div>
            </div>

            <aside className="dashboard-side">
              <article className="card">
                <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Статус заведения</h2>
                <span className="tag tag-success">{business.status === 'ACTIVE' ? 'Активен' : business.status}</span>
                <div className="progress-block">
                  <div className="progress-label">
                    <span>Заполненность профиля</span>
                    <strong>{completion}%</strong>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${completion}%` }} />
                  </div>
                </div>
                <Link href={`/business/${business.id}`} className="btn btn-sm" style={{ width: '100%' }}>
                  Заполнить полностью
                </Link>
              </article>

              <article className="card">
                <h2 style={{ margin: '0 0 8px', fontSize: '1rem' }}>Ваш тариф</h2>
                <strong style={{ fontSize: '1.1rem' }}>
                  {planStatus?.catalog.nameRu ?? 'Базовый'}
                </strong>
                <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {planStatus?.expiresAt
                    ? `До ${new Date(planStatus.expiresAt).toLocaleDateString('ru-RU')}`
                    : 'Бесплатный план'}
                </p>
                <ul className="plan-list">
                  {(planStatus?.catalog.features ?? [
                    'Карточка в каталоге QalaGo',
                    'До 5 фото',
                    '1 акция',
                  ]).slice(0, 3).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Link href="/plan" className="btn btn-sm" style={{ width: '100%' }}>
                  Улучшить тариф
                </Link>
              </article>

              <article className="card">
                <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Нужна помощь?</h2>
                <ul className="help-links">
                  <li><Link href="/help">Как добавить акцию?</Link></li>
                  <li><Link href="/help">Как заполнить профиль?</Link></li>
                  <li><Link href="/help">Как читать статистику?</Link></li>
                </ul>
                <Link href="/help" className="btn btn-sm" style={{ width: '100%' }}>
                  🎧 Связаться с поддержкой
                </Link>
              </article>
            </aside>
          </div>
        </>
      )}
    </BusinessShell>
  );
}
