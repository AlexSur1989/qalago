'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useBusinessRequestsContext } from '@/components/business-requests/business-requests-layout-client';
import { businessRequestsApi, type BusinessOwnershipClaimRow } from '@/lib/business-requests-api';
import {
  claimStatusClass,
  claimStatusLabel,
  mapBusinessRequestError,
  verificationMethodLabel,
} from '@/lib/business-requests-utils';
import { formatDateTime } from '@/lib/monetization-utils';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'На проверке' },
  { value: 'APPROVED', label: 'Одобрено' },
  { value: 'REJECTED', label: 'Отклонено' },
  { value: 'CANCELLED', label: 'Отменено' },
];

export default function OwnershipClaimsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user, citySlug, cityLocked } = useBusinessRequestsContext();

  const page = Number(searchParams.get('page') ?? '1') || 1;
  const status = searchParams.get('status') ?? 'PENDING';

  const [items, setItems] = useState<BusinessOwnershipClaimRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateQuery = useCallback(
    (next: { page?: number; status?: string }) => {
      const qs = new URLSearchParams(searchParams.toString());
      if (next.page != null) qs.set('page', String(next.page));
      if (next.status != null) {
        if (next.status) qs.set('status', next.status);
        else qs.delete('status');
      }
      router.push(`/business-requests/claims?${qs.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    businessRequestsApi
      .listClaims(token, {
        page,
        limit: 20,
        status: status || undefined,
        citySlug: cityLocked ? undefined : citySlug,
      })
      .then((res) => {
        setItems(res.items);
        setTotal(res.meta.total);
      })
      .catch((err: unknown) => setError(mapBusinessRequestError(String(err))))
      .finally(() => setLoading(false));
  }, [token, page, status, citySlug, cityLocked]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="card">
      <div className="toolbar" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '12px' }}>
        <label>
          Статус{' '}
          <select
            value={status}
            onChange={(e) => updateQuery({ status: e.target.value, page: 1 })}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        {user.role !== 'CITY_ADMIN' && (
          <span className="muted">Город: {citySlug}</span>
        )}
        {user.role === 'CITY_ADMIN' && user.managedCity && (
          <span className="muted">Город: {user.managedCity.nameRu}</span>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && <p>Загрузка…</p>}

      {!loading && items.length === 0 && (
        <p className="muted">
          {status === 'PENDING'
            ? 'Нет заявок на подтверждение владельца.'
            : 'Заявки с выбранным статусом не найдены.'}
        </p>
      )}

      {!loading && items.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Бизнес</th>
                <th>Город</th>
                <th>Статус</th>
                <th>Проверка</th>
                <th>Заявитель</th>
                <th>Дата</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{row.business?.title ?? '—'}</td>
                  <td>{row.business?.city?.nameRu ?? '—'}</td>
                  <td>
                    <span className={claimStatusClass(row.status)}>
                      {claimStatusLabel(row.status)}
                    </span>
                  </td>
                  <td>{verificationMethodLabel(row.verificationMethod)}</td>
                  <td>{row.claimant?.name ?? row.claimant?.role ?? '—'}</td>
                  <td>{formatDateTime(row.createdAt)}</td>
                  <td>
                    <Link
                      href={`/business-requests/claims/${row.id}`}
                      className="btn btn-sm"
                    >
                      Открыть
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="toolbar" style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => updateQuery({ page: page - 1 })}
          >
            ← Назад
          </button>
          <span className="muted">
            Страница {page} из {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-sm"
            disabled={page >= totalPages}
            onClick={() => updateQuery({ page: page + 1 })}
          >
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
}
