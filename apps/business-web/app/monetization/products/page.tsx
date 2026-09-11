'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MonetizationProduct, ownerApi } from '@/lib/api';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import {
  formatDate,
  formatDuration,
  formatKzt,
  parseApiError,
  productLabel,
  purchaseActionLabel,
  purchaseStateLabel,
} from '@/lib/monetization-utils';
import type { MonetizationPurchaseState } from '@/lib/api';

export default function MonetizationProductsPage() {
  const { token, business } = useMonetizationContext();
  const [products, setProducts] = useState<MonetizationProduct[]>([]);
  const [purchaseStates, setPurchaseStates] = useState<
    Record<string, MonetizationPurchaseState>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      ownerApi.listMonetizationProducts(token, {
        businessId: business.id,
        citySlug: business.city?.slug,
        categoryId: business.categoryId,
      }),
      ownerApi.listMonetizationPurchaseStates(token, business.id),
    ])
      .then(([items, states]) => {
        if (!cancelled) {
          setProducts(items);
          setPurchaseStates(
            Object.fromEntries(states.map((s) => [s.productCode, s])),
          );
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
  }, [token, business]);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Рекламные продукты</h1>
          <p className="page-header-meta">Каталог размещений для {business.title}</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p style={{ color: 'var(--text-muted)' }}>Загрузка каталога…</p>}

      {!loading && products.length === 0 && (
        <section className="form-card">
          <p style={{ color: 'var(--text-muted)' }}>Продукты недоступны для вашего заведения.</p>
        </section>
      )}

      <div className="catalog-grid">
        {products.map((product) => {
          const minPrice = product.durations.reduce(
            (min, d) => (d.finalPrice < min ? d.finalPrice : min),
            product.durations[0]?.finalPrice ?? Infinity,
          );
          const minDuration = product.durations[0];
          const state = purchaseStates[product.code];
          const detail =
            state?.state === 'ACTIVE' && state.activeUntil
              ? `Активно до ${formatDate(state.activeUntil)}`
              : state?.state === 'SCHEDULED' && state.scheduledStart && state.scheduledEnd
                ? `${formatDate(state.scheduledStart)} — ${formatDate(state.scheduledEnd)}`
                : state?.state === 'SOLD_OUT' && state.nextAvailableAt
                  ? `Ближайшая доступная дата: ${formatDate(state.nextAvailableAt)}`
                  : null;
          const href =
            state?.primaryAction === 'CONTINUE_PAYMENT' && state.pendingOrderId
              ? `/monetization/orders/${state.pendingOrderId}`
              : `/monetization/products/${product.code}`;
          const cta =
            state?.primaryAction === 'CONTINUE_PAYMENT'
              ? purchaseActionLabel(state.primaryAction)
              : state?.primaryAction === 'RENEW'
                ? purchaseActionLabel('RENEW')
                : state?.state === 'SOLD_OUT'
                  ? purchaseStateLabel(state.state)
                  : 'Настроить';
          return (
            <section key={product.code} className="form-card catalog-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <h2 style={{ margin: '0 0 8px', fontSize: '1.05rem' }}>
                  {productLabel(product.code)}
                </h2>
                {state && (
                  <span className="badge" style={{ alignSelf: 'flex-start' }}>
                    {purchaseStateLabel(state.state)}
                  </span>
                )}
              </div>
              {detail && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 8px' }}>
                  {detail}
                </p>
              )}
              {product.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{product.description}</p>
              )}
              {product.durations.length > 0 && (
                <p style={{ margin: '12px 0' }}>
                  от{' '}
                  <strong>
                    {formatKzt(minPrice, product.durations[0]?.currency ?? 'KZT')}
                  </strong>
                  {minDuration && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      {' '}
                      / {formatDuration(minDuration.durationDays ?? null, minDuration.durationHours ?? null)}
                    </span>
                  )}
                </p>
              )}
              <Link
                href={href}
                className={`btn btn-sm${state?.state === 'SOLD_OUT' ? ' btn-secondary' : ''}`}
                aria-disabled={state?.state === 'SOLD_OUT'}
              >
                {cta}
              </Link>
            </section>
          );
        })}
      </div>
    </>
  );
}
