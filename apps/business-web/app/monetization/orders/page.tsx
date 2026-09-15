'use client';

import { useLocale, useUi } from '@/components/locale-provider';
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
  const locale = useLocale();
  const ui = useUi();

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
        if (!cancelled) setError(parseApiError(locale, err));
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
          <h1>{ui.__1c4a26}</h1>
          <p className="page-header-meta">{ui.___72bac8}</p>
        </div>
        <Link href="/monetization/products" className="btn btn-sm">{ui.__9a1a00}</Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p style={{ color: 'var(--text-muted)' }}>{ui.text_89d69a}</p>}

      {!loading && orders.length === 0 && (
        <section className="form-card">
          <p style={{ color: 'var(--text-muted)' }}>{ui.___3de465}</p>
          <Link href="/monetization/products" className="btn btn-sm">{ui.__ded83d}</Link>
        </section>
      )}

      {orders.length > 0 && (
        <>
          <div className="table-scroll desktop-only">
            <table className="table">
              <thead>
                <tr>
                  <th>{ui.text_d6d264}</th>
                  <th>{ui.text_8cdd8b}</th>
                  <th>{ui.text_fa9392}</th>
                  <th>{ui.text_cf59eb}</th>
                  <th>{ui.text_7203f7}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td>
                      {order.items.map((i) => productLabel(locale, i.productCode)).join(', ')}
                    </td>
                    <td>{formatKzt(order.totalAmount, order.currency)}</td>
                    <td>
                      <span className={monetizationStatusClass(order.status)}>
                        {orderStatusLabel(locale, order.status)}
                      </span>
                    </td>
                    <td>
                      <Link href={`/monetization/orders/${order.id}`} className="btn btn-sm">{ui.text_e946df}</Link>
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
                    {orderStatusLabel(locale, order.status)}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '8px 0' }}>
                  {formatDateTime(order.createdAt)} · {formatKzt(order.totalAmount, order.currency)}
                </p>
                <Link href={`/monetization/orders/${order.id}`} className="btn btn-sm">{ui.text_59dca9}</Link>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
