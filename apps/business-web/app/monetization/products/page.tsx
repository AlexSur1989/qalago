'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MonetizationProduct, ownerApi } from '@/lib/api';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import {
  formatDate,
  formatDuration,
  formatKzt,
  parseApiError,
  productLabel,
  productOwnerDescription,
  purchaseActionLabel,
  purchaseStateLabel,
} from '@/lib/monetization-utils';
import { monetizationProductsPageMeta } from '@/lib/owner-visual-copy';
import {
  promoteSubjectBusinessLabel,
  promoteSubjectPromotionLabel,
  promoteBackToSubjectChoice,
  promoteWhatTitle,
} from '@/lib/owner-visual-copy';
import type { MonetizationPromoteSubject } from '@/lib/monetization-owner-ui';
import {
  filterProductsByPromoteSubject,
} from '@/lib/monetization-owner-ui';
import type { MonetizationPurchaseState } from '@/lib/api';

function parseSubject(raw: string | null): MonetizationPromoteSubject | null {
  if (raw === 'business' || raw === 'promotion') return raw;
  return null;
}

export default function MonetizationProductsPage() {
  const locale = useLocale();
  const ui = useUi();
  const searchParams = useSearchParams();
  const subject = parseSubject(searchParams.get('subject'));

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
        if (!cancelled) setError(parseApiError(locale, err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, business, locale]);

  const visibleProducts = useMemo(() => {
    if (!subject) return [];
    return filterProductsByPromoteSubject(products, subject);
  }, [products, subject]);

  function renderProductGrid() {
    return (
      <div className="catalog-grid">
        {visibleProducts.map((product) => {
          const minPrice = product.durations.reduce(
            (min, d) => (d.finalPrice < min ? d.finalPrice : min),
            product.durations[0]?.finalPrice ?? Infinity,
          );
          const minDuration = product.durations[0];
          const state = purchaseStates[product.code];
          const ownerDesc = productOwnerDescription(locale, product.code);
          const detail =
            state?.state === 'ACTIVE' && state.activeUntil
              ? ui.__c6125a
              : state?.state === 'SCHEDULED' && state.scheduledStart && state.scheduledEnd
                ? `${formatDate(state.scheduledStart)} — ${formatDate(state.scheduledEnd)}`
                : state?.state === 'SOLD_OUT' && state.nextAvailableAt
                  ? ui.___c312bc
                  : null;
          const href =
            state?.primaryAction === 'CONTINUE_PAYMENT' && state.pendingOrderId
              ? `/monetization/orders/${state.pendingOrderId}`
              : `/monetization/products/${product.code}`;
          const cta =
            state?.primaryAction === 'CONTINUE_PAYMENT'
              ? purchaseActionLabel(locale, state.primaryAction)
              : state?.primaryAction === 'RENEW'
                ? purchaseActionLabel(locale, 'RENEW')
                : state?.state === 'SOLD_OUT'
                  ? purchaseStateLabel(locale, state.state)
                  : ui.text_0b4604;
          return (
            <section key={product.code} className="form-card catalog-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <h2 style={{ margin: '0 0 8px', fontSize: '1.05rem' }}>
                  {productLabel(locale, product.code)}
                </h2>
                {state && (
                  <span className="badge" style={{ alignSelf: 'flex-start' }}>
                    {purchaseStateLabel(locale, state.state)}
                  </span>
                )}
              </div>
              {ownerDesc && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{ownerDesc}</p>
              )}
              {detail && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 8px' }}>
                  {detail}
                </p>
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
                      / {formatDuration(locale, minDuration.durationDays ?? null, minDuration.durationHours ?? null)}
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
    );
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{ui.__ebd04c}</h1>
          <p className="page-header-meta">
            {monetizationProductsPageMeta(locale, business.title)}
          </p>
        </div>
        {subject && (
          <Link href="/monetization/products" className="btn btn-ghost btn-sm">
            {promoteBackToSubjectChoice(locale)}
          </Link>
        )}
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p style={{ color: 'var(--text-muted)' }}>{ui.__c53959}</p>}

      {!loading && products.length === 0 && (
        <section className="form-card">
          <p style={{ color: 'var(--text-muted)' }}>{ui.____187ccf}</p>
        </section>
      )}

      {!loading && products.length > 0 && !subject && (
        <section className="form-card" style={{ maxWidth: 640 }}>
          <h2 style={{ marginTop: 0 }}>{promoteWhatTitle(locale)}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/monetization/products?subject=business" className="btn">
              {promoteSubjectBusinessLabel(locale)}
            </Link>
            <Link href="/monetization/products?subject=promotion" className="btn btn-secondary">
              {promoteSubjectPromotionLabel(locale)}
            </Link>
          </div>
        </section>
      )}

      {!loading && subject && visibleProducts.length === 0 && (
        <section className="form-card">
          <p style={{ color: 'var(--text-muted)' }}>{ui.____187ccf}</p>
        </section>
      )}

      {!loading && subject && visibleProducts.length > 0 && renderProductGrid()}
    </>
  );
}
