'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useBusinessRequestsContext } from '@/components/business-requests/business-requests-layout-client';
import { businessRequestsApi, type BusinessApplicationRow } from '@/lib/business-requests-api';
import { applicationStatusPresentation } from '@/lib/application-status-presentation';
import { applicationStatusLabel, mapBusinessRequestError } from '@/lib/business-requests-utils';
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
  { value: 'PENDING', label: applicationStatusLabel('PENDING') },
  { value: 'APPROVED', label: applicationStatusLabel('APPROVED') },
  { value: 'REJECTED', label: applicationStatusLabel('REJECTED') },
  { value: 'CANCELLED', label: applicationStatusLabel('CANCELLED') },
  { value: 'DRAFT', label: applicationStatusLabel('DRAFT') },
];

export default function BusinessApplicationsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user, citySlug, cityLocked } = useBusinessRequestsContext();

  const page = Number(searchParams.get('page') ?? '1') || 1;
  const status = searchParams.get('status') ?? 'PENDING';

  const [items, setItems] = useState<BusinessApplicationRow[]>([]);
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
      router.push(`/business-requests/applications?${qs.toString()}`);
    },
    [router, searchParams],
  );

  function loadApplications() {
    setLoading(true);
    setError(null);
    businessRequestsApi
      .listApplications(token, {
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
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, status, citySlug, cityLocked]);

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const cityLabel =
    user.role === 'CITY_ADMIN' && user.managedCity
      ? user.managedCity.nameRu
      : citySlug;

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
        meta={user.role !== 'CITY_ADMIN' ? `Город: ${cityLabel}` : `Город: ${cityLabel}`}
      />

      {error ? (
        <BackofficeErrorState title="Не удалось загрузить заявки" message={error} onRetry={loadApplications} />
      ) : null}
      {loading ? <BackofficeSkeleton variant="table-row" count={5} /> : null}

      {!loading && !error && items.length === 0 ? (
        <BackofficeTableEmpty
          filtered={status !== 'PENDING'}
          emptyTitle="Нет заявок на проверке"
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
                <BackofficeTableHeaderCell>Название</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Город</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Категория</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Адрес</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Заявитель</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Статус</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Дата</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell variant="actions">Действия</BackofficeTableHeaderCell>
              </tr>
            </BackofficeTableHead>
            <BackofficeTableBody>
              {items.map((row) => {
                const statusPresentation = applicationStatusPresentation(row.status);
                return (
                  <BackofficeTableRow key={row.id}>
                    <BackofficeTableCell variant="truncate">{row.title}</BackofficeTableCell>
                    <BackofficeTableCell>{row.city?.nameRu ?? '—'}</BackofficeTableCell>
                    <BackofficeTableCell>{row.category?.title ?? '—'}</BackofficeTableCell>
                    <BackofficeTableCell variant="truncate">{row.address}</BackofficeTableCell>
                    <BackofficeTableCell>{row.applicant?.name ?? row.applicant?.role ?? '—'}</BackofficeTableCell>
                    <BackofficeTableCell>
                      <BackofficeBadge
                        label={statusPresentation.label}
                        tone={statusPresentation.tone}
                        size="compact"
                      />
                    </BackofficeTableCell>
                    <BackofficeTableCell>{formatDateTime(row.createdAt)}</BackofficeTableCell>
                    <BackofficeTableCell variant="actions">
                      <Link href={`/business-requests/applications/${row.id}`} className="btn btn-sm">
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
