'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useLegalContext } from '@/components/legal/legal-layout-client';
import { legalApi, type DataRightsRequestRow } from '@/lib/legal-api';
import {
  dataRightsRequestStatusClass,
  dataRightsRequestStatusLabel,
  dataRightsRequestTypeLabel,
  mapLegalError,
} from '@/lib/legal-utils';
import { formatDateTime } from '@/lib/monetization-utils';

const STATUS_OPTIONS = [
  { value: '', label: 'Все' },
  { value: 'SUBMITTED', label: 'Получено' },
  { value: 'IN_REVIEW', label: 'На рассмотрении' },
  { value: 'PROCESSING', label: 'В обработке' },
  { value: 'COMPLETED', label: 'Завершено' },
  { value: 'REJECTED', label: 'Отклонено' },
];

export default function DataRequestsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useLegalContext();

  const page = Number(searchParams.get('page') ?? '1') || 1;
  const status = searchParams.get('status') ?? 'SUBMITTED';

  const [items, setItems] = useState<DataRightsRequestRow[]>([]);
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
      router.push(`/legal/data-requests?${qs.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    legalApi
      .listDataRequests(token, {
        page,
        limit: 20,
        status: status || undefined,
      })
      .then((res) => {
        setItems(res.items);
        setTotal(res.meta.total);
      })
      .catch((err: unknown) => setError(mapLegalError(String(err))))
      .finally(() => setLoading(false));
  }, [token, page, status]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="card">
      <p className="muted" style={{ marginTop: 0 }}>
        LEGAL_REVIEW_REQUIRED — сроки ответа и верификация личности должны быть согласованы с
        юристом (KZ).
      </p>
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
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && <p>Загрузка…</p>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Получено</th>
                <th>Тип</th>
                <th>Пользователь</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateTime(row.requestedAt)}</td>
                  <td>{dataRightsRequestTypeLabel(row.type)}</td>
                  <td>
                    {row.user?.name ?? row.user?.phone ?? row.userId.slice(0, 8)}
                    {row.user?.email ? ` · ${row.user.email}` : ''}
                  </td>
                  <td>
                    <span className={dataRightsRequestStatusClass(row.status)}>
                      {dataRightsRequestStatusLabel(row.status)}
                    </span>
                  </td>
                  <td>
                    <Link href={`/legal/data-requests/${row.id}`} className="btn btn-sm">
                      Открыть
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="muted" style={{ padding: '1rem' }}>
              Запросов нет. API: GET /api/v1/admin/legal/data-requests
            </p>
          )}
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
            Стр. {page} / {totalPages}
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
