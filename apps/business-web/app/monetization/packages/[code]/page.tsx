'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MonetizationPackage,
  MonetizationQuote,
  PromotionRow,
  ownerApi,
} from '@/lib/api';
import { QuoteCard } from '@/components/monetization/quote-card';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import {
  formatDuration,
  packageHasPromotedPromotion,
  packageHasVip,
  parseApiError,
  productLabel,
} from '@/lib/monetization-utils';

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function MonetizationPackageDetailPage() {
  const params = useParams<{ code: string }>();
  const packageCode = params.code;
  const router = useRouter();
  const { token, business } = useMonetizationContext();

  const [pkg, setPkg] = useState<MonetizationPackage | null>(null);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [desiredStartAt, setDesiredStartAt] = useState(toDateInputValue(new Date()));
  const [promotionId, setPromotionId] = useState('');
  const [quote, setQuote] = useState<MonetizationQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasVip = pkg ? packageHasVip(pkg) : false;
  const needsPromotion = pkg ? packageHasPromotedPromotion(pkg) : false;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      ownerApi.listMonetizationPackages(token),
      ownerApi.listPromotions(token, business.id),
    ])
      .then(([packages, promos]) => {
        if (cancelled) return;
        const found = packages.find((p) => p.code === packageCode) ?? null;
        setPkg(found);
        const active = promos.items.filter((p) => p.status === 'ACTIVE');
        setPromotions(active);
        if (active.length > 0) setPromotionId(active[0].id);
        if (!found) setError('Пакет не найден');
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
  }, [token, business.id, packageCode]);

  const fetchQuote = useCallback(async () => {
    if (!pkg) return;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const body: Record<string, unknown> = {
        businessId: business.id,
        packageCode: pkg.code,
        desiredStartAt: new Date(desiredStartAt).toISOString(),
      };
      if (needsPromotion && promotionId) body.promotionId = promotionId;
      const result = await ownerApi.monetizationQuote(token, body);
      setQuote(result);
    } catch (err) {
      setQuote(null);
      setQuoteError(parseApiError(err));
    } finally {
      setQuoteLoading(false);
    }
  }, [token, business.id, pkg, desiredStartAt, needsPromotion, promotionId]);

  useEffect(() => {
    if (!pkg) return;
    if (needsPromotion && !promotionId) return;
    fetchQuote().catch(() => undefined);
  }, [pkg, desiredStartAt, promotionId, needsPromotion, fetchQuote]);

  const checkoutParams = useMemo(() => {
    const q = new URLSearchParams({ packageCode });
    q.set('desiredStartAt', new Date(desiredStartAt).toISOString());
    if (needsPromotion && promotionId) q.set('promotionId', promotionId);
    return q.toString();
  }, [packageCode, desiredStartAt, needsPromotion, promotionId]);

  function onContinue() {
    if (!quote?.availability.available) return;
    if (hasVip) {
      router.push(`/monetization/vip-creative?${checkoutParams}`);
      return;
    }
    router.push(`/monetization/checkout?${checkoutParams}`);
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>;
  if (error || !pkg) {
    return <div className="alert alert-error">{error ?? 'Пакет не найден'}</div>;
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{pkg.name}</h1>
          <p className="page-header-meta">{pkg.description ?? 'Пакет продвижения'}</p>
        </div>
        <Link href="/monetization/packages" className="btn btn-ghost btn-sm">
          ← К пакетам
        </Link>
      </header>

      <div className="checkout-layout">
        <section className="form-card">
          <h2 style={{ marginTop: 0 }}>Состав пакета</h2>
          <ul style={{ paddingLeft: 18 }}>
            {pkg.items.map((item, idx) => (
              <li key={`${item.productCode}-${idx}`} style={{ marginBottom: 6 }}>
                {productLabel(item.productCode)}
                {item.durationDays != null || item.durationHours != null
                  ? ` — ${formatDuration(item.durationDays ?? null, item.durationHours ?? null)}`
                  : ''}
                {item.quantity > 1 ? ` × ${item.quantity}` : ''}
              </li>
            ))}
          </ul>

          <label className="field-label">
            Желаемая дата начала
            <input
              type="date"
              value={desiredStartAt}
              onChange={(e) => setDesiredStartAt(e.target.value)}
            />
          </label>

          {needsPromotion && (
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

          {hasVip && (
            <div className="alert" style={{ marginTop: 12 }}>
              Пакет включает VIP-баннер. Сначала подготовьте креатив — период VIP-размещения
              начнётся после одобрения баннера. Остальные размещения пакета активируются после
              оплаты.
            </div>
          )}
        </section>

        <div>
          <QuoteCard quote={quote} loading={quoteLoading} error={quoteError} />
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={
                !quote?.availability.available ||
                quoteLoading ||
                (needsPromotion && !promotionId)
              }
              onClick={onContinue}
            >
              {hasVip ? 'Далее: креатив VIP-баннера' : 'Перейти к оформлению'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
