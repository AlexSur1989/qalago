'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  BusinessPlanStatus,
  MonetizationCampaign,
  MonetizationOrder,
  PlanPaymentRow,
  ownerApi,
} from '@/lib/api';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import { canViewPayments } from '@/lib/business-access';
import {
  campaignStatusLabel,
  formatDateTime,
  formatKzt,
  monetizationStatusClass,
  orderStatusLabel,
  parseApiError,
  planTierLabel,
  productLabel,
} from '@/lib/monetization-utils';
import { BackofficeKpiCard, BackofficeKpiGrid } from '@qalago/brand/dashboards';
import { BackofficeLoadingState } from '@qalago/brand/states';
import {
  monetizationAdProductsHint,
  monetizationAdvertisingDiscountLine,
  monetizationLandingIntro,
  ownerAdvertisingSectionTitle,
  ownerMyPlanSectionTitle,
  ownerPlanStatusActiveLabel,
  ownerPlanStatusPendingLabel,
  planPendingPaymentTitle,
  planValidUntilPrefix,
} from '@/lib/owner-visual-copy';
import { findPendingPlanPayment, planCatalogDisplayName } from '@/lib/plan-owner-ui';

export default function MonetizationOverviewPage() {
  const locale = useLocale();
  const ui = useUi();

  const { token, business, access } = useMonetizationContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<BusinessPlanStatus | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PlanPaymentRow | null>(null);
  const [orders, setOrders] = useState<MonetizationOrder[]>([]);
  const [campaigns, setCampaigns] = useState<MonetizationCampaign[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      canViewPayments(access)
        ? ownerApi.getBusinessPlan(token, business.id)
        : Promise.resolve(null),
      canViewPayments(access)
        ? ownerApi.listPlanPayments(token, business.id).then((r) => r.items)
        : Promise.resolve([] as PlanPaymentRow[]),
      ownerApi.listMonetizationOrders(token, business.id),
      ownerApi.listMonetizationCampaigns(token, business.id),
    ])
      .then(([plan, planPayments, orderList, campaignList]) => {
        if (cancelled) return;
        setPlanStatus(plan);
        setPendingPayment(findPendingPlanPayment(planPayments) ?? null);
        setOrders(orderList);
        setCampaigns(campaignList);
      })
      .catch((err) => {
        if (!cancelled) setError(parseApiError(locale, err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, business.id, access, locale]);

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

  const planStatusLabel = pendingPayment
    ? ownerPlanStatusPendingLabel(locale)
    : ownerPlanStatusActiveLabel(locale);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{ui.ownerNavPromote}</h1>
          <p className="page-header-meta">{business.title}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/monetization/products" className="btn">{ui.__55b89b}</Link>
          <Link href="/plan" className="btn btn-ghost">{ui.ownerNavPlan}</Link>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="form-card" style={{ marginBottom: 16 }}>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          {monetizationLandingIntro(locale)}
        </p>
      </section>

      {loading ? (
        <BackofficeLoadingState density="section" label={ui.text_89d69a} />
      ) : (
        <>
          <section className="form-card" style={{ marginBottom: 16 }}>
            <div className="card-header" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>{ownerMyPlanSectionTitle(locale)}</h2>
              <Link href="/plan" className="card-link">{ui.ownerNavPlan}</Link>
            </div>
            {planStatus ? (
              <>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>{planTierLabel(locale, planStatus.effectiveTier)}</strong>
                  <span className={`tag tag-${pendingPayment ? 'warning' : 'success'}`} style={{ marginLeft: 8 }}>
                    {planStatusLabel}
                  </span>
                </p>
                {planStatus.expiresAt && (
                  <p style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {planValidUntilPrefix(locale)}{' '}
                    {new Date(planStatus.expiresAt).toLocaleDateString(
                      locale === 'kk' ? 'kk-KZ' : 'ru-RU',
                    )}
                  </p>
                )}
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {monetizationAdvertisingDiscountLine(
                    locale,
                    planStatus.limits.advertisingDiscountPercent,
                  )}
                </p>
                {pendingPayment && (
                  <p style={{ margin: '12px 0 0', fontSize: '0.9rem' }} role="status">
                    <strong>{planPendingPaymentTitle(locale)}:</strong>{' '}
                    {planCatalogDisplayName(locale, pendingPayment.tier)} —{' '}
                    {pendingPayment.amountKzt.toLocaleString(locale === 'kk' ? 'kk-KZ' : 'ru-RU')} ₸
                  </p>
                )}
              </>
            ) : (
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>{ui.text_ab6cb7}</p>
            )}
          </section>

          <h2 style={{ fontSize: '1.1rem', margin: '0 0 12px' }}>{ownerAdvertisingSectionTitle(locale)}</h2>

          <BackofficeKpiGrid>
            <BackofficeKpiCard label={ui.__bb49cc} icon="megaphone" value={activeCount} />
            <BackofficeKpiCard label={ui.text_b911f5} icon="megaphone" value={scheduledCount} />
            <BackofficeKpiCard label={ui.__d9d74d} icon="moderation" value={moderationCount} />
          </BackofficeKpiGrid>

          <div className="bottom-row">
            <section className="card">
              <div className="card-header">
                <h2>{ui.__00fe16}</h2>
                <Link href="/monetization/orders" className="card-link">{ui.__72307b}</Link>
              </div>
              {recentOrders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>{ui.___230412}</p>
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
                          {orderStatusLabel(locale, order.status)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <div className="card-header">
                <h2>{ui.__b05019}</h2>
              </div>
              <ul className="action-list">
                <li className="action-item">
                  <div className="action-icon">📣</div>
                  <div className="action-text">
                    <Link href="/monetization/products">
                      <strong>{ui.__ebd04c}</strong>
                    </Link>
                    <span>{monetizationAdProductsHint(locale)}</span>
                  </div>
                </li>
                <li className="action-item">
                  <div className="action-icon">📦</div>
                  <div className="action-text">
                    <Link href="/monetization/packages">
                      <strong>{ui.__13dad9}</strong>
                    </Link>
                    <span>{ui.___016439}</span>
                  </div>
                </li>
                <li className="action-item">
                  <div className="action-icon">📊</div>
                  <div className="action-text">
                    <Link href="/monetization/campaigns">
                      <strong>{ui.__f71231}</strong>
                    </Link>
                    <span>
                      {campaigns.length > 0
                        ? ui.text_7aa4a8
                        : ui.____31cba1}
                    </span>
                  </div>
                </li>
              </ul>
            </section>
          </div>

          {campaigns.length > 0 && (
            <section className="card" style={{ marginTop: 18 }}>
              <div className="card-header">
                <h2>{ui.text_014f35}</h2>
                <Link href="/monetization/campaigns" className="card-link">{ui.__10dafd}</Link>
              </div>
              <div className="table-scroll desktop-only">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{ui.text_c5ffa7}</th>
                      <th>{ui.text_7203f7}</th>
                      <th>{ui.text_f90bfb}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.slice(0, 5).map((c) => {
                      const status = c.effectiveStatus ?? c.status;
                      return (
                        <tr key={c.id}>
                          <td>
                            <Link href={`/monetization/campaigns/${c.id}`}>
                              {productLabel(locale, c.product?.code)}
                            </Link>
                          </td>
                          <td>
                            <span className={monetizationStatusClass(status)}>
                              {campaignStatusLabel(locale, status)}
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
                          <strong>{productLabel(locale, c.product?.code)}</strong>
                        </Link>
                        <span className={monetizationStatusClass(status)}>
                          {campaignStatusLabel(locale, status)}
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
