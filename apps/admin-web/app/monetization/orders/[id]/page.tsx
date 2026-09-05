'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { monetizationApi, MonetizationOrderDetail } from '@/lib/monetization-api';
import { useMonetizationContext } from '@/components/monetization/monetization-layout-client';
import {
  campaignStatusLabel,
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
  const params = useParams();
  const orderId = String(params.id);
  const { token } = useMonetizationContext();
  const [order, setOrder] = useState<MonetizationOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    monetizationApi
      .getOrder(token, orderId)
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

  return (
    <>
      <div className="page-header">
        <h1>Заказ {order.orderNumber}</h1>
        <Link href="/monetization/orders" className="btn btn-sm">
          ← К списку
        </Link>
      </div>

      <section className="card">
        <h2>Информация</h2>
        <dl className="detail-grid">
          <dt>Бизнес</dt>
          <dd>{order.business.title}</dd>
          <dt>Город</dt>
          <dd>{order.business.city.nameRu}</dd>
          <dt>Категория</dt>
          <dd>{order.business.category?.title ?? '—'}</dd>
          <dt>Статус заказа</dt>
          <dd>
            <span className={monetizationStatusClass(order.status)}>
              {orderStatusLabel(order.status)}
            </span>
          </dd>
          <dt>Создан</dt>
          <dd>{formatDateTime(order.createdAt)}</dd>
          {order.paidAt && (
            <>
              <dt>Оплачен</dt>
              <dd>{formatDateTime(order.paidAt)}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="card">
        <h2>Состав заказа</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Продукт</th>
              <th>Период</th>
              <th>Стоимость</th>
              <th>Скидка</th>
              <th>Итого</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{productLabel(item.productCode)}</td>
                <td>{formatDuration(item.durationDays, item.durationHours)}</td>
                <td>{formatKzt(item.basePrice)}</td>
                <td>
                  {item.discountAmount > 0
                    ? `-${formatKzt(item.discountAmount)} (${item.discountPercent}%)`
                    : '—'}
                </td>
                <td>{formatKzt(item.finalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="order-total-row">
          <span>Итого</span>
          <strong>{formatKzt(order.totalAmount, order.currency)}</strong>
        </div>
      </section>

      {order.payments && order.payments.length > 0 && (
        <section className="card">
          <h2>Оплаты</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Provider</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {order.payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.id.slice(0, 8)}…</td>
                  <td>{p.provider}</td>
                  <td>{formatKzt(p.amount)}</td>
                  <td>
                    <span className={monetizationStatusClass(p.status)}>
                      {paymentStatusLabel(p.status)}
                    </span>
                  </td>
                  <td>
                    <Link href="/monetization/payments" className="btn btn-sm">
                      К оплатам
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pendingPayment && (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Ожидает ручного подтверждения оплаты в разделе «Оплаты».
            </p>
          )}
        </section>
      )}

      {order.campaigns.length > 0 && (
        <section className="card">
          <h2>Связанные кампании</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Продукт</th>
                <th>Статус</th>
                <th>Период</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {order.campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{productLabel(c.product.code)}</td>
                  <td>
                    <span className={monetizationStatusClass(c.status)}>
                      {campaignStatusLabel(c.status)}
                    </span>
                  </td>
                  <td>
                    {formatDate(c.startAt)} — {formatDate(c.endAt)}
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
        </section>
      )}
    </>
  );
}
