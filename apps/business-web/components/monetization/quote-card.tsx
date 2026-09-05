'use client';

import type { MonetizationQuote } from '@/lib/api';
import { formatDate, formatDateTime, formatDuration, formatKzt } from '@/lib/monetization-utils';

type QuoteCardProps = {
  quote: MonetizationQuote | null;
  loading?: boolean;
  error?: string | null;
};

export function QuoteCard({ quote, loading, error }: QuoteCardProps) {
  if (loading) {
    return (
      <section className="form-card quote-card">
        <h3 style={{ marginTop: 0 }}>Расчёт стоимости</h3>
        <p style={{ color: 'var(--text-muted)' }}>Загрузка расчёта…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="form-card quote-card">
        <h3 style={{ marginTop: 0 }}>Расчёт стоимости</h3>
        <div className="alert alert-error">{error}</div>
      </section>
    );
  }

  if (!quote) {
    return (
      <section className="form-card quote-card">
        <h3 style={{ marginTop: 0 }}>Расчёт стоимости</h3>
        <p style={{ color: 'var(--text-muted)' }}>Выберите параметры для расчёта.</p>
      </section>
    );
  }

  const title = quote.product?.name ?? quote.package?.name ?? 'Размещение';

  return (
    <section className="form-card quote-card">
      <h3 style={{ marginTop: 0 }}>Расчёт стоимости</h3>
      <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>{title}</p>

      {quote.duration && (
        <p style={{ fontSize: '0.9rem' }}>
          Период:{' '}
          {formatDuration(quote.duration.durationDays ?? null, quote.duration.durationHours ?? null)}
        </p>
      )}

      {quote.requestedStartAt && (
        <p style={{ fontSize: '0.9rem' }}>
          Старт: {formatDateTime(quote.requestedStartAt)}
          {quote.calculatedEndAt && ` — ${formatDate(quote.calculatedEndAt)}`}
        </p>
      )}

      <dl className="detail-grid compact">
        <dt>Базовая цена</dt>
        <dd>{formatKzt(quote.basePrice, quote.currency)}</dd>
        {quote.discountPercent > 0 && (
          <>
            <dt>Скидка тарифа</dt>
            <dd>
              −{formatKzt(quote.discountAmount, quote.currency)} ({quote.discountPercent}%)
            </dd>
          </>
        )}
        <dt>К оплате</dt>
        <dd>
          <strong>{formatKzt(quote.finalPrice, quote.currency)}</strong>
        </dd>
      </dl>

      {!quote.availability.available && (
        <div className="alert alert-error" style={{ marginTop: 12 }}>
          {quote.availability.reason ?? 'Размещение недоступно на выбранные даты.'}
          {quote.availability.nextAvailableAt && (
            <span>
              {' '}
              Ближайшая дата: {formatDateTime(quote.availability.nextAvailableAt)}
            </span>
          )}
        </div>
      )}

      {quote.availability.available && (
        <p style={{ color: 'var(--success)', fontSize: '0.88rem', marginBottom: 0 }}>
          Размещение доступно на выбранный период.
        </p>
      )}
    </section>
  );
}
