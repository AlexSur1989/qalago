'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MonetizationOrder, ownerApi } from '@/lib/api';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import {
  campaignStatusLabel,
  creativeStatusLabel,
  formatDate,
  formatDateTime,
  formatDuration,
  formatKzt,
  monetizationStatusClass,
  orderStatusLabel,
  parseApiError,
  paymentStatusLabel,
  productLabel,
} from '@/lib/monetization-utils';
import { monetizationOrderPageTitle } from '@/lib/owner-visual-copy';

export default function MonetizationOrderDetailPage() {
  const locale = useLocale();
  const ui = useUi();

  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const { token } = useMonetizationContext();
  const [order, setOrder] = useState<MonetizationOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ownerApi
      .getMonetizationOrder(token, orderId)
      .then((res) => {
        if (!cancelled) setOrder(res);
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
  }, [token, orderId]);

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>{ui.text_89d69a}</p>;
  if (error || !order) {
    return <div className="alert alert-error">{error ?? ui.___39747e}</div>;
  }

  const pendingPayment = order.payments?.find(
    (p) => p.status === 'PENDING' && p.provider === 'MANUAL',
  );
  const campaigns = order.campaigns ?? [];
  const vipCampaigns = campaigns.filter((c) => c.product.code === 'VIP_BANNER');
  const otherCampaigns = campaigns.filter((c) => c.product.code !== 'VIP_BANNER');
  const hasVipWaiting = vipCampaigns.some(
    (c) =>
      c.status === 'PENDING_MODERATION' ||
      c.creative?.moderationStatus === 'PENDING',
  );
  const hasMixedPackage =
    campaigns.length > 1 && vipCampaigns.length > 0 && otherCampaigns.length > 0;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{monetizationOrderPageTitle(locale, order.orderNumber)}</h1>
          <p className="page-header-meta">{formatDateTime(order.createdAt)}</p>
        </div>
        <Link href="/monetization/orders" className="btn btn-ghost btn-sm">{ui.__41649d}</Link>
      </header>

      {hasMixedPackage && hasVipWaiting && order.status === 'PAID' && (
        <div className="alert" style={{ marginBottom: 16 }}>
          {ui.text_orderPartialVip1}
          {ui.text_orderPartialVip2}
        </div>
      )}

      {pendingPayment && (
        <div className="alert" style={{ marginBottom: 16 }}>
          {ui.text_orderAwaitingPay1}
          {ui.text_orderAwaitingPay2}
        </div>
      )}

      <section className="form-card" style={{ marginBottom: 16 }}>
        <dl className="detail-grid">
          <dt>{ui.text_7203f7}</dt>
          <dd>
            <span className={monetizationStatusClass(order.status)}>
              {orderStatusLabel(locale, order.status)}
            </span>
          </dd>
          {order.paidAt && (
            <>
              <dt>{ui.text_1ec8bd}</dt>
              <dd>{formatDateTime(order.paidAt)}</dd>
            </>
          )}
          <dt>{ui.text_edcf39}</dt>
          <dd>
            <strong>{formatKzt(order.totalAmount, order.currency)}</strong>
          </dd>
        </dl>
      </section>

      <section className="form-card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>{ui.__a18ab6}</h2>
        <div className="table-scroll desktop-only">
          <table className="table">
            <thead>
              <tr>
                <th>{ui.text_c5ffa7}</th>
                <th>{ui.text_f90bfb}</th>
                <th>{ui.text_cf59eb}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{productLabel(locale, item.productCode)}</td>
                  <td>{formatDuration(locale, item.durationDays ?? null, item.durationHours ?? null)}</td>
                  <td>{formatKzt(item.finalPrice, order.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mobile-only">
          {order.items.map((item) => (
            <div key={item.id} className="promo-item">
              <div className="promo-body">
                <strong>{productLabel(locale, item.productCode)}</strong>
                <p>
                  {formatDuration(locale, item.durationDays ?? null, item.durationHours ?? null)} ·{' '}
                  {formatKzt(item.finalPrice, order.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {order.payments.length > 0 && (
        <section className="form-card" style={{ marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>{ui.text_8fc4bc}</h2>
          {order.payments.map((p) => (
            <div key={p.id} className="promo-item">
              <div className="promo-body">
                <strong>{p.provider}</strong>
                <p>
                  {formatKzt(p.amount, order.currency)} ·{' '}
                  <span className={monetizationStatusClass(p.status)}>
                    {paymentStatusLabel(locale, p.status)}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {campaigns.length > 0 && (
        <section className="form-card">
          <h2 style={{ marginTop: 0 }}>{ui.__c2265b}</h2>
          <div className="table-scroll desktop-only">
            <table className="table">
              <thead>
                <tr>
                  <th>{ui.text_c5ffa7}</th>
                  <th>{ui.text_7203f7}</th>
                  <th>{ui.text_e35653}</th>
                  <th>{ui.text_f90bfb}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>{productLabel(locale, c.product.code)}</td>
                    <td>
                      <span className={monetizationStatusClass(c.status)}>
                        {campaignStatusLabel(locale, c.status)}
                      </span>
                    </td>
                    <td>
                      {c.product.code === 'VIP_BANNER'
                        ? c.creative
                          ? `${c.creative.title} (${creativeStatusLabel(locale, c.creative.moderationStatus)})`
                          : '—'
                        : '—'}
                    </td>
                    <td>
                      {c.requestedStartAt && c.status === 'PENDING_MODERATION' ? (
                        <span title={ui.text_e93a9b}>{ui.__6b310c}</span>
                      ) : (
                        <>
                          {formatDate(c.startAt)} — {formatDate(c.endAt)}
                        </>
                      )}
                    </td>
                    <td>
                      <Link href={`/monetization/campaigns/${c.id}`} className="btn btn-sm">{ui.text_e946df}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-only">
            {campaigns.map((c) => (
              <div key={c.id} className="promo-item">
                <div className="promo-body">
                  <strong>{productLabel(locale, c.product.code)}</strong>
                  <span className={monetizationStatusClass(c.status)}>
                    {campaignStatusLabel(locale, c.status)}
                  </span>
                  {c.product.code === 'VIP_BANNER' && c.creative && (
                    <p style={{ fontSize: '0.85rem' }}>
                      {c.creative.title} · {creativeStatusLabel(locale, c.creative.moderationStatus)}
                    </p>
                  )}
                  <Link href={`/monetization/campaigns/${c.id}`} className="btn btn-sm">{ui.__c660cc}</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
