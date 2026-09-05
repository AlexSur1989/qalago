'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MonetizationOrder, ownerApi } from '@/lib/api';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import {
  formatDateTime,
  formatKzt,
  monetizationStatusClass,
  orderStatusLabel,
  parseApiError,
  productLabel,
} from '@/lib/monetization-utils';

export default function MonetizationOrdersPage() {
  const { token, business } = useMonetizationContext();
  const [orders, setOrders] = useState<MonetizationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ownerApi
      .listMonetizationOrders(token, business.id)
      .then((items) => {
        if (!cancelled) {
          setOrders(
            [...items].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            ),
          );
        }
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
  }, [token, business.id]);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Мои заказы</h1>
          <p className="page-header-meta">История рекламных заказов</p>
        </div>
        <Link href="/monetization/products" className="btn btn-sm">
          Новый заказ
        </Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>}

      {!loading && orders.length === 0 && (
        <section className="form-card">
          <p style={{ color: 'var(--text-muted)' }}>Заказов пока нет.</p>
          <Link href="/monetization/products" className="btn btn-sm">
            Выбрать размещение
          </Link>
        </section>
      )}

      {orders.length > 0 && (
        <>
          <div className="table-scroll desktop-only">
            <table className="table">
              <thead>
                <tr>
                  <th>Номер</th>
                  <th>Дата</th>
                  <th>Состав</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td>
                      {order.items.map((i) => productLabel(i.productCode)).join(', ')}
                    </td>
                    <td>{formatKzt(order.totalAmount, order.currency)}</td>
                    <td>
                      <span className={monetizationStatusClass(order.status)}>
                        {orderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>
                      <Link href={`/monetization/orders/${order.id}`} className="btn btn-sm">
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobile-only">
            {orders.map((order) => (
              <section key={order.id} className="form-card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{order.orderNumber}</strong>
                  <span className={monetizationStatusClass(order.status)}>
                    {orderStatusLabel(order.status)}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '8px 0' }}>
                  {formatDateTime(order.createdAt)} · {formatKzt(order.totalAmount, order.currency)}
                </p>
                <Link href={`/monetization/orders/${order.id}`} className="btn btn-sm">
                  Детали
                </Link>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
