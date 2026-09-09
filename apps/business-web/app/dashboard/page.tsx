'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  BusinessPlanStatus,
  MonetizationCampaign,
  PromotionRow,
  ownerApi,
} from '@/lib/api';
import {
  buildFooterNavItems,
  buildMainNavItems,
  canViewPayments,
  filterNavByAccess,
} from '@/lib/business-access';
import { parseApiError } from '@/lib/monetization-utils';
import {
  buildRecentActions,
  formatNumber,
  formatTodayHeader,
  profileCompletion,
  statusLabel,
} from '@/lib/business-utils';
import { buildPlanUsageSummary } from '@/lib/owner-utils';
import { campaignStatusLabel, monetizationStatusClass } from '@/lib/monetization-utils';
import { useBusinessAccess } from '@/lib/use-business-access';
import { BusinessShell } from '@/components/business-shell';

export default function DashboardPage() {
  const { token, user, ready, logout, business, access, businesses } = useBusinessAccess();
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [planStatus, setPlanStatus] = useState<BusinessPlanStatus | null>(null);
  const [campaigns, setCampaigns] = useState<MonetizationCampaign[]>([]);
  const [summary7, setSummary7] = useState<{ total: number; views: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mainNav = useMemo(
    () => filterNavByAccess(buildMainNavItems(), access),
    [access],
  );
  const footerNav = useMemo(
    () => filterNavByAccess(buildFooterNavItems(), access),
    [access],
  );

  useEffect(() => {
    if (!token || !business) return;
    (async () => {
      try {
        const [s7, promos, camps, plan] = await Promise.all([
          ownerApi.analyticsSummary(token, business.id, 7),
          ownerApi.listPromotions(token, business.id),
          ownerApi.listMonetizationCampaigns(token, business.id),
          canViewPayments(access)
            ? ownerApi.getBusinessPlan(token, business.id)
            : Promise.resolve(null),
        ]);
        setSummary7({
          total: s7.total,
          views: s7.byType.VIEW_BUSINESS ?? 0,
        });
        setPromotions(promos.items.filter((p) => p.status === 'ACTIVE'));
        setPlanStatus(plan);
        setCampaigns(camps);
      } catch (err) {
        setError(parseApiError(err));
      }
    })();
  }, [token, business?.id, access]);

  if (!ready || !token) {
    return <p className="page-content">Загрузка…</p>;
  }

  const actions = business ? buildRecentActions(business, promotions) : [];
  const completion = business ? profileCompletion(business) : 0;
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE');
  const pendingModeration = campaigns.filter((c) => c.status === 'PENDING_MODERATION');
  const usageLines = planStatus ? buildPlanUsageSummary(planStatus) : [];

  return (
    <BusinessShell
      activeNav="home"
      business={business}
      businesses={businesses}
      mainNav={mainNav}
      footerNav={footerNav}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      {error && <div className="alert alert-error">{error}</div>}

      {!business ? (
        <div className="empty-state">
          <h2>У вас пока нет бизнеса в QalaGo</h2>
          <p>Найдите существующий бизнес или добавьте новый — заявка будет проверена модератором.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <Link href="/onboarding/search" className="btn btn-primary">
              Найти свой бизнес
            </Link>
            <Link href="/onboarding/apply" className="btn">
              Добавить бизнес
            </Link>
          </div>
        </div>
      ) : (
        <>
          <header className="page-header">
            <div>
              <h1>Обзор</h1>
              <p className="page-header-meta">
                {business.title} · {statusLabel(business.status)} · {formatTodayHeader()}
              </p>
            </div>
          </header>

          <section className="kpi-grid" style={{ marginBottom: 16 }}>
            <article className="kpi-card">
              <div className="kpi-label">Просмотры за 7 дней</div>
              <div className="kpi-value">{formatNumber(summary7?.views ?? 0)}</div>
              <Link href="/statistics" className="card-link" style={{ fontSize: '0.85rem' }}>
                Подробная статистика →
              </Link>
            </article>
            <article className="kpi-card">
              <div className="kpi-label">Действия за 7 дней</div>
              <div className="kpi-value">{formatNumber(summary7?.total ?? 0)}</div>
            </article>
            <article className="kpi-card">
              <div className="kpi-label">Активные кампании</div>
              <div className="kpi-value">{activeCampaigns.length}</div>
              {pendingModeration.length > 0 && (
                <span className="tag tag-warning" style={{ marginTop: 8 }}>
                  {pendingModeration.length} на модерации
                </span>
              )}
            </article>
            <article className="kpi-card">
              <div className="kpi-label">Тариф</div>
              <div className="kpi-value" style={{ fontSize: '1.25rem' }}>
                {planStatus?.catalog.nameRu ?? '—'}
              </div>
              {planStatus?.expiresAt && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  до {new Date(planStatus.expiresAt).toLocaleDateString('ru-RU')}
                </span>
              )}
            </article>
          </section>

          <section className="quick-actions-grid" style={{ marginBottom: 16 }}>
            <Link href={`/business/${business.id}`} className="btn">
              ✏️ Редактировать бизнес
            </Link>
            <Link href={`/business/${business.id}/menu`} className="btn">
              ➕ Товар или услуга
            </Link>
            <Link href={`/business/${business.id}/promotions`} className="btn">
              🏷️ Создать акцию
            </Link>
            <Link href="/monetization" className="btn btn-primary">
              📣 Запустить рекламу
            </Link>
          </section>

          <div className="dashboard-grid">
            <div className="dashboard-main">
              {planStatus && (
                <article className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <h2>Использование тарифа</h2>
                    <Link href="/plan" className="card-link">
                      Тариф
                    </Link>
                  </div>
                  <ul className="plan-list">
                    {usageLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  {planStatus.entitlements?.overLimitNotice && (
                    <p className="alert" style={{ marginTop: 12, fontSize: '0.9rem' }}>
                      {planStatus.entitlements.overLimitNotice}
                    </p>
                  )}
                </article>
              )}

              <article className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <h2>Рекламные кампании</h2>
                  <Link href="/monetization/campaigns" className="card-link">
                    Все кампании
                  </Link>
                </div>
                {campaigns.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                    Нет кампаний.{' '}
                    <Link href="/monetization">Запустить рекламу</Link>
                  </p>
                ) : (
                  <ul className="action-list">
                    {campaigns.slice(0, 5).map((c) => (
                      <li key={c.id} className="action-item">
                        <div className="action-icon">📣</div>
                        <div className="action-text">
                          <strong>{c.product?.name ?? 'Кампания'}</strong>
                          <span>
                            <span className={monetizationStatusClass(c.status)}>
                              {campaignStatusLabel(c.status)}
                            </span>
                            {' · '}
                            <Link href={`/monetization/campaigns/${c.id}`}>Подробнее</Link>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
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
                </article>
              </div>
            </div>

            <aside className="dashboard-side">
              <article className="card">
                <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Профиль</h2>
                <div className="progress-block">
                  <div className="progress-label">
                    <span>Заполненность</span>
                    <strong>{completion}%</strong>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${completion}%` }} />
                  </div>
                </div>
                <Link href={`/business/${business.id}`} className="btn btn-sm" style={{ width: '100%' }}>
                  Мой бизнес
                </Link>
              </article>

              <article className="card">
                <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Быстрые ссылки</h2>
                <ul className="help-links">
                  <li>
                    <Link href={`/business/${business.id}/media`}>Фото и видео</Link>
                  </li>
                  <li>
                    <Link href={`/business/${business.id}/reviews`}>Отзывы</Link>
                  </li>
                  <li>
                    <Link href="/monetization/orders">Мои заказы</Link>
                  </li>
                  <li>
                    <Link href="/help">Помощь</Link>
                  </li>
                </ul>
              </article>
            </aside>
          </div>
        </>
      )}
    </BusinessShell>
  );
}
