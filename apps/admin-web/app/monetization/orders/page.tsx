'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { monetizationApi, MonetizationOrderRow } from '@/lib/monetization-api';
import { useMonetizationContext } from '@/components/monetization/monetization-layout-client';
import {
  formatDate,
  formatKzt,
  monetizationStatusClass,
  orderStatusLabel,
  parseApiError,
  productLabel,
} from '@/lib/monetization-utils';

export default function MonetizationOrdersPage() {
  const { token, citySlug } = useMonetizationContext();
  const [orders, setOrders] = useState<MonetizationOrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [citySlug, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    monetizationApi
      .listOrders(token, {
        citySlug,
        status: statusFilter || undefined,
        page,
        limit: 20,
      })
      .then((res) => {
        if (cancelled) return;
        setOrders(res.items);
        setTotal(res.total);
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
  }, [token, citySlug, statusFilter, page]);

  const pageCount = Math.max(1, Math.ceil(total / 20));

  return (
    <>
      <div className="page-header">
        <h1>Заказы</h1>
      </div>
      {error && <div className="alert alert-error">Не удалось загрузить заказы. {error}</div>}

      <section className="card">
        <div className="table-toolbar">
          <h2>Список заказов ({total})</h2>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="AWAITING_PAYMENT">Ожидает оплаты</option>
            <option value="PAID">Оплачен</option>
            <option value="CANCELLED">Отменён</option>
          </select>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
        ) : orders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Нет заказов</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>№ заказа</th>
                  <th>Бизнес</th>
                  <th>Город</th>
                  <th>Продукт</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Дата</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const primaryItem = order.items[0];
                  return (
                    <tr key={order.id}>
                      <td>{order.orderNumber}</td>
                      <td>{order.business?.title ?? '—'}</td>
                      <td>{order.business?.city?.nameRu ?? '—'}</td>
                      <td>
                        {primaryItem
                          ? productLabel(primaryItem.productCode)
                          : '—'}
                      </td>
                      <td>{formatKzt(order.totalAmount, order.currency)}</td>
                      <td>
                        <span className={monetizationStatusClass(order.status)}>
                          {orderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <Link href={`/monetization/orders/${order.id}`} className="btn btn-sm">
                          Открыть
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {pageCount > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Назад
                </button>
                <span className="pagination-meta">
                  Стр. {page} из {pageCount}
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={page >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Вперёд →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
