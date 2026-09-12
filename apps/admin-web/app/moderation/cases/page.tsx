'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useModerationContext } from '@/components/moderation/moderation-layout-client';
import { moderationApi, type ModerationCaseRow } from '@/lib/moderation-api';
import {
  mapModerationError,
  moderationCaseStatusClass,
  moderationCaseStatusLabel,
  moderationPriorityLabel,
  moderationTargetTypeLabel,
} from '@/lib/moderation-utils';
import { formatDateTime } from '@/lib/monetization-utils';

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'OPEN', label: 'Открыто' },
  { value: 'IN_REVIEW', label: 'На проверке' },
  { value: 'ACTION_REQUIRED', label: 'Нужно действие' },
  { value: 'RESOLVED', label: 'Закрыто' },
  { value: 'DISMISSED', label: 'Отклонено' },
];

export default function ModerationCasesListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, citySlug, cityLocked } = useModerationContext();

  const page = Number(searchParams.get('page') ?? '1') || 1;
  const status = searchParams.get('status') ?? 'OPEN';

  const [items, setItems] = useState<ModerationCaseRow[]>([]);
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
      router.push(`/moderation/cases?${qs.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    moderationApi
      .listCases(token, {
        page,
        limit: 20,
        status: status || undefined,
        citySlug: cityLocked ? undefined : citySlug,
      })
      .then((res) => {
        setItems(res.items);
        setTotal(res.meta.total);
      })
      .catch((err: unknown) => setError(mapModerationError(String(err))))
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
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && <p>Загрузка…</p>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Создан</th>
                <th>Объект</th>
                <th>Приоритет</th>
                <th>Статус</th>
                <th>Город</th>
                <th>Жалоб</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateTime(row.createdAt)}</td>
                  <td>
                    {moderationTargetTypeLabel(row.targetType)}
                    <div className="muted" style={{ fontSize: '0.85rem' }}>
                      {row.targetId.slice(0, 10)}…
                    </div>
                  </td>
                  <td>{moderationPriorityLabel(row.priority)}</td>
                  <td>
                    <span className={moderationCaseStatusClass(row.status)}>
                      {moderationCaseStatusLabel(row.status)}
                    </span>
                  </td>
                  <td>{row.city?.nameRu ?? '—'}</td>
                  <td>{row.reportCount ?? '—'}</td>
                  <td>
                    <Link href={`/moderation/cases/${row.id}`} className="btn btn-sm">
                      Открыть
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="muted" style={{ padding: '1rem' }}>
              Кейсов пока нет. API: GET /api/v1/admin/moderation/cases
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
