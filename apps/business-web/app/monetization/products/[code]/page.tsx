'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MonetizationProduct,
  MonetizationQuote,
  PromotionRow,
  ownerApi,
} from '@/lib/api';
import { QuoteCard } from '@/components/monetization/quote-card';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import {
  formatDuration,
  parseApiError,
  productLabel,
} from '@/lib/monetization-utils';

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function MonetizationProductDetailPage() {
  const params = useParams<{ code: string }>();
  const productCode = params.code;
  const router = useRouter();
  const { token, business } = useMonetizationContext();

  const [product, setProduct] = useState<MonetizationProduct | null>(null);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [durationIndex, setDurationIndex] = useState(0);
  const [desiredStartAt, setDesiredStartAt] = useState(toDateInputValue(new Date()));
  const [promotionId, setPromotionId] = useState('');
  const [quote, setQuote] = useState<MonetizationQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPromotedPromotion = productCode === 'PROMOTED_PROMOTION';
  const isVipBanner = productCode === 'VIP_BANNER';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      ownerApi.getMonetizationProduct(token, productCode, {
        businessId: business.id,
        citySlug: business.city?.slug,
        categoryId: business.categoryId,
      }),
      isPromotedPromotion
        ? ownerApi.listPromotions(token, business.id)
        : Promise.resolve({ items: [] as PromotionRow[] }),
    ])
      .then(([prod, promos]) => {
        if (cancelled) return;
        setProduct(prod);
        setPromotions(promos.items.filter((p) => p.status === 'ACTIVE'));
        if (promos.items.length > 0) setPromotionId(promos.items[0].id);
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
  }, [token, business, productCode, isPromotedPromotion]);

  const selectedDuration = product?.durations[durationIndex] ?? null;

  const fetchQuote = useCallback(async () => {
    if (!selectedDuration) return;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const body: Record<string, unknown> = {
        businessId: business.id,
        productCode,
        desiredStartAt: new Date(desiredStartAt).toISOString(),
      };
      if (selectedDuration.durationDays != null) {
        body.durationDays = selectedDuration.durationDays;
      }
      if (selectedDuration.durationHours != null) {
        body.durationHours = selectedDuration.durationHours;
      }
      if (isPromotedPromotion && promotionId) {
        body.promotionId = promotionId;
      }
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
    selectedDuration,
    desiredStartAt,
    isPromotedPromotion,
    promotionId,
  ]);

  useEffect(() => {
    if (!product || !selectedDuration) return;
    if (isPromotedPromotion && !promotionId) return;
    fetchQuote().catch(() => undefined);
  }, [product, selectedDuration, desiredStartAt, promotionId, isPromotedPromotion, fetchQuote]);

  const checkoutParams = useMemo(() => {
    const q = new URLSearchParams({ productCode });
    if (selectedDuration?.durationDays != null) {
      q.set('durationDays', String(selectedDuration.durationDays));
    }
    if (selectedDuration?.durationHours != null) {
      q.set('durationHours', String(selectedDuration.durationHours));
    }
    q.set('desiredStartAt', new Date(desiredStartAt).toISOString());
    if (isPromotedPromotion && promotionId) q.set('promotionId', promotionId);
    return q.toString();
  }, [productCode, selectedDuration, desiredStartAt, isPromotedPromotion, promotionId]);

  function onContinue() {
    if (!quote?.availability.available) return;
    if (isVipBanner) {
      router.push(`/monetization/vip-creative?${checkoutParams}`);
      return;
    }
    router.push(`/monetization/checkout?${checkoutParams}`);
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>;
  if (error || !product) {
    return <div className="alert alert-error">{error ?? 'Продукт не найден'}</div>;
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{productLabel(product.code)}</h1>
          <p className="page-header-meta">{product.description ?? business.title}</p>
        </div>
        <Link href="/monetization/products" className="btn btn-ghost btn-sm">
          ← К каталогу
        </Link>
      </header>

      <div className="checkout-layout">
        <section className="form-card">
          <h2 style={{ marginTop: 0 }}>Параметры</h2>

          <label className="field-label">
            Длительность
            <div className="radio-row">
              {product.durations.map((d, idx) => (
                <label key={idx} className="radio-row-item">
                  <input
                    type="radio"
                    name="duration"
                    checked={durationIndex === idx}
                    onChange={() => setDurationIndex(idx)}
                  />
                  {formatDuration(d.durationDays ?? null, d.durationHours ?? null)}
                </label>
              ))}
            </div>
          </label>

          <label className="field-label">
            Дата начала
            <input
              type="date"
              value={desiredStartAt}
              onChange={(e) => setDesiredStartAt(e.target.value)}
            />
          </label>

          {isPromotedPromotion && (
            <label className="field-label">
              Акция для продвижения
              {promotions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Нет активных акций.{' '}
                  <Link href={`/business/${business.id}/promotions`}>Создать акцию</Link>
                </p>
              ) : (
                <select value={promotionId} onChange={(e) => setPromotionId(e.target.value)}>
                  {promotions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              )}
            </label>
          )}

          {isVipBanner && (
            <div className="alert" style={{ marginTop: 12 }}>
              Для VIP-баннера нужно загрузить креатив. После оформления заказа баннер отправится
              на модерацию.
            </div>
          )}
        </section>

        <div>
          <QuoteCard quote={quote} loading={quoteLoading} error={quoteError} />
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={
                !quote?.availability.available ||
                quoteLoading ||
                (isPromotedPromotion && !promotionId)
              }
              onClick={onContinue}
            >
              {isVipBanner ? 'Далее: креатив баннера' : 'Перейти к оформлению'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
