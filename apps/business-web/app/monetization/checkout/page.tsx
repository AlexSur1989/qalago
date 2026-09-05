'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { MonetizationOrder, MonetizationQuote, ownerApi } from '@/lib/api';
import { QuoteCard } from '@/components/monetization/quote-card';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import { formatKzt, parseApiError, productLabel } from '@/lib/monetization-utils';

export default function MonetizationCheckoutPage() {
  return (
    <Suspense fallback={<p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { token, business } = useMonetizationContext();

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

  const fetchQuote = useCallback(async () => {
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
      setQuoteError(parseApiError(err));
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
  ]);

  useEffect(() => {
    fetchQuote().catch(() => undefined);
  }, [fetchQuote]);

  async function onSubmit() {
    if (!quote?.availability.available) return;
    setSubmitting(true);
    setError(null);
    try {
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
        setError('Не указан продукт или пакет');
        return;
      }
      setOrder(created);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!productCode && !packageCode) {
    return (
      <div className="alert alert-error">
        Не указан продукт или пакет.{' '}
        <Link href="/monetization/products">Вернуться в каталог</Link>
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
            <h1>Заказ создан</h1>
            <p className="page-header-meta">{order.orderNumber}</p>
          </div>
        </header>

        <section className="form-card" style={{ maxWidth: 640 }}>
          <p style={{ marginTop: 0 }}>
            Заказ на сумму{' '}
            <strong>{formatKzt(order.totalAmount, order.currency)}</strong> оформлен и ожидает
            оплаты.
          </p>
          {pendingPayment && (
            <div className="alert" style={{ marginBottom: 16 }}>
              Для активации размещения переведите сумму по реквизитам, указанным в разделе
              «Помощь», и дождитесь подтверждения оплаты администратором. Автоматического списания
              нет — статус заказа обновится после ручного подтверждения.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href={`/monetization/orders/${order.id}`} className="btn">
              Детали заказа
            </Link>
            <Link href="/monetization/orders" className="btn btn-ghost">
              Мои заказы
            </Link>
          </div>
        </section>
      </>
    );
  }

  const title = productCode
    ? productLabel(productCode)
    : quote?.package?.name ?? packageCode ?? 'Оформление';

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Оформление заказа</h1>
          <p className="page-header-meta">{title}</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="checkout-layout">
        <section className="form-card">
          <h2 style={{ marginTop: 0 }}>Подтверждение</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Заведение: <strong>{business.title}</strong>
          </p>
          {creativeId && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Креатив VIP-баннера привязан к заказу и будет отправлен на модерацию после оплаты.
            </p>
          )}
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Нажимая «Создать заказ», вы подтверждаете заказ. Оплата производится вручную — заказ
            перейдёт в статус «Оплачен» только после подтверждения администратором.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!quote?.availability.available || quoteLoading || submitting}
            onClick={onSubmit}
          >
            {submitting ? 'Создание заказа…' : 'Создать заказ'}
          </button>
        </section>

        <QuoteCard quote={quote} loading={quoteLoading} error={quoteError} />
      </div>
    </>
  );
}
