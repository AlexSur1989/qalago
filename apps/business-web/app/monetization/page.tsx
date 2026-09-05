'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BusinessPlanStatus, MonetizationCampaign, MonetizationOrder, ownerApi } from '@/lib/api';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import {
  campaignStatusLabel,
  formatDateTime,
  formatKzt,
  monetizationStatusClass,
  orderStatusLabel,
  parseApiError,
  planTierLabel,
} from '@/lib/monetization-utils';

export default function MonetizationOverviewPage() {
  const { token, business } = useMonetizationContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<BusinessPlanStatus | null>(null);
  const [orders, setOrders] = useState<MonetizationOrder[]>([]);
  const [campaigns, setCampaigns] = useState<MonetizationCampaign[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      ownerApi.getBusinessPlan(token, business.id),
      ownerApi.listMonetizationOrders(token, business.id),
      ownerApi.listMonetizationCampaigns(token, business.id),
    ])
      .then(([plan, orderList, campaignList]) => {
        if (cancelled) return;
        setPlanStatus(plan);
        setOrders(orderList);
        setCampaigns(campaignList);
      })
      .catch((err) => {
        if (!cancelled) setError(parseApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, business.id]);

  const activeCount = campaigns.filter(
    (c) => (c.effectiveStatus ?? c.status) === 'ACTIVE',
  ).length;
  const scheduledCount = campaigns.filter(
    (c) => (c.effectiveStatus ?? c.status) === 'SCHEDULED',
  ).length;
  const moderationCount = campaigns.filter(
    (c) => c.status === 'PENDING_MODERATION',
  ).length;
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Реклама и продвижение</h1>
          <p className="page-header-meta">{business.title}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/monetization/products" className="btn">
            Купить размещение
          </Link>
          <Link href="/plan" className="btn btn-ghost">
            Тариф
          </Link>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="form-card" style={{ marginBottom: 16 }}>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Рекламные размещения приобретаются отдельно.
        </p>
      </section>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Тариф</div>
              <div className="kpi-value" style={{ fontSize: '1.2rem' }}>
                {planStatus ? planTierLabel(planStatus.effectiveTier) : '—'}
              </div>
              {planStatus && (
                <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Скидка на рекламу: {planStatus.limits.advertisingDiscountPercent}%
                </p>
              )}
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Активные кампании</div>
              <div className="kpi-value">{activeCount}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Запланированные</div>
              <div className="kpi-value">{scheduledCount}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">На модерации</div>
              <div className="kpi-value">{moderationCount}</div>
            </div>
          </div>

          <div className="bottom-row">
            <section className="card">
              <div className="card-header">
                <h2>Последние заказы</h2>
                <Link href="/monetization/orders" className="card-link">
                  Все заказы →
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Заказов пока нет</p>
              ) : (
                <ul className="action-list">
                  {recentOrders.map((order) => (
                    <li key={order.id} className="action-item">
                      <div className="action-icon">🧾</div>
                      <div className="action-text">
                        <strong>
                          <Link href={`/monetization/orders/${order.id}`}>
                            {order.orderNumber}
                          </Link>
                        </strong>
                        <span>
                          {formatDateTime(order.createdAt)} ·{' '}
                          {formatKzt(order.totalAmount, order.currency)}
                        </span>
                        <span className={monetizationStatusClass(order.status)}>
                          {orderStatusLabel(order.status)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <div className="card-header">
                <h2>Быстрые действия</h2>
              </div>
              <ul className="action-list">
                <li className="action-item">
                  <div className="action-icon">📣</div>
                  <div className="action-text">
                    <Link href="/monetization/products">
                      <strong>Рекламные продукты</strong>
                    </Link>
                    <span>TOP, буст, VIP-баннер и др.</span>
                  </div>
                </li>
                <li className="action-item">
                  <div className="action-icon">📦</div>
                  <div className="action-text">
                    <Link href="/monetization/packages">
                      <strong>Пакеты продвижения</strong>
                    </Link>
                    <span>Готовые наборы размещений</span>
                  </div>
                </li>
                <li className="action-item">
                  <div className="action-icon">📊</div>
                  <div className="action-text">
                    <Link href="/monetization/campaigns">
                      <strong>Мои кампании</strong>
                    </Link>
                    <span>
                      {campaigns.length > 0
                        ? `${campaigns.length} кампаний`
                        : 'Пока нет активных кампаний'}
                    </span>
                  </div>
                </li>
              </ul>
            </section>
          </div>

          {campaigns.length > 0 && (
            <section className="card" style={{ marginTop: 18 }}>
              <div className="card-header">
                <h2>Кампании</h2>
                <Link href="/monetization/campaigns" className="card-link">
                  Все кампании →
                </Link>
              </div>
              <div className="table-scroll desktop-only">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Продукт</th>
                      <th>Статус</th>
                      <th>Период</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.slice(0, 5).map((c) => {
                      const status = c.effectiveStatus ?? c.status;
                      return (
                        <tr key={c.id}>
                          <td>
                            <Link href={`/monetization/campaigns/${c.id}`}>
                              {c.product?.name ?? c.product?.code}
                            </Link>
                          </td>
                          <td>
                            <span className={monetizationStatusClass(status)}>
                              {campaignStatusLabel(status)}
                            </span>
                          </td>
                          <td>
                            {formatDateTime(c.startAt)} — {formatDateTime(c.endAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mobile-only">
                {campaigns.slice(0, 5).map((c) => {
                  const status = c.effectiveStatus ?? c.status;
                  return (
                    <div key={c.id} className="promo-item">
                      <div className="promo-body">
                        <Link href={`/monetization/campaigns/${c.id}`}>
                          <strong>{c.product?.name ?? c.product?.code}</strong>
                        </Link>
                        <span className={monetizationStatusClass(status)}>
                          {campaignStatusLabel(status)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
