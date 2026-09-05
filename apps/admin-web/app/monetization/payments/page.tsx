'use client';

import { useEffect, useState } from 'react';
import { monetizationApi, MonetizationPaymentRow } from '@/lib/monetization-api';
import { useMonetizationContext } from '@/components/monetization/monetization-layout-client';
import { confirmAction } from '@/lib/admin-utils';
import {
  canConfirmPayment,
  formatDateTime,
  formatKzt,
  monetizationStatusClass,
  parseApiError,
  paymentStatusLabel,
} from '@/lib/monetization-utils';

export default function MonetizationPaymentsPage() {
  const { token, citySlug } = useMonetizationContext();
  const [payments, setPayments] = useState<MonetizationPaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function loadPayments() {
    setLoading(true);
    setError(null);
    try {
      const res = await monetizationApi.listPayments(token, {
        citySlug,
        page,
        limit: 20,
      });
      setPayments(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, citySlug, page]);

  async function confirmPayment(payment: MonetizationPaymentRow) {
    const msg = `Подтвердить получение оплаты ${formatKzt(payment.amount, payment.currency)} по заказу ${payment.orderNumber}?\n\nПосле подтверждения рекламная кампания может быть активирована автоматически.`;
    if (!confirmAction(msg)) return;

    setConfirmingId(payment.id);
    setError(null);
    setInfo(null);
    try {
      const result = await monetizationApi.confirmPayment(token, payment.id);
      if (result.alreadyPaid) {
        setInfo('Оплата уже была подтверждена ранее.');
      } else {
        setInfo('Оплата подтверждена.');
      }
      await loadPayments();
    } catch (err) {
      setError('Не удалось подтвердить оплату.');
      console.debug(parseApiError(err));
    } finally {
      setConfirmingId(null);
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / 20));

  return (
    <>
      <div className="page-header">
        <h1>Оплаты</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      <section className="card">
        <h2>Список оплат ({total})</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
        ) : payments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Нет оплат</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Payment / Order</th>
                  <th>Бизнес</th>
                  <th>Сумма</th>
                  <th>Provider</th>
                  <th>Статус</th>
                  <th>Создан</th>
                  <th>Оплачен</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div>{p.id.slice(0, 10)}…</div>
                      <div className="table-sub">{p.orderNumber}</div>
                    </td>
                    <td>{p.business.title}</td>
                    <td>{formatKzt(p.amount, p.currency)}</td>
                    <td>{p.provider}</td>
                    <td>
                      <span className={monetizationStatusClass(p.status)}>
                        {paymentStatusLabel(p.status)}
                      </span>
                    </td>
                    <td>{formatDateTime(p.createdAt)}</td>
                    <td>{formatDateTime(p.paidAt)}</td>
                    <td>
                      {canConfirmPayment(p.status, p.provider) ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={confirmingId === p.id}
                          onClick={() => confirmPayment(p)}
                        >
                          {confirmingId === p.id ? '…' : 'Подтвердить оплату'}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pageCount > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((v) => v - 1)}
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
                  onClick={() => setPage((v) => v + 1)}
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
