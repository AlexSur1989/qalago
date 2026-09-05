'use client';

import Link from 'next/link';
import { Fragment } from 'react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  MonetizationCampaign,
  MonetizationCampaignAnalytics,
  ownerApi,
} from '@/lib/api';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import {
  analyticsActionLabel,
  campaignStatusLabel,
  creativeStatusLabel,
  formatDate,
  formatDateTime,
  monetizationStatusClass,
  parseApiError,
  placementLabel,
  productLabel,
} from '@/lib/monetization-utils';

export default function MonetizationCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;
  const { token } = useMonetizationContext();
  const [campaign, setCampaign] = useState<MonetizationCampaign | null>(null);
  const [analytics, setAnalytics] = useState<MonetizationCampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      ownerApi.getMonetizationCampaign(token, campaignId),
      ownerApi.getMonetizationCampaignAnalytics(token, campaignId),
    ])
      .then(([c, a]) => {
        if (!cancelled) {
          setCampaign(c);
          setAnalytics(a);
        }
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
  }, [token, campaignId]);

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>;
  if (error || !campaign) {
    return <div className="alert alert-error">{error ?? 'Кампания не найдена'}</div>;
  }

  const status = campaign.effectiveStatus ?? campaign.status;
  const isVip = campaign.product?.code === 'VIP_BANNER';
  const actionEntries = analytics
    ? Object.entries(analytics.actions).filter(([, count]) => count > 0)
    : [];

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{productLabel(campaign.product?.code)}</h1>
          <p className="page-header-meta">Кампания #{campaign.id.slice(0, 8)}</p>
        </div>
        <Link href="/monetization/campaigns" className="btn btn-ghost btn-sm">
          ← К списку
        </Link>
      </header>

      <section className="form-card" style={{ marginBottom: 16 }}>
        <dl className="detail-grid">
          <dt>Статус</dt>
          <dd>
            <span className={monetizationStatusClass(status)}>
              {campaignStatusLabel(status)}
            </span>
          </dd>
          {isVip && campaign.requestedStartAt && (
            <>
              <dt>Запрошенный старт</dt>
              <dd>{formatDateTime(campaign.requestedStartAt)}</dd>
            </>
          )}
          <dt>Фактический период</dt>
          <dd>
            {formatDate(campaign.startAt)} — {formatDate(campaign.endAt)}
          </dd>
          {campaign.placements && campaign.placements.length > 0 && (
            <>
              <dt>Размещения</dt>
              <dd>
                {campaign.placements
                  .map((p) => placementLabel(p.code, p.name ?? p.nameRu))
                  .join(', ')}
              </dd>
            </>
          )}
          {isVip && campaign.creative && (
            <>
              <dt>Креатив</dt>
              <dd>
                {campaign.creative.title ?? campaign.creative.id}{' '}
                <span className={monetizationStatusClass(campaign.creative.moderationStatus)}>
                  {creativeStatusLabel(campaign.creative.moderationStatus)}
                </span>
              </dd>
            </>
          )}
        </dl>

        {isVip && campaign.status === 'PENDING_MODERATION' && (
          <div className="alert" style={{ marginTop: 12 }}>
            VIP-баннер ожидает одобрения креатива. Период размещения начнётся после модерации.
          </div>
        )}
      </section>

      {analytics && (
        <section className="form-card">
          <h2 style={{ marginTop: 0 }}>Статистика</h2>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Показы (served)</div>
              <div className="kpi-value">{analytics.served}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Квалиф. показы</div>
              <div className="kpi-value">{analytics.qualifiedImpressions}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Клики</div>
              <div className="kpi-value">{analytics.clicks}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">CTR</div>
              <div className="kpi-value">
                {analytics.ctr.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%
              </div>
            </div>
          </div>

          {actionEntries.length > 0 && (
            <>
              <h3>Действия</h3>
              <dl className="detail-grid compact">
                {actionEntries.map(([type, count]) => (
                  <Fragment key={type}>
                    <dt>{analyticsActionLabel(type)}</dt>
                    <dd>{count}</dd>
                  </Fragment>
                ))}
              </dl>
            </>
          )}
        </section>
      )}
    </>
  );
}
