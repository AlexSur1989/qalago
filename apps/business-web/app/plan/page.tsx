'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  BusinessPlanStatus,
  BusinessRow,
  ownerApi,
  PlanCatalogRow,
} from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell, useSelectedBusiness } from '@/components/business-shell';

function formatPrice(priceKzt: number) {
  if (priceKzt === 0) return '0 ₸';
  return `${priceKzt.toLocaleString('ru-RU')} ₸`;
}

function formatPeriod(periodDays: number | null) {
  if (periodDays == null) return 'навсегда';
  return `${periodDays} дн.`;
}

export default function PlanPage() {
  const { token, user, ready, logout } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const business = useSelectedBusiness(businesses);
  const [catalog, setCatalog] = useState<PlanCatalogRow[]>([]);
  const [planStatus, setPlanStatus] = useState<BusinessPlanStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutTier, setCheckoutTier] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [myBusinesses, plans] = await Promise.all([
        ownerApi.listMyBusinesses(token),
        ownerApi.listPlans(),
      ]);
      setBusinesses(myBusinesses);
      setCatalog(plans);

      const selectedId =
        myBusinesses.find((b) => b.id === business?.id)?.id ?? myBusinesses[0]?.id;
      if (selectedId) {
        setPlanStatus(await ownerApi.getBusinessPlan(token, selectedId));
      } else {
        setPlanStatus(null);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [token, business?.id]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  async function onCheckout(tier: string) {
    if (!token || !planStatus) return;
    setCheckoutTier(tier);
    setError(null);
    setMessage(null);
    try {
      const result = await ownerApi.mockPlanCheckout(token, planStatus.businessId, tier);
      setPlanStatus(result.plan);
      setMessage(result.message);
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setCheckoutTier(null);
    }
  }

  if (!ready || !token) return <p className="page-content">Загрузка…</p>;

  const effectiveTier = planStatus?.effectiveTier ?? 'BASIC';

  return (
    <BusinessShell
      activeNav="plan"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      <header className="page-header">
        <div>
          <h1>Тариф и продвижение</h1>
          <p className="page-header-meta">
            Выберите план для роста видимости {business?.title ?? 'заведения'}
          </p>
        </div>
        <Link href="/dashboard" className="btn">
          ← На главную
        </Link>
      </header>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Загрузка тарифов…</p>}
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {planStatus && (
        <section className="form-card" style={{ marginBottom: 16, maxWidth: 720 }}>
          <h3 style={{ marginTop: 0 }}>Текущий тариф: {planStatus.catalog.nameRu}</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
            Фото: {planStatus.usage.photos}
            {planStatus.limits.maxPhotos != null ? ` / ${planStatus.limits.maxPhotos}` : ' · без лимита'}
            {' · '}
            Акции: {planStatus.usage.activePromotions} / {planStatus.limits.maxActivePromotions}
            {' · '}в ленте до {planStatus.limits.maxPromotionsInFeed}
          </p>
          {planStatus.expiresAt && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Действует до {new Date(planStatus.expiresAt).toLocaleDateString('ru-RU')}
            </p>
          )}
        </section>
      )}

      <div className="plan-grid">
        {catalog.map((plan) => {
          const isCurrent = effectiveTier === plan.tier;
          const isDowngrade =
            plan.tier === 'BASIC' && effectiveTier !== 'BASIC';
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
              {isCurrent ? (
                <button type="button" className="btn btn-ghost" disabled>
                  Активен
                </button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  disabled={!planStatus || checkoutTier === plan.tier}
                  onClick={() => onCheckout(plan.tier)}
                >
                  {checkoutTier === plan.tier
                    ? 'Подключение…'
                    : isDowngrade
                      ? 'Вернуться на Базовый'
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
        <h3 style={{ marginTop: 0 }}>Тестовая оплата</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
          Сейчас оплата имитируется без списания денег. После нажатия «Подключить (тест)» тариф
          активируется на 30 дней и применяются его ограничения и бонусы (VIP, топ, лимиты).
        </p>
        <Link href="/help" className="btn btn-ghost">
          Перейти в раздел «Помощь»
        </Link>
      </section>
    </BusinessShell>
  );
}
