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
import { BackofficeEmptyState, BackofficeErrorState, BackofficeLoadingState } from '@qalago/brand/states';
import { dashboardDateUntilWord } from '@/lib/owner-visual-copy';
import {
  BackofficeDashboardSection,
  BackofficeKpiCard,
  BackofficeKpiGrid,
  BackofficeProgress,
  BackofficeSummaryCard,
} from '@qalago/brand/dashboards';
import { QalaIcon } from '@qalago/brand/icons';

type LoadState<T> = {
  loading: boolean;
  data: T | null;
  error: string | null;
};

const idle = <T,>(): LoadState<T> => ({ loading: false, data: null, error: null });

export default function DashboardPage() {
  const locale = useLocale();
  const ui = useUi();

  const { token, user, ready, logout, business, access, businesses } = useBusinessAccess();

  const [analytics, setAnalytics] = useState<LoadState<{ total: number; views: number }>>({
    loading: true,
    data: null,
    error: null,
  });
  const [promotions, setPromotions] = useState<LoadState<PromotionRow[]>>({
    loading: true,
    data: null,
    error: null,
  });
  const [campaigns, setCampaigns] = useState<LoadState<MonetizationCampaign[]>>({
    loading: true,
    data: null,
    error: null,
  });
  const [planStatus, setPlanStatus] = useState<LoadState<BusinessPlanStatus | null>>(idle());

  const [analyticsRetry, setAnalyticsRetry] = useState(0);
  const [promotionsRetry, setPromotionsRetry] = useState(0);
  const [campaignsRetry, setCampaignsRetry] = useState(0);
  const [planRetry, setPlanRetry] = useState(0);

  useEffect(() => {
    if (!token || !business) {
      setAnalytics(idle());
      return;
    }
    setAnalytics((s) => ({ ...s, loading: true, error: null }));
    ownerApi
      .analyticsSummary(token, business.id, 7)
      .then((s7) =>
        setAnalytics({
          loading: false,
          data: { total: s7.total, views: s7.byType.VIEW_BUSINESS ?? 0 },
          error: null,
        }),
      )
      .catch((err) =>
        setAnalytics({ loading: false, data: null, error: parseApiError(locale, err) }),
      );
  }, [token, business?.id, analyticsRetry, locale]);

  useEffect(() => {
    if (!token || !business) {
      setPromotions(idle());
      return;
    }
    setPromotions((s) => ({ ...s, loading: true, error: null }));
    ownerApi
      .listPromotions(token, business.id)
      .then((res) =>
        setPromotions({
          loading: false,
          data: res.items.filter((p) => p.status === 'ACTIVE'),
          error: null,
        }),
      )
      .catch((err) =>
        setPromotions({ loading: false, data: null, error: parseApiError(locale, err) }),
      );
  }, [token, business?.id, promotionsRetry, locale]);

  useEffect(() => {
    if (!token || !business) {
      setCampaigns(idle());
      return;
    }
    setCampaigns((s) => ({ ...s, loading: true, error: null }));
    ownerApi
      .listMonetizationCampaigns(token, business.id)
      .then((camps) => setCampaigns({ loading: false, data: camps, error: null }))
      .catch((err) =>
        setCampaigns({ loading: false, data: null, error: parseApiError(locale, err) }),
      );
  }, [token, business?.id, campaignsRetry, locale]);

  useEffect(() => {
    if (!token || !business) {
      setPlanStatus(idle());
      return;
    }
    if (!canViewPayments(access)) {
      setPlanStatus({ loading: false, data: null, error: null });
      return;
    }
    setPlanStatus((s) => ({ ...s, loading: true, error: null }));
    ownerApi
      .getBusinessPlan(token, business.id)
      .then((plan) => setPlanStatus({ loading: false, data: plan, error: null }))
      .catch((err) =>
        setPlanStatus({ loading: false, data: null, error: parseApiError(locale, err) }),
      );
  }, [token, business?.id, access, planRetry, locale]);

  if (!ready || !token) {
    return (
      <div className="page-content">
        <BackofficeLoadingState density="page" label={ui.text_89d69a} />
      </div>
    );
  }

  const promoItems = promotions.data ?? [];
  const campaignItems = campaigns.data ?? [];
  const actions = business ? buildRecentActions(locale, business, promoItems) : [];
  const completion = business ? profileCompletion(business) : 0;
  const activeCampaigns = campaignItems.filter((c) => c.status === 'ACTIVE');
  const pendingModeration = campaignItems.filter((c) => c.status === 'PENDING_MODERATION');
  const usageLines = planStatus.data ? buildPlanUsageSummary(locale, planStatus.data) : [];
  const planName = planStatus.data?.catalog.nameRu;

  return (
    <BusinessShell
      activeNav="home"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      {!business ? (
        <BackofficeEmptyState
          title={ui.____447674}
          description={ui.____03e3ed}
          icon="business"
          actions={
            <>
              <Link href="/onboarding/search" className="btn btn-primary">
                {ui.___612420}
              </Link>
              <Link href="/onboarding/apply" className="btn btn-secondary">
                {ui.__3b30e8}
              </Link>
            </>
          }
        />
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

          <BackofficeKpiGrid className="page-section">
            <BackofficeKpiCard
              label={ui.__7__c0883e}
              icon="analytics"
              loading={analytics.loading}
              error={analytics.error}
              value={analytics.data != null ? formatNumber(analytics.data.views) : undefined}
              href="/statistics"
              linkLabel={ui.__79b074}
            />
            <BackofficeKpiCard
              label={ui.__7__0205a6}
              icon="analytics"
              loading={analytics.loading}
              error={analytics.error}
              value={analytics.data != null ? formatNumber(analytics.data.total) : undefined}
            />
            <BackofficeKpiCard
              label={ui.__bb49cc}
              icon="megaphone"
              loading={campaigns.loading}
              error={campaigns.error}
              value={campaigns.data != null ? activeCampaigns.length : undefined}
              secondary={
                pendingModeration.length > 0 ? (
                  <span className="tag tag-warning">
                    {pendingModeration.length} · {ui.__d9d74d}
                  </span>
                ) : undefined
              }
            />
            <BackofficeKpiCard
              label={ui.ownerNavPlan}
              icon="plan"
              loading={canViewPayments(access) && planStatus.loading}
              error={planStatus.error}
              value={planName ?? (canViewPayments(access) ? undefined : '—')}
              secondary={
                planStatus.data?.expiresAt ? (
                  <>
                    {dashboardDateUntilWord(locale)}{' '}
                    {new Date(planStatus.data.expiresAt).toLocaleDateString(locale === 'kk' ? 'kk-KZ' : 'ru-RU')}
                  </>
                ) : undefined
              }
              href="/plan"
              linkLabel={ui.ownerNavPlan}
            />
          </BackofficeKpiGrid>
          {analytics.error ? (
            <BackofficeErrorState
              message={analytics.error}
              onRetry={() => setAnalyticsRetry((n) => n + 1)}
            />
          ) : null}

          <section className="quick-actions-grid" style={{ marginBottom: 16 }}>
            <Link href={`/business/${business.id}`} className="btn">
              {ui.__0c98ac}
            </Link>
            <Link href={`/business/${business.id}/menu`} className="btn">
              {ui.___ee3b0e}
            </Link>
            <Link href={`/business/${business.id}/promotions`} className="btn">
              {ui.__a4ce5c}
            </Link>
            <Link href="/monetization" className="btn btn-primary">
              {ui.__591eff}
            </Link>
          </section>

          <div className="dashboard-grid">
            <div className="dashboard-main">
              {canViewPayments(access) ? (
                <BackofficeDashboardSection
                  title={ui.__78eefe}
                  actions={
                    <Link href="/plan" className="card-link">
                      {ui.ownerNavPlan}
                    </Link>
                  }
                  statusSlot={
                    planStatus.error ? (
                      <BackofficeErrorState
                        message={planStatus.error}
                        onRetry={() => setPlanRetry((n) => n + 1)}
                      />
                    ) : planStatus.loading ? (
                      <BackofficeLoadingState density="section" label={ui.text_89d69a} />
                    ) : null
                  }
                >
                  {planStatus.data ? (
                    <BackofficeSummaryCard title={planStatus.data.catalog.nameRu}>
                      <ul className="plan-list">
                        {usageLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                      {planStatus.data.entitlements?.overLimitNotice ? (
                        <p className="alert" style={{ marginTop: 12, fontSize: '0.9rem' }}>
                          {planStatus.data.entitlements.overLimitNotice}
                        </p>
                      ) : null}
                    </BackofficeSummaryCard>
                  ) : !planStatus.loading && !planStatus.error ? (
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>{ui.____447674}</p>
                  ) : null}
                </BackofficeDashboardSection>
              ) : null}

              <BackofficeDashboardSection
                title={ui.__19c279}
                actions={
                  <Link href="/monetization/campaigns" className="card-link">
                    {ui.__c9b745}
                  </Link>
                }
                statusSlot={
                  campaigns.error ? (
                    <BackofficeErrorState
                      message={campaigns.error}
                      onRetry={() => setCampaignsRetry((n) => n + 1)}
                    />
                  ) : campaigns.loading ? (
                    <BackofficeLoadingState density="section" label={ui.text_89d69a} />
                  ) : null
                }
              >
                {!campaigns.loading && !campaigns.error && campaignItems.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                    {ui.____31cba1}{' '}
                    <Link href="/monetization">{ui.__24c04c}</Link>
                  </p>
                ) : null}
                {!campaigns.loading && !campaigns.error && campaignItems.length > 0 ? (
                  <ul className="action-list">
                    {campaignItems.slice(0, 5).map((c) => (
                      <li key={c.id} className="action-item">
                        <div className="action-icon" aria-hidden>
                          <QalaIcon name="megaphone" size="sm" decorative />
                        </div>
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
                ) : null}
              </BackofficeDashboardSection>

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

                <BackofficeDashboardSection
                  title={ui.__7a5b4f}
                  actions={
                    <Link href={`/business/${business.id}/promotions`} className="card-link">
                      {ui.__e3d304}
                    </Link>
                  }
                  statusSlot={
                    promotions.error ? (
                      <BackofficeErrorState
                        message={promotions.error}
                        onRetry={() => setPromotionsRetry((n) => n + 1)}
                      />
                    ) : promotions.loading ? (
                      <BackofficeLoadingState density="section" label={ui.text_89d69a} />
                    ) : null
                  }
                >
                  {!promotions.loading && !promotions.error && promoItems.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>{ui.___a2ac3e}</p>
                  ) : null}
                  {!promotions.loading && !promotions.error
                    ? promoItems.slice(0, 3).map((p) => (
                        <div key={p.id} className="promo-item">
                          <div className="promo-thumb" aria-hidden>
                            <QalaIcon name="promotion" size="md" decorative />
                          </div>
                          <div className="promo-body">
                            <strong>{p.title}</strong>
                            <p>{p.description ?? p.discountText ?? ui.__c6b09a}</p>
                            <span className="tag tag-success">{ui.text_047e75}</span>
                          </div>
                        </div>
                      ))
                    : null}
                </BackofficeDashboardSection>
              </div>
            </div>

            <aside className="dashboard-side">
              <BackofficeSummaryCard title={ui.text_a46c37}>
                <BackofficeProgress
                  label={ui.text_4dc45b}
                  value={completion}
                  max={100}
                  valueLabel={`${completion}%`}
                />
                <Link
                  href={`/business/${business.id}`}
                  className="btn btn-sm"
                  style={{ width: '100%', marginTop: 12 }}
                >
                  {ui.ownerMgmtMyBusiness}
                </Link>
              </BackofficeSummaryCard>

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
