'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  BusinessPlanStatus,
  MonetizationCampaign,
  PromotionRow,
  ownerApi,
} from '@/lib/api';
import { canViewPayments } from '@/lib/business-access';
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
  const locale = useLocale();
  const ui = useUi();

  const { token, user, ready, logout, business, access, businesses } = useBusinessAccess();
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [planStatus, setPlanStatus] = useState<BusinessPlanStatus | null>(null);
  const [campaigns, setCampaigns] = useState<MonetizationCampaign[]>([]);
  const [summary7, setSummary7] = useState<{ total: number; views: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setError(parseApiError(locale, err));
      }
    })();
  }, [token, business?.id, access]);

  if (!ready || !token) {
    return <p className="page-content">{ui.text_89d69a}</p>;
  }

  const actions = business ? buildRecentActions(locale, business, promotions) : [];
  const completion = business ? profileCompletion(business) : 0;
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE');
  const pendingModeration = campaigns.filter((c) => c.status === 'PENDING_MODERATION');
  const usageLines = planStatus ? buildPlanUsageSummary(locale, planStatus) : [];

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
          <h2>{ui.____447674}</h2>
          <p>{ui.____03e3ed}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <Link href="/onboarding/search" className="btn btn-primary">{ui.___612420}</Link>
            <Link href="/onboarding/apply" className="btn">{ui.__3b30e8}</Link>
          </div>
        </div>
      ) : (
        <>
          <header className="page-header">
            <div>
              <h1>{ui.ownerNavOverview}</h1>
              <p className="page-header-meta">
                {business.title} · {statusLabel(locale, business.status)} · {formatTodayHeader(locale)}
              </p>
            </div>
          </header>

          <section className="kpi-grid" style={{ marginBottom: 16 }}>
            <article className="kpi-card">
              <div className="kpi-label">{ui.__7__c0883e}</div>
              <div className="kpi-value">{formatNumber(summary7?.views ?? 0)}</div>
              <Link href="/statistics" className="card-link" style={{ fontSize: '0.85rem' }}>{ui.__79b074}</Link>
            </article>
            <article className="kpi-card">
              <div className="kpi-label">{ui.__7__0205a6}</div>
              <div className="kpi-value">{formatNumber(summary7?.total ?? 0)}</div>
            </article>
            <article className="kpi-card">
              <div className="kpi-label">{ui.__bb49cc}</div>
              <div className="kpi-value">{activeCampaigns.length}</div>
              {pendingModeration.length > 0 && (
                <span className="tag tag-warning" style={{ marginTop: 8 }}>
                  {pendingModeration.length} на модерации
                </span>
              )}
            </article>
            <article className="kpi-card">
              <div className="kpi-label">{ui.ownerNavPlan}</div>
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
            <Link href={`/business/${business.id}`} className="btn">{ui.__0c98ac}</Link>
            <Link href={`/business/${business.id}/menu`} className="btn">{ui.___ee3b0e}</Link>
            <Link href={`/business/${business.id}/promotions`} className="btn">{ui.__a4ce5c}</Link>
            <Link href="/monetization" className="btn btn-primary">{ui.__591eff}</Link>
          </section>

          <div className="dashboard-grid">
            <div className="dashboard-main">
              {planStatus && (
                <article className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <h2>{ui.__78eefe}</h2>
                    <Link href="/plan" className="card-link">{ui.ownerNavPlan}</Link>
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
                  <h2>{ui.__19c279}</h2>
                  <Link href="/monetization/campaigns" className="card-link">{ui.__c9b745}</Link>
                </div>
                {campaigns.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                    Нет кампаний.{' '}
                    <Link href="/monetization">{ui.__24c04c}</Link>
                  </p>
                ) : (
                  <ul className="action-list">
                    {campaigns.slice(0, 5).map((c) => (
                      <li key={c.id} className="action-item">
                        <div className="action-icon">📣</div>
                        <div className="action-text">
                          <strong>{c.product?.name ?? ui.text_f9852f}</strong>
                          <span>
                            <span className={monetizationStatusClass(c.status)}>
                              {campaignStatusLabel(locale, c.status)}
                            </span>
                            {' · '}
                            <Link href={`/monetization/campaigns/${c.id}`}>{ui.text_db5f55}</Link>
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
                    <h2>{ui.__6b8b2e}</h2>
                  </div>
                  {actions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>{ui.___4c05a7}</p>
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
                    <h2>{ui.__7a5b4f}</h2>
                    <Link href={`/business/${business.id}/promotions`} className="card-link">{ui.__e3d304}</Link>
                  </div>
                  {promotions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>{ui.___a2ac3e}</p>
                  ) : (
                    promotions.slice(0, 3).map((p) => (
                      <div key={p.id} className="promo-item">
                        <div className="promo-thumb">🏷️</div>
                        <div className="promo-body">
                          <strong>{p.title}</strong>
                          <p>{p.description ?? p.discountText ?? ui.__c6b09a}</p>
                          <span className="tag tag-success">{ui.text_047e75}</span>
                        </div>
                      </div>
                    ))
                  )}
                </article>
              </div>
            </div>

            <aside className="dashboard-side">
              <article className="card">
                <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>{ui.text_a46c37}</h2>
                <div className="progress-block">
                  <div className="progress-label">
                    <span>{ui.text_4dc45b}</span>
                    <strong>{completion}%</strong>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${completion}%` }} />
                  </div>
                </div>
                <Link href={`/business/${business.id}`} className="btn btn-sm" style={{ width: '100%' }}>{ui.ownerMgmtMyBusiness}</Link>
              </article>

              <article className="card">
                <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>{ui.__a144ec}</h2>
                <ul className="help-links">
                  <li>
                    <Link href={`/business/${business.id}/media`}>{ui.___c89390}</Link>
                  </li>
                  <li>
                    <Link href={`/business/${business.id}/reviews`}>{ui.text_1c3fea}</Link>
                  </li>
                  <li>
                    <Link href="/monetization/orders">{ui.__1c4a26}</Link>
                  </li>
                  <li>
                    <Link href="/help">{ui.ownerNavHelp}</Link>
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
