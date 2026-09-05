'use client';

import { useEffect, useState } from 'react';
import { monetizationApi } from '@/lib/monetization-api';
import { useMonetizationContext } from '@/components/monetization/monetization-layout-client';
import { parseApiError } from '@/lib/monetization-utils';

export default function MonetizationOverviewPage() {
  const { token, citySlug } = useMonetizationContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState({
    awaitingPayment: 0,
    pendingCreatives: 0,
    activeCampaigns: 0,
    scheduledCampaigns: 0,
    completedCampaigns: 0,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      monetizationApi.listOrders(token, {
        citySlug,
        status: 'AWAITING_PAYMENT',
        limit: 1,
      }),
      monetizationApi.listCreatives(token, {
        citySlug,
        moderationStatus: 'PENDING',
        limit: 1,
      }),
      monetizationApi.listCampaigns(token, { citySlug, limit: 200 }),
    ])
      .then(([orders, creatives, campaigns]) => {
        if (cancelled) return;
        const active = campaigns.items.filter(
          (c) => c.effectiveStatus === 'ACTIVE' || c.status === 'ACTIVE',
        ).length;
        const scheduled = campaigns.items.filter(
          (c) => c.effectiveStatus === 'SCHEDULED' || c.status === 'SCHEDULED',
        ).length;
        const completed = campaigns.items.filter(
          (c) => c.effectiveStatus === 'COMPLETED' || c.status === 'COMPLETED',
        ).length;
        setKpis({
          awaitingPayment: orders.total,
          pendingCreatives: creatives.total,
          activeCampaigns: active,
          scheduledCampaigns: scheduled,
          completedCampaigns: completed,
        });
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
  }, [token, citySlug]);

  return (
    <>
      <div className="page-header">
        <h1>Монетизация</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
      ) : (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Заказы ожидают оплаты</div>
            <div className="kpi-value">{kpis.awaitingPayment}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Креативы на модерации</div>
            <div className="kpi-value">{kpis.pendingCreatives}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Активные кампании</div>
            <div className="kpi-value">{kpis.activeCampaigns}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Запланированные кампании</div>
            <div className="kpi-value">{kpis.scheduledCampaigns}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Завершённые кампании</div>
            <div className="kpi-value">{kpis.completedCampaigns}</div>
          </div>
        </div>
      )}

      <section className="card card-muted">
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          Показатели считаются по данным backend для выбранного города. Статистика кампаний
          на обзоре ограничена загруженным списком (до 200 записей).
        </p>
      </section>
    </>
  );
}
