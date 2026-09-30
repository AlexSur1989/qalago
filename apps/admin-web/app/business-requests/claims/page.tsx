'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useBusinessRequestsContext } from '@/components/business-requests/business-requests-layout-client';
import { businessRequestsApi, type BusinessOwnershipClaimRow } from '@/lib/business-requests-api';
import { claimStatusPresentation } from '@/lib/claim-status-presentation';
import {
  claimStatusLabel,
  mapBusinessRequestError,
  verificationMethodLabel,
} from '@/lib/business-requests-utils';
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
  { value: 'PENDING', label: claimStatusLabel('PENDING') },
  { value: 'APPROVED', label: claimStatusLabel('APPROVED') },
  { value: 'REJECTED', label: claimStatusLabel('REJECTED') },
  { value: 'CANCELLED', label: claimStatusLabel('CANCELLED') },
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

  function loadClaims() {
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
  }

  useEffect(() => {
    loadClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, status, citySlug, cityLocked]);

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const cityLabel =
    user.role === 'CITY_ADMIN' && user.managedCity ? user.managedCity.nameRu : citySlug;

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
        meta={`Город: ${cityLabel}`}
      />

      {error ? (
        <BackofficeErrorState title="Не удалось загрузить заявки" message={error} onRetry={loadClaims} />
      ) : null}
      {loading ? <BackofficeSkeleton variant="table-row" count={5} /> : null}

      {!loading && !error && items.length === 0 ? (
        <BackofficeTableEmpty
          filtered={status !== 'PENDING'}
          emptyTitle="Нет заявок на подтверждение владельца"
          filteredTitle="Заявки с выбранным статусом не найдены"
          resetLabel="Сбросить фильтры"
          onResetFilters={() => updateQuery({ status: 'PENDING', page: 1 })}
          icon="file-request"
        />
      ) : null}

      {!loading && !error && items.length > 0 && (
        <BackofficeTableContainer>
          <BackofficeTable density="normal">
            <BackofficeTableHead>
              <tr>
                <BackofficeTableHeaderCell>Бизнес</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Город</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Статус</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Проверка</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Заявитель</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Дата</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell variant="actions">Действия</BackofficeTableHeaderCell>
              </tr>
            </BackofficeTableHead>
            <BackofficeTableBody>
              {items.map((row) => {
                const statusPresentation = claimStatusPresentation(row.status);
                return (
                  <BackofficeTableRow key={row.id}>
                    <BackofficeTableCell variant="truncate">
                      {row.business?.title ?? '—'}
                    </BackofficeTableCell>
                    <BackofficeTableCell>{row.business?.city?.nameRu ?? '—'}</BackofficeTableCell>
                    <BackofficeTableCell>
                      <BackofficeBadge
                        label={statusPresentation.label}
                        tone={statusPresentation.tone}
                        size="compact"
                      />
                    </BackofficeTableCell>
                    <BackofficeTableCell>{verificationMethodLabel(row.verificationMethod)}</BackofficeTableCell>
                    <BackofficeTableCell>{row.claimant?.name ?? row.claimant?.role ?? '—'}</BackofficeTableCell>
                    <BackofficeTableCell>{formatDateTime(row.createdAt)}</BackofficeTableCell>
                    <BackofficeTableCell variant="actions">
                      <Link href={`/business-requests/claims/${row.id}`} className="btn btn-sm">
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
