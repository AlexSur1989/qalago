'use client';

import { useEffect, useState } from 'react';
import { monetizationApi } from '@/lib/monetization-api';
import { useMonetizationContext } from '@/components/monetization/monetization-layout-client';
import { parseApiError } from '@/lib/monetization-utils';
import { BackofficeKpiCard, BackofficeKpiGrid } from '@qalago/brand/dashboards';
import { BackofficeLoadingState } from '@qalago/brand/states';

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
        <BackofficeLoadingState density="section" label="Загрузка…" />
      ) : (
        <BackofficeKpiGrid>
          <BackofficeKpiCard label="Заказы ожидают оплаты" icon="wallet" value={kpis.awaitingPayment} />
          <BackofficeKpiCard label="Креативы на модерации" icon="moderation" value={kpis.pendingCreatives} />
          <BackofficeKpiCard label="Активные кампании" icon="megaphone" value={kpis.activeCampaigns} />
          <BackofficeKpiCard label="Запланированные кампании" icon="megaphone" value={kpis.scheduledCampaigns} />
          <BackofficeKpiCard label="Завершённые кампании" icon="megaphone" value={kpis.completedCampaigns} />
        </BackofficeKpiGrid>
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
