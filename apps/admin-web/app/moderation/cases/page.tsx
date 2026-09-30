'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useModerationContext } from '@/components/moderation/moderation-layout-client';
import { moderationApi, type ModerationCaseRow } from '@/lib/moderation-api';
import { moderationCaseStatusPresentation } from '@/lib/moderation-status-presentation';
import {
  mapModerationError,
  moderationCaseStatusLabel,
  moderationPriorityLabel,
  moderationTargetTypeLabel,
} from '@/lib/moderation-utils';
import { formatDateTime } from '@/lib/monetization-utils';
import { BackofficeBadge } from '@qalago/brand/badges';
import { BackofficeErrorState, BackofficeSkeleton } from '@qalago/brand/states';
import {
  BackofficeFilterSelect,
  BackofficePagination,
  BackofficeTable,
  BackofficeTableBody,
  BackofficeTableCell,
  BackofficeTableContainer,
  BackofficeTableEmpty,
  BackofficeTableHead,
  BackofficeTableHeaderCell,
  BackofficeTableRow,
  BackofficeTableToolbar,
} from '@qalago/brand/tables';

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'OPEN', label: moderationCaseStatusLabel('OPEN') },
  { value: 'IN_REVIEW', label: moderationCaseStatusLabel('IN_REVIEW') },
  { value: 'ACTION_REQUIRED', label: moderationCaseStatusLabel('ACTION_REQUIRED') },
  { value: 'RESOLVED', label: moderationCaseStatusLabel('RESOLVED') },
  { value: 'DISMISSED', label: moderationCaseStatusLabel('DISMISSED') },
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

  function loadCases() {
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
  }

  useEffect(() => {
    loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, status, citySlug, cityLocked]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="card">
      <BackofficeTableToolbar
        start={
          <BackofficeFilterSelect
            label="Статус"
            value={status}
            onChange={(value) => updateQuery({ status: value, page: 1 })}
            options={STATUS_OPTIONS}
          />
        }
      />

      {error ? (
        <BackofficeErrorState title="Не удалось загрузить кейсы" message={error} onRetry={loadCases} />
      ) : null}
      {loading ? <BackofficeSkeleton variant="table-row" count={6} /> : null}

      {!loading && !error && items.length === 0 ? (
        <BackofficeTableEmpty
          filtered={status !== 'OPEN' && status !== ''}
          emptyTitle="Открытых кейсов пока нет"
          filteredTitle="Кейсы с выбранным статусом не найдены"
          resetLabel="Сбросить фильтры"
          onResetFilters={() => updateQuery({ status: 'OPEN', page: 1 })}
          icon="moderation"
        />
      ) : null}

      {!loading && !error && items.length > 0 && (
        <BackofficeTableContainer>
          <BackofficeTable density="normal">
            <BackofficeTableHead>
              <tr>
                <BackofficeTableHeaderCell>Создан</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Объект</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Приоритет</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Статус</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Город</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell variant="numeric">Жалоб</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell variant="actions">Действия</BackofficeTableHeaderCell>
              </tr>
            </BackofficeTableHead>
            <BackofficeTableBody>
              {items.map((row) => {
                const statusPresentation = moderationCaseStatusPresentation(row.status);
                return (
                  <BackofficeTableRow key={row.id}>
                    <BackofficeTableCell>{formatDateTime(row.createdAt)}</BackofficeTableCell>
                    <BackofficeTableCell>
                      {moderationTargetTypeLabel(row.targetType)}
                      <span className="bo-table-cell--mono">{row.targetId.slice(0, 10)}…</span>
                    </BackofficeTableCell>
                    <BackofficeTableCell>{moderationPriorityLabel(row.priority)}</BackofficeTableCell>
                    <BackofficeTableCell>
                      <BackofficeBadge
                        label={statusPresentation.label}
                        tone={statusPresentation.tone}
                        size="compact"
                      />
                    </BackofficeTableCell>
                    <BackofficeTableCell>{row.city?.nameRu ?? '—'}</BackofficeTableCell>
                    <BackofficeTableCell variant="numeric">{row.reportCount ?? '—'}</BackofficeTableCell>
                    <BackofficeTableCell variant="actions">
                      <Link href={`/moderation/cases/${row.id}`} className="btn btn-sm">
                        Открыть
                      </Link>
                    </BackofficeTableCell>
                  </BackofficeTableRow>
                );
              })}
            </BackofficeTableBody>
          </BackofficeTable>
        </BackofficeTableContainer>
      )}

      <BackofficePagination page={page} totalPages={totalPages} onPageChange={(p) => updateQuery({ page: p })} />
    </div>
  );
}
