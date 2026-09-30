'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import type { MonetizationQuote } from '@/lib/api';
import { formatDate, formatDateTime, formatDuration, formatKzt } from '@/lib/monetization-utils';
import {
  monetizationQuoteNextAvailableLabel,
  monetizationQuotePeriodLabel,
  monetizationQuoteStartLabel,
} from '@/lib/owner-visual-copy';

type QuoteCardProps = {
  quote: MonetizationQuote | null;
  loading?: boolean;
  error?: string | null;
};

export function QuoteCard({ quote, loading, error }: QuoteCardProps) {
  const locale = useLocale();
  const ui = useUi();

  if (loading) {
    return (
      <section className="form-card quote-card">
        <h3 style={{ marginTop: 0 }}>{ui.__5a427f}</h3>
        <p style={{ color: 'var(--text-muted)' }}>{ui.__85a5da}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="form-card quote-card">
        <h3 style={{ marginTop: 0 }}>{ui.__5a427f}</h3>
        <div className="alert alert-error">{error}</div>
      </section>
    );
  }

  if (!quote) {
    return (
      <section className="form-card quote-card">
        <h3 style={{ marginTop: 0 }}>{ui.__5a427f}</h3>
        <p style={{ color: 'var(--text-muted)' }}>{ui.____0b7361}</p>
      </section>
    );
  }

  const title = quote.product?.name ?? quote.package?.name ?? ui.text_30474d;

  return (
    <section className="form-card quote-card">
      <h3 style={{ marginTop: 0 }}>{ui.__5a427f}</h3>
      <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>{title}</p>

      {quote.duration && (
        <p style={{ fontSize: '0.9rem' }}>
          {monetizationQuotePeriodLabel(locale)}{' '}
          {formatDuration(locale, quote.duration.durationDays ?? null, quote.duration.durationHours ?? null)}
        </p>
      )}

      {quote.requestedStartAt && (
        <p style={{ fontSize: '0.9rem' }}>
          {monetizationQuoteStartLabel(locale)} {formatDateTime(quote.requestedStartAt)}
          {quote.calculatedEndAt && ` — ${formatDate(quote.calculatedEndAt)}`}
        </p>
      )}

      <dl className="detail-grid compact">
        <dt>{ui.__4c9370}</dt>
        <dd>{formatKzt(quote.basePrice, quote.currency)}</dd>
        {quote.discountPercent > 0 && (
          <>
            <dt>{ui.__6a0817}</dt>
            <dd>
              −{formatKzt(quote.discountAmount, quote.currency)} ({quote.discountPercent}%)
            </dd>
          </>
        )}
        <dt>{ui.__0fb4d5}</dt>
        <dd>
          <strong>{formatKzt(quote.finalPrice, quote.currency)}</strong>
        </dd>
      </dl>

      {!quote.availability.available && (
        <div className="alert alert-error" style={{ marginTop: 12 }}>
          {quote.availability.reason ?? ui.____3fb263}
          {quote.availability.nextAvailableAt && (
            <span>
              {' '}
              {monetizationQuoteNextAvailableLabel(locale)}{' '}
              {formatDateTime(quote.availability.nextAvailableAt)}
            </span>
          )}
        </div>
      )}

      {quote.availability.available && (
        <p style={{ color: 'var(--success)', fontSize: '0.88rem', marginBottom: 0 }}>{ui.____25686f}</p>
      )}
    </section>
  );
}
