'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BusinessPlanStatus,
  PlanCatalogRow,
  PlanPaymentRow,
  ownerApi,
} from '@/lib/api';
import { internalTierToPublicLabel } from '@/lib/plan-display';
import { canViewPayments, isOwner } from '@/lib/business-access';
import { businessWebMockPlanCheckoutEnabled } from '@/lib/auth-config';
import { parseApiError } from '@/lib/monetization-utils';
import { BusinessShell } from '@/components/business-shell';
import { BusinessSectionAccessDenied } from '@/components/business-section-access-denied';
import { BUSINESS_ROUTE_ACCESS, useBusinessRouteGate } from '@/lib/use-business-route-gate';
import type { AppLocale, UiLabels } from '@/lib/locale';
import { planAnalytics360Label } from '@/lib/presentation';

function formatPrice(priceKzt: number) {
  if (priceKzt === 0) return '0 ₸';
  return `${priceKzt.toLocaleString('ru-RU')} ₸`;
}

function formatPeriod(ui: UiLabels, periodDays: number | null, priceKzt: number) {
  if (periodDays == null) return ui.text_3a8930;
  if (priceKzt > 0) return ui.text_63d0ff;
  return ui.text_bf3be1;
}

function analyticsLevelLabel(locale: AppLocale, ui: UiLabels, tier: string): string {
  switch (tier) {
    case 'BASIC':
      return ui.text_09825a;
    case 'EXTENDED':
      return ui.text_f1a7d3;
    case 'FULL':
      return ui.text_2252aa;
    case 'ANALYTICS_360':
      return planAnalytics360Label(locale);
    default:
      return tier;
  }
}

