'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MonetizationCampaign, ownerApi } from '@/lib/api';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import {
  creativeStatusLabel,
  formatEffectivePeriod,
  monetizationStatusClass,
  parseApiError,
  placementLabel,
  productLabel,
  vipCampaignDisplayStatus,
} from '@/lib/monetization-utils';

export default function MonetizationCampaignsPage() {
  const { token, business } = useMonetizationContext();
  const [campaigns, setCampaigns] = useState<MonetizationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ownerApi
      .listMonetizationCampaigns(token, business.id)
      .then((items) => {
        if (!cancelled) setCampaigns(items);
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

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Мои кампании</h1>
          <p className="page-header-meta">Активные и завершённые рекламные кампании</p>
        </div>
        <Link href="/monetization/products" className="btn btn-sm">
          Новое размещение
        </Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>}

      {!loading && campaigns.length === 0 && (
        <section className="form-card">
          <p style={{ color: 'var(--text-muted)' }}>Кампаний пока нет.</p>
          <Link href="/monetization/products" className="btn btn-sm">
            Купить размещение
          </Link>
        </section>
      )}

      {campaigns.length > 0 && (
        <>
          <div className="table-scroll desktop-only">
            <table className="table">
              <thead>
                <tr>
                  <th>Продукт</th>
                  <th>Статус</th>
                  <th>Размещения</th>
                  <th>Период</th>
                  <th>Показы</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const displayStatus = vipCampaignDisplayStatus(c);
                  return (
                    <tr key={c.id}>
                      <td>{productLabel(c.product?.code)}</td>
                      <td>
                        <span className={monetizationStatusClass(c.status)}>
                          {displayStatus}
                        </span>
                        {c.creative && c.product?.code === 'VIP_BANNER' && (
                          <div className="table-sub">
                            {creativeStatusLabel(c.creative.moderationStatus)}
                          </div>
                        )}
                      </td>
                      <td>
                        {c.placements?.map((p) => placementLabel(p.code, p.name ?? p.nameRu)).join(', ') ||
                          '—'}
                      </td>
                      <td>{formatEffectivePeriod(c)}</td>
                      <td>{c.metrics?.qualifiedImpressions ?? 0}</td>
                      <td>
                        <Link href={`/monetization/campaigns/${c.id}`} className="btn btn-sm">
                          Открыть
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mobile-only">
            {campaigns.map((c) => {
              const displayStatus = vipCampaignDisplayStatus(c);
              return (
                <section key={c.id} className="form-card" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{productLabel(c.product?.code)}</strong>
                    <span className={monetizationStatusClass(c.status)}>
                      {displayStatus}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    {formatEffectivePeriod(c)}
                  </p>
                  <Link href={`/monetization/campaigns/${c.id}`} className="btn btn-sm">
                    Детали
                  </Link>
                </section>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
