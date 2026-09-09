'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BusinessPlanStatus,
  PlanCatalogRow,
  ownerApi,
} from '@/lib/api';
import {
  buildFooterNavItems,
  buildMainNavItems,
  canViewPayments,
  filterNavByAccess,
  isOwner,
  PAYMENTS_ACCESS_DENIED_RU,
} from '@/lib/business-access';
import { businessWebMockPlanCheckoutEnabled } from '@/lib/auth-config';
import { parseApiError } from '@/lib/monetization-utils';
import { useBusinessAccess } from '@/lib/use-business-access';
import { BusinessShell } from '@/components/business-shell';

function formatPrice(priceKzt: number) {
  if (priceKzt === 0) return '0 ₸';
  return `${priceKzt.toLocaleString('ru-RU')} ₸`;
}

function formatPeriod(periodDays: number | null) {
  if (periodDays == null) return 'навсегда';
  return `${periodDays} дн.`;
}

export default function PlanPage() {
  const { token, user, ready, logout, business, access, businesses } = useBusinessAccess();
  const [catalog, setCatalog] = useState<PlanCatalogRow[]>([]);
  const [planStatus, setPlanStatus] = useState<BusinessPlanStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutTier, setCheckoutTier] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canView = canViewPayments(access);
  const canManage = isOwner(access);

  const mainNav = useMemo(
    () => filterNavByAccess(buildMainNavItems(), access),
    [access],
  );
  const footerNav = useMemo(
    () => filterNavByAccess(buildFooterNavItems(), access),
    [access],
  );

  const load = useCallback(async () => {
    if (!token || !business) return;
    setLoading(true);
    setError(null);
    try {
      const plans = await ownerApi.listPlans();
      setCatalog(plans);

      if (canView) {
        setPlanStatus(await ownerApi.getBusinessPlan(token, business.id));
      } else {
        setPlanStatus(null);
      }
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, business?.id, canView]);

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
      setError(parseApiError(err));
    } finally {
      setCheckoutTier(null);
    }
  }

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

  const effectiveTier = planStatus?.effectiveTier;

  return (
    <BusinessShell
      activeNav="plan"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
      mainNav={mainNav}
      footerNav={footerNav}
    >
      <header className="page-header">
        <div>
          <h1>Тариф</h1>
          <p className="page-header-meta">
            Подписка для лимитов и скидки на рекламу — {business?.title ?? 'заведения'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/monetization" className="btn">
            Реклама и продвижение
          </Link>
          <Link href="/dashboard" className="btn btn-ghost">
            ← На главную
          </Link>
        </div>
      </header>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Загрузка тарифов…</p>}
      {!loading && !canView && (
        <div className="alert alert-error">{PAYMENTS_ACCESS_DENIED_RU}</div>
      )}
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {planStatus && (
        <section className="form-card" style={{ marginBottom: 16, maxWidth: 720 }}>
          <h3 style={{ marginTop: 0 }}>Текущий тариф: {planStatus.catalog.nameRu}</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
            Фото: {planStatus.usage.photos} / {planStatus.limits.maxPhotos}
            {planStatus.entitlements?.photos.overLimit && planStatus.entitlements.photos.published != null
              ? ` (публикуется ${planStatus.entitlements.photos.published})`
              : ''}
            {' · '}
            Товары/услуги: {planStatus.usage.serviceItems} / {planStatus.limits.maxServiceItems}
            {planStatus.entitlements?.serviceItems.overLimit && planStatus.entitlements.serviceItems.published != null
              ? ` (публикуется ${planStatus.entitlements.serviceItems.published})`
              : ''}
            {' · '}
            Акции: {planStatus.usage.activePromotions} / {planStatus.limits.maxActivePromotions}
            {planStatus.entitlements?.activePromotions.overLimit && planStatus.entitlements.activePromotions.published != null
              ? ` (публикуется ${planStatus.entitlements.activePromotions.published})`
              : ''}
          </p>
          {planStatus.entitlements?.overLimitNotice && (
            <p className="alert" style={{ marginBottom: 8, fontSize: '0.9rem' }}>
              {planStatus.entitlements.overLimitNotice}
            </p>
          )}
          {planStatus.expiresAt && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Действует до {new Date(planStatus.expiresAt).toLocaleDateString('ru-RU')}
            </p>
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
              {isCurrent && <span className="plan-badge">Текущий тариф</span>}
              <h2 style={{ margin: '0 0 4px' }}>{plan.nameRu}</h2>
              <p className="plan-price">
                {formatPrice(plan.priceKzt)}
                <span> / {formatPeriod(plan.periodDays)}</span>
              </p>
              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {plan.tier === 'VIP' && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Рекламные размещения приобретаются отдельно.
                </p>
              )}
              {!canView ? (
                <button type="button" className="btn btn-ghost" disabled>
                  Недоступно
                </button>
              ) : isCurrent ? (
                <button type="button" className="btn btn-ghost" disabled>
                  Активен
                </button>
              ) : !businessWebMockPlanCheckoutEnabled ? (
                <button type="button" className="btn btn-ghost" disabled>
                  Покупка недоступна
                </button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  disabled={!planStatus || !canManage || checkoutTier === plan.tier}
                  onClick={() => onCheckout(plan.tier)}
                  title={!canManage ? 'Изменить тариф может только владелец' : undefined}
                >
                  {checkoutTier === plan.tier
                    ? 'Подключение…'
                    : !canManage
                      ? 'Только для владельца'
                      : isDowngrade
                        ? 'Вернуться на Free'
                        : plan.priceKzt === 0
                          ? 'Выбрать'
                          : 'Подключить (тест)'}
                </button>
              )}
            </section>
          );
        })}
      </div>

      <section className="form-card" style={{ marginTop: 16, maxWidth: 720 }}>
        <h3 style={{ marginTop: 0 }}>Рекламные размещения</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
          Рекламные размещения приобретаются отдельно. Скидка тарифа применяется к отдельным
          рекламным продуктам согласно условиям.
        </p>
        {businessWebMockPlanCheckoutEnabled ? (
          <>
            <h3>Тестовая оплата</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
              Сейчас оплата имитируется без списания денег. Платные тарифы активируются на 30
              дней.
            </p>
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
            Оформление подписки через кабинет пока недоступно. Информация о тарифе отображается
            для справки.
          </p>
        )}
        <Link href="/help" className="btn btn-ghost">
          Перейти в раздел «Помощь»
        </Link>
      </section>
    </BusinessShell>
  );
}
