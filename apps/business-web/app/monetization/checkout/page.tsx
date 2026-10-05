'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { MonetizationOrder, MonetizationQuote, ownerApi } from '@/lib/api';
import { QuoteCard } from '@/components/monetization/quote-card';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import { formatKzt, parseApiError, productLabel } from '@/lib/monetization-utils';
import { usePlatformFeatures } from '@/components/platform-features-provider';
import { monetizationPurchasesDisabledNotice } from '@/lib/platform-monetization-ui';
import {
  ContextualLegalAcceptance,
  type ContextualLegalAcceptanceHandle,
} from '@/components/legal/contextual-legal-acceptance';

export default function MonetizationCheckoutPage() {
  const locale = useLocale();
  const ui = useUi();

  return (
    <Suspense fallback={<p style={{ color: 'var(--text-muted)' }}>{ui.text_89d69a}</p>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const locale = useLocale();
  const ui = useUi();
  const searchParams = useSearchParams();
  const { token, business } = useMonetizationContext();
  const { canPurchaseAds } = usePlatformFeatures();

  const productCode = searchParams.get('productCode');
  const packageCode = searchParams.get('packageCode');
  const durationDays = searchParams.get('durationDays');
  const durationHours = searchParams.get('durationHours');
  const desiredStartAt = searchParams.get('desiredStartAt');
  const promotionId = searchParams.get('promotionId');
  const creativeId = searchParams.get('creativeId');

  const [quote, setQuote] = useState<MonetizationQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<MonetizationOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const checkoutLegalRef = useRef<ContextualLegalAcceptanceHandle>(null);

  const fetchQuote = useCallback(async () => {
    if (!canPurchaseAds) return;
    if (!productCode && !packageCode) return;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const body: Record<string, unknown> = { businessId: business.id };
      if (productCode) body.productCode = productCode;
      if (packageCode) body.packageCode = packageCode;
      if (durationDays) body.durationDays = Number(durationDays);
      if (durationHours) body.durationHours = Number(durationHours);
      if (desiredStartAt) body.desiredStartAt = desiredStartAt;
      if (promotionId) body.promotionId = promotionId;
      const result = await ownerApi.monetizationQuote(token, body);
      setQuote(result);
    } catch (err) {
      setQuote(null);
      setQuoteError(parseApiError(locale, err));
    } finally {
      setQuoteLoading(false);
    }
  }, [
    token,
    business.id,
    productCode,
    packageCode,
    durationDays,
    durationHours,
    desiredStartAt,
    promotionId,
    canPurchaseAds,
  ]);

  useEffect(() => {
    fetchQuote().catch(() => undefined);
  }, [fetchQuote]);

  if (!canPurchaseAds) {
    return (
      <section className="form-card" style={{ maxWidth: 640 }}>
        <p style={{ margin: 0 }}>{monetizationPurchasesDisabledNotice(locale)}</p>
        <Link href="/monetization" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
          {ui.__41649d}
        </Link>
      </section>
    );
  }

  async function onSubmit() {
    if (!quote?.availability.available) return;
    setSubmitting(true);
    setError(null);
    try {
      const legalOk = (await checkoutLegalRef.current?.ensureAccepted()) ?? true;
      if (!legalOk) return;
      let created: MonetizationOrder;
      if (packageCode) {
        const body: Record<string, unknown> = {
          businessId: business.id,
          packageCode,
        };
        if (desiredStartAt) body.desiredStartAt = desiredStartAt;
        if (promotionId) body.promotionId = promotionId;
        if (creativeId) body.creativeId = creativeId;
        created = await ownerApi.createMonetizationOrder(token, body);
      } else if (productCode) {
        const item: Record<string, unknown> = { productCode };
        if (durationDays) item.durationDays = Number(durationDays);
        if (durationHours) item.durationHours = Number(durationHours);
        if (desiredStartAt) item.desiredStartAt = desiredStartAt;
        if (promotionId) item.promotionId = promotionId;
        if (creativeId) item.creativeId = creativeId;
        created = await ownerApi.createMonetizationOrder(token, {
          businessId: business.id,
          items: [item],
        });
      } else {
        setError(ui.____20b773);
        return;
      }
      setOrder(created);
    } catch (err) {
      setError(parseApiError(locale, err));
      await checkoutLegalRef.current?.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (!productCode && !packageCode) {
    return (
      <div className="alert alert-error">
        {ui.checkoutMissingProductOrPackage}{' '}
        <Link href="/monetization/products">{ui.___bad998}</Link>
      </div>
    );
  }

  if (order) {
    const pendingPayment = order.payments?.find(
      (p) => p.status === 'PENDING' && p.provider === 'MANUAL',
    );
    return (
      <>
        <header className="page-header">
          <div>
            <h1>{ui.__4dc0ec}</h1>
            <p className="page-header-meta">{order.orderNumber}</p>
          </div>
        </header>

        <section className="form-card" style={{ maxWidth: 640 }}>
          <p style={{ marginTop: 0 }}>
            {ui.checkoutOrderAmountPrefix}{' '}
            <strong>{formatKzt(order.totalAmount, order.currency)}</strong>{ui.____58afde}</p>
          {pendingPayment && (
            <div className="alert" style={{ marginBottom: 16 }}>
              {ui.text_checkoutManualPay1}
              {ui.text_checkoutManualPay2}
              {ui.text_checkoutManualPay3}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href={`/monetization/orders/${order.id}`} className="btn">{ui.__e7b2f6}</Link>
            <Link href="/monetization/orders" className="btn btn-ghost">{ui.__1c4a26}</Link>
          </div>
        </section>
      </>
    );
  }

  const title = productCode
    ? productLabel(locale, productCode)
    : quote?.package?.name ?? packageCode ?? ui.text_065a4b;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{ui.__f50d06}</h1>
          <p className="page-header-meta">{title}</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="checkout-layout">
        <section className="form-card">
          <h2 style={{ marginTop: 0 }}>{ui.text_849983}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{ui.text_5427be}<strong>{business.title}</strong>
          </p>
          {creativeId && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{ui._vip___89ff3c}</p>
          )}
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {ui.text_checkoutCreateOrder1}
            {ui.text_checkoutCreateOrder2}
          </p>
          <ContextualLegalAcceptance
            ref={checkoutLegalRef}
            token={token}
            locale={locale}
            context="AD_PURCHASE"
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={!quote?.availability.available || quoteLoading || submitting}
            onClick={onSubmit}
          >
            {submitting ? ui.__330e3e : ui.__49a9d5}
          </button>
        </section>

        <QuoteCard quote={quote} loading={quoteLoading} error={quoteError} />
      </div>
    </>
  );
}
