'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  monetizationApi,
  CampaignAnalytics,
  MonetizationCampaignRow,
} from '@/lib/monetization-api';
import { useMonetizationContext } from '@/components/monetization/monetization-layout-client';
import { confirmAction } from '@/lib/admin-utils';
import {
  analyticsActionLabel,
  campaignActionsForStatus,
  campaignStatusLabel,
  formatCtr,
  formatDate,
  formatDateTime,
  monetizationStatusClass,
  parseApiError,
  placementLabel,
  productLabel,
} from '@/lib/monetization-utils';

export default function MonetizationCampaignDetailPage() {
  const params = useParams();
  const campaignId = String(params.id);
  const { token } = useMonetizationContext();
  const [campaign, setCampaign] = useState<MonetizationCampaignRow | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function reload() {
    const [c, a] = await Promise.all([
      monetizationApi.getCampaign(token, campaignId),
      monetizationApi.getCampaignAnalytics(token, campaignId),
    ]);
    setCampaign(c);
    setAnalytics(a);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reload()
      .catch((err) => {
        if (!cancelled) setError(parseApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, campaignId]);

  async function runAction(action: 'pause' | 'resume' | 'cancel') {
    if (!campaign) return;
    const messages = {
      pause: 'Приостановить рекламную кампанию?',
      resume: 'Возобновить рекламную кампанию?',
      cancel:
        'Отменить рекламную кампанию?\n\nЭто действие остановит дальнейшие показы.',
    };
    if (!confirmAction(messages[action])) return;

    setActionLoading(action);
    setError(null);
    try {
      if (action === 'pause') await monetizationApi.pauseCampaign(token, campaignId);
      if (action === 'resume') await monetizationApi.resumeCampaign(token, campaignId);
      if (action === 'cancel') await monetizationApi.cancelCampaign(token, campaignId);
      await reload();
    } catch (err) {
      setError('Не удалось изменить статус кампании.');
      console.debug(parseApiError(err));
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>;
  if (error && !campaign) {
    return <div className="alert alert-error">{error}</div>;
  }
  if (!campaign) return <div className="alert alert-error">Кампания не найдена</div>;

  const status = campaign.effectiveStatus || campaign.status;
  const actions = campaignActionsForStatus(status);

  return (
    <>
      <div className="page-header">
        <h1>{productLabel(campaign.product.code)}</h1>
        <Link href="/monetization/campaigns" className="btn btn-sm">
          ← К списку
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card">
        <h2>Кампания</h2>
        <dl className="detail-grid">
          <dt>Бизнес</dt>
          <dd>{campaign.businessTitle ?? campaign.businessId}</dd>
          <dt>Статус</dt>
          <dd>
            <span className={monetizationStatusClass(status)}>
              {campaignStatusLabel(status)}
            </span>
          </dd>
          <dt>Начало</dt>
          <dd>{formatDateTime(campaign.startAt)}</dd>
          <dt>Окончание</dt>
          <dd>{formatDateTime(campaign.endAt)}</dd>
          <dt>Placement</dt>
          <dd>
            {campaign.placements?.map((p) => placementLabel(p.code)).join(', ') || '—'}
          </dd>
        </dl>

        {actions.length > 0 && (
          <div className="action-row">
            {actions.includes('pause') && (
              <button
                type="button"
                className="btn btn-sm"
                disabled={actionLoading != null}
                onClick={() => runAction('pause')}
              >
                {actionLoading === 'pause' ? '…' : 'Приостановить'}
              </button>
            )}
            {actions.includes('resume') && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={actionLoading != null}
                onClick={() => runAction('resume')}
              >
                {actionLoading === 'resume' ? '…' : 'Возобновить'}
              </button>
            )}
            {actions.includes('cancel') && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={actionLoading != null}
                onClick={() => runAction('cancel')}
              >
                {actionLoading === 'cancel' ? '…' : 'Отменить'}
              </button>
            )}
          </div>
        )}
      </section>

      {analytics && (
        <section className="card">
          <h2>Статистика</h2>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Выдано рекламой</div>
              <div className="kpi-value">{analytics.served}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Просмотры</div>
              <div className="kpi-value">{analytics.qualifiedImpressions}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Переходы</div>
              <div className="kpi-value">{analytics.clicks}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">CTR</div>
              <div className="kpi-value">{formatCtr(analytics.ctr)}</div>
            </div>
          </div>

          <h3>Действия</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Тип</th>
                <th>Количество</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analytics.actions).map(([type, count]) => (
                <tr key={type}>
                  <td>{analyticsActionLabel(type)}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
