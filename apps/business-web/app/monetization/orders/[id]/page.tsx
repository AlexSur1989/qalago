'use client';

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

export default function MonetizationOrderDetailPage() {
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
        if (!cancelled) setError(parseApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, orderId]);

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>;
  if (error || !order) {
    return <div className="alert alert-error">{error ?? 'Заказ не найден'}</div>;
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
          <h1>Заказ {order.orderNumber}</h1>
          <p className="page-header-meta">{formatDateTime(order.createdAt)}</p>
        </div>
        <Link href="/monetization/orders" className="btn btn-ghost btn-sm">
          ← К списку
        </Link>
      </header>

      {hasMixedPackage && hasVipWaiting && order.status === 'PAID' && (
        <div className="alert" style={{ marginBottom: 16 }}>
          Пакет частично активен: размещения без VIP уже запущены или запланированы. VIP-баннер
          начнёт показы после одобрения креатива модератором — до этого период VIP не стартует.
        </div>
      )}

      {pendingPayment && (
        <div className="alert" style={{ marginBottom: 16 }}>
          Заказ ожидает ручной оплаты. После перевода средств администратор подтвердит оплату — до
          этого кампании не активируются.
        </div>
      )}

      <section className="form-card" style={{ marginBottom: 16 }}>
        <dl className="detail-grid">
          <dt>Статус</dt>
          <dd>
            <span className={monetizationStatusClass(order.status)}>
              {orderStatusLabel(order.status)}
            </span>
          </dd>
          {order.paidAt && (
            <>
              <dt>Оплачен</dt>
              <dd>{formatDateTime(order.paidAt)}</dd>
            </>
          )}
          <dt>Итого</dt>
          <dd>
            <strong>{formatKzt(order.totalAmount, order.currency)}</strong>
          </dd>
        </dl>
      </section>

      <section className="form-card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Состав заказа</h2>
        <div className="table-scroll desktop-only">
          <table className="table">
            <thead>
              <tr>
                <th>Продукт</th>
                <th>Период</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{productLabel(item.productCode)}</td>
                  <td>{formatDuration(item.durationDays ?? null, item.durationHours ?? null)}</td>
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
                <strong>{productLabel(item.productCode)}</strong>
                <p>
                  {formatDuration(item.durationDays ?? null, item.durationHours ?? null)} ·{' '}
                  {formatKzt(item.finalPrice, order.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {order.payments.length > 0 && (
        <section className="form-card" style={{ marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>Оплаты</h2>
          {order.payments.map((p) => (
            <div key={p.id} className="promo-item">
              <div className="promo-body">
                <strong>{p.provider}</strong>
                <p>
                  {formatKzt(p.amount, order.currency)} ·{' '}
                  <span className={monetizationStatusClass(p.status)}>
                    {paymentStatusLabel(p.status)}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {campaigns.length > 0 && (
        <section className="form-card">
          <h2 style={{ marginTop: 0 }}>Связанные кампании</h2>
          <div className="table-scroll desktop-only">
            <table className="table">
              <thead>
                <tr>
                  <th>Продукт</th>
                  <th>Статус</th>
                  <th>Креатив</th>
                  <th>Период</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>{productLabel(c.product.code)}</td>
                    <td>
                      <span className={monetizationStatusClass(c.status)}>
                        {campaignStatusLabel(c.status)}
                      </span>
                    </td>
                    <td>
                      {c.product.code === 'VIP_BANNER'
                        ? c.creative
                          ? `${c.creative.title} (${creativeStatusLabel(c.creative.moderationStatus)})`
                          : '—'
                        : '—'}
                    </td>
                    <td>
                      {c.requestedStartAt && c.status === 'PENDING_MODERATION' ? (
                        <span title={`Запрошено: ${formatDateTime(c.requestedStartAt)}`}>
                          после одобрения
                        </span>
                      ) : (
                        <>
                          {formatDate(c.startAt)} — {formatDate(c.endAt)}
                        </>
                      )}
                    </td>
                    <td>
                      <Link href={`/monetization/campaigns/${c.id}`} className="btn btn-sm">
                        Открыть
                      </Link>
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
                  <strong>{productLabel(c.product.code)}</strong>
                  <span className={monetizationStatusClass(c.status)}>
                    {campaignStatusLabel(c.status)}
                  </span>
                  {c.product.code === 'VIP_BANNER' && c.creative && (
                    <p style={{ fontSize: '0.85rem' }}>
                      {c.creative.title} · {creativeStatusLabel(c.creative.moderationStatus)}
                    </p>
                  )}
                  <Link href={`/monetization/campaigns/${c.id}`} className="btn btn-sm">
                    Детали кампании
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