export default function PlanPage() {
  const locale = useLocale();
  const ui = useUi();

  const {
    token,
    user,
    ready,
    logout,
    business,
    access,
    businesses,
    allowed: routeAllowed,
  } = useBusinessRouteGate(BUSINESS_ROUTE_ACCESS.payments);
  const [catalog, setCatalog] = useState<PlanCatalogRow[]>([]);
  const [planStatus, setPlanStatus] = useState<BusinessPlanStatus | null>(null);
  const [payments, setPayments] = useState<PlanPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutTier, setCheckoutTier] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canView = canViewPayments(access);
  const canManage = isOwner(access);

  const load = useCallback(async () => {
    if (!token || !business || !routeAllowed) return;
    setLoading(true);
    setError(null);
    try {
      const plans = await ownerApi.listPlans();
      setCatalog(plans);

      if (canView) {
        const [status, paymentList] = await Promise.all([
          ownerApi.getBusinessPlan(token, business.id),
          ownerApi.listPlanPayments(token, business.id),
        ]);
        setPlanStatus(status);
        setPayments(paymentList.items);
      } else {
        setPlanStatus(null);
        setPayments([]);
      }
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setLoading(false);
    }
  }, [token, business?.id, canView, routeAllowed]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  async function onCheckout(tier: string) {
    if (!businessWebMockPlanCheckoutEnabled) return;
    if (!token || !planStatus || !canManage) return;
    setCheckoutTier(tier);
    setError(null);
    setMessage(null);
    try {
      const result = await ownerApi.mockPlanCheckout(token, planStatus.businessId, tier);
      setPlanStatus(result.plan);
      setMessage(result.message);
      await load();
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setCheckoutTier(null);
    }
  }

  if (!ready || !token) return <p className="page-content">{ui.text_89d69a}</p>;

  const effectiveTier = planStatus?.effectiveTier;

  return (
    <BusinessShell
      activeNav="plan"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      {!routeAllowed ? (
        <BusinessSectionAccessDenied />
      ) : (
        <>
      <header className="page-header">
        <div>
          <h1>{ui.ownerNavPlan}</h1>
          <p className="page-header-meta">
            Подписка для лимитов и скидки на рекламу — {business?.title ?? ui.text_e0fc47}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/monetization" className="btn">{ui.ownerNavPromote}</Link>
          <Link href="/dashboard" className="btn btn-ghost">{ui.__65f9d8}</Link>
        </div>
      </header>

      {loading && <p style={{ color: 'var(--text-muted)' }}>{ui.__c63d55}</p>}
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {planStatus && (
        <section className="form-card" style={{ marginBottom: 16, maxWidth: 720 }}>
          <h3 style={{ marginTop: 0 }}>Текущий тариф: {planStatus.catalog.nameRu}</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
            Фото: {planStatus.usage.photos} / {planStatus.limits.maxPhotos}
            {planStatus.entitlements?.photos.overLimit && planStatus.entitlements.photos.published != null
              ? ui.text_8eabdb
              : ''}
            {' · '}
            Товары/услуги: {planStatus.usage.serviceItems} / {planStatus.limits.maxServiceItems}
            {planStatus.entitlements?.serviceItems.overLimit && planStatus.entitlements.serviceItems.published != null
              ? ui.text_d6537c
              : ''}
            {' · '}
            Акции: {planStatus.usage.activePromotions} / {planStatus.limits.maxActivePromotions}
            {planStatus.entitlements?.activePromotions.overLimit && planStatus.entitlements.activePromotions.published != null
              ? ui.text_1658f7
              : ''}
          </p>
          {planStatus.entitlements?.overLimitNotice && (
            <p className="alert" style={{ marginBottom: 8, fontSize: '0.9rem' }}>
              {planStatus.entitlements.overLimitNotice}
            </p>
          )}
          {planStatus.team && planStatus.team.limit > 0 && (
            <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
              Менеджеры: {planStatus.team.activeManagers} / {planStatus.team.limit}
              {planStatus.team.pendingInvitations > 0
                ? ui.text_bc921d
                : ''}
              {planStatus.team.overLimit ? ui.____8af55c : ''}
            </p>
          )}
          {planStatus.expiresAt && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Действует до {new Date(planStatus.expiresAt).toLocaleDateString('ru-RU')}
            </p>
          )}
        </section>
      )}

      {canView && !loading && (
        <section className="form-card" style={{ marginBottom: 16, maxWidth: 720 }}>
          <h3 style={{ marginTop: 0 }}>{ui.ownerPlanPaymentHistoryTitle}</h3>
          {payments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>{ui.ownerPlanPaymentHistoryEmpty}</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {payments.map((p) => {
                const tierName =
                  catalog.find((c) => c.tier === p.tier)?.nameRu ??
                  internalTierToPublicLabel(p.tier);
                return (
                <li key={p.id} style={{ marginBottom: 8 }}>
                  {tierName} — {p.amountKzt.toLocaleString('ru-RU')} ₸
                  {' · '}
                  {new Date(p.paidAt).toLocaleDateString(locale === 'kk' ? 'kk-KZ' : 'ru-RU')}
                  {p.isMock ? ` · ${ui.ownerPlanMockPaymentTag}` : ''}
                  {' · '}
                  {p.status}
                </li>
              );
              })}
            </ul>
          )}
        </section>
      )}

      <div className="plan-grid">
        {catalog.map((plan) => {
          const isCurrent = effectiveTier != null && effectiveTier === plan.tier;
          const isDowngrade =
            plan.tier === 'FREE' && effectiveTier != null && effectiveTier !== 'FREE';
          return (
            <section
              key={plan.tier}
              className={`form-card plan-card${isCurrent ? ' plan-card-current' : ''}`}
            >
              {isCurrent && <span className="plan-badge">{ui.__4c29c5}</span>}
              <h2 style={{ margin: '0 0 4px' }}>{plan.nameRu}</h2>
              <p className="plan-price">
                {formatPrice(plan.priceKzt)}
                <span> / {formatPeriod(ui, plan.periodDays, plan.priceKzt)}</span>
              </p>
              <ul className="plan-features" style={{ fontSize: '0.85rem', marginTop: 8 }}>
                <li>Фото: {plan.limits.maxPhotos}</li>
                <li>Товары/услуги: {plan.limits.maxServiceItems}</li>
                <li>Акции: {plan.limits.maxActivePromotions}</li>
                <li>Менеджеры: {plan.limits.maxManagers}</li>
                <li>Ответы на отзывы: {plan.limits.canReplyToReviews ? ui.text_81c9da : ui.text_df28b6}</li>
                <li>Аналитика: {analyticsLevelLabel(locale, ui, plan.limits.analyticsTier)}</li>
                <li>
                  Бонус на рекламу QalaGo:{' '}
                  {plan.limits.monthlyAdBonusKzt > 0
                    ? ui.text_d8d7ab
                    : '—'}
                </li>
                <li>Скидка на рекламу: {plan.limits.advertisingDiscountPercent}%</li>
              </ul>
              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {plan.tier === 'VIP' && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>{ui.____a5f597}</p>
              )}
              {!canView ? (
                <button type="button" className="btn btn-ghost" disabled>{ui.text_ab6cb7}</button>
              ) : isCurrent ? (
                <button type="button" className="btn btn-ghost" disabled>{ui.text_318150}</button>
              ) : !businessWebMockPlanCheckoutEnabled ? (
                <button type="button" className="btn btn-ghost" disabled>{ui.__12b9df}</button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  disabled={!planStatus || !canManage || checkoutTier === plan.tier}
                  onClick={() => onCheckout(plan.tier)}
                  title={!canManage ? ui.____ab83e1 : undefined}
                >
                  {checkoutTier === plan.tier
                    ? ui.text_2d3f73
                    : !canManage
                      ? ui.___7097f8
                      : isDowngrade
                        ? ui.__free_3507fe
                        : plan.priceKzt === 0
                          ? ui.text_2b02ca
                          : ui.__3858f6}
                </button>
              )}
            </section>
          );
        })}
      </div>

      <section className="form-card" style={{ marginTop: 16, maxWidth: 720 }}>
        <h3 style={{ marginTop: 0 }}>{ui.___qalago_248e3f}</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
          {ui.text_planBonus1}
          {ui.text_planBonus2}
          {ui.text_planBonus3}
        </p>
        <h3>{ui.__0d3630}</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
          {ui.text_planDisclaimer1}
          {ui.text_planDisclaimer2}
          {ui.text_planDisclaimer3}
        </p>
        {businessWebMockPlanCheckoutEnabled ? (
          <>
            <h3>{ui.__16995d}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{ui.____4f4875}</p>
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{ui.____eba489}</p>
        )}
        <Link href="/help" className="btn btn-ghost">{ui.____289a51}</Link>
      </section>
        </>
      )}
    </BusinessShell>
  );
}
