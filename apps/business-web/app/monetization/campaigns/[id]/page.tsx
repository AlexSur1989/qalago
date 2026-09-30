'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { Fragment } from 'react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  MonetizationCampaign,
  MonetizationCampaignAnalytics,
  ownerApi,
} from '@/lib/api';
import { BusinessPermission, hasPermission } from '@/lib/business-access';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import {
  analyticsActionLabel,
  canSubmitCreative,
  creativeStatusLabel,
  formatDateTime,
  formatEffectivePeriod,
  monetizationStatusClass,
  parseApiError,
  placementLabel,
  productLabel,
  vipCampaignDisplayStatus,
  vipModerationNotice,
} from '@/lib/monetization-utils';
import { campaignKpiServedLabel, monetizationCampaignPageMeta } from '@/lib/owner-visual-copy';

export default function MonetizationCampaignDetailPage() {
  const locale = useLocale();
  const ui = useUi();

  const params = useParams<{ id: string }>();
  const campaignId = params.id;
  const { token, access } = useMonetizationContext();
  const [campaign, setCampaign] = useState<MonetizationCampaign | null>(null);
  const [analytics, setAnalytics] = useState<MonetizationCampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canManageAds =
    access?.role === 'OWNER' || hasPermission(access, BusinessPermission.ADS_MANAGE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, a] = await Promise.all([
        ownerApi.getMonetizationCampaign(token, campaignId),
        ownerApi.getMonetizationCampaignAnalytics(token, campaignId),
      ]);
      setCampaign(c);
      setAnalytics(a);
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setLoading(false);
    }
  }, [token, campaignId]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  async function onSubmitCreative() {
    if (!campaign?.creative?.id || submitting) return;
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      await ownerApi.submitMonetizationCreative(token, campaign.creative.id);
      setInfo(ui.____2cb815);
      await load();
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>{ui.text_89d69a}</p>;
  if (error && !campaign) {
    return <div className="alert alert-error">{error}</div>;
  }
  if (!campaign) {
    return <div className="alert alert-error">{ui.___9c4728}</div>;
  }

  const isVip = campaign.product?.code === 'VIP_BANNER';
  const displayStatus = vipCampaignDisplayStatus(locale, campaign);
  const moderationNotice = isVip ? vipModerationNotice(locale, campaign) : null;
  const showSubmit =
    isVip && canManageAds && canSubmitCreative(campaign.creative) && !submitting;
  const actionEntries = analytics
    ? Object.entries(analytics.actions).filter(([, count]) => count > 0)
    : [];

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{productLabel(locale, campaign.product?.code)}</h1>
          <p className="page-header-meta">
            {monetizationCampaignPageMeta(locale, campaign.id.slice(0, 8))}
          </p>
        </div>
        <Link href="/monetization/campaigns" className="btn btn-ghost btn-sm">{ui.__41649d}</Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      <section className="form-card" style={{ marginBottom: 16 }}>
        <dl className="detail-grid">
          <dt>{ui.__733f68}</dt>
          <dd>
            <span className={monetizationStatusClass(campaign.status)}>
              {displayStatus}
            </span>
          </dd>
          {isVip && campaign.requestedStartAt && (
            <>
              <dt>{ui.__a0b38a}</dt>
              <dd>{formatDateTime(campaign.requestedStartAt)}</dd>
            </>
          )}
          <dt>{ui.__ce5cf6}</dt>
          <dd>{formatEffectivePeriod(locale, campaign)}</dd>
          {campaign.placements && campaign.placements.length > 0 && (
            <>
              <dt>{ui.text_382d73}</dt>
              <dd>
                {campaign.placements
                  .map((p) => placementLabel(locale, p.code, p.name ?? p.nameRu))
                  .join(', ')}
              </dd>
            </>
          )}
          {isVip && campaign.creative && (
            <>
              <dt>{ui.text_e35653}</dt>
              <dd>
                {campaign.creative.title ?? campaign.creative.id}{' '}
                <span className={monetizationStatusClass(campaign.creative.moderationStatus)}>
                  {creativeStatusLabel(locale, campaign.creative.moderationStatus)}
                </span>
              </dd>
            </>
          )}
        </dl>

        {showSubmit && (
          <div className="action-row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={submitting}
              onClick={() => onSubmitCreative()}
            >
              {submitting ? ui.text_a2aa4c : ui.___ff1357}
            </button>
          </div>
        )}

        {moderationNotice && (
          <div className="alert" style={{ marginTop: 12 }}>
            {moderationNotice}
          </div>
        )}
      </section>

      {analytics && (
        <section className="form-card">
          <h2 style={{ marginTop: 0 }}>{ui.ownerNavAnalytics}</h2>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">{campaignKpiServedLabel(locale)}</div>
              <div className="kpi-value">{analytics.served}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{ui.__cd6c16}</div>
              <div className="kpi-value">{analytics.qualifiedImpressions}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{ui.text_98462d}</div>
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
              <h3>{ui.text_fb3df3}</h3>
              <dl className="detail-grid compact">
                {actionEntries.map(([type, count]) => (
                  <Fragment key={type}>
                    <dt>{analyticsActionLabel(locale, type)}</dt>
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
