'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AuditLogRow } from '@/lib/api';
import { canViewAdminAuditLogs } from '@/lib/admin-catalog-rbac';
import { BackofficePageHeader } from '@/components/backoffice-page-header';
import { useAuth } from '@/lib/use-auth';
import {
  auditActionFilterLabel,
  auditActionLabel,
} from '@/lib/audit-action-presentation';
import {
  BackofficeErrorState,
  BackofficeSkeleton,
} from '@qalago/brand/states';
import {
  BackofficeFilterSelect,
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

const ACTION_FILTER_OPTIONS = [
  { value: '', label: 'Все действия' },
  { value: 'USER_ROLE_CHANGE', label: auditActionFilterLabel('USER_ROLE_CHANGE') },
  { value: 'PAYMENT_CONFIRM', label: auditActionFilterLabel('PAYMENT_CONFIRM') },
  { value: 'TEAM_INVITE', label: auditActionFilterLabel('TEAM_INVITE') },
  { value: 'TEAM_PERMISSION_UPDATE', label: auditActionFilterLabel('TEAM_PERMISSION_UPDATE') },
];

export default function AuditLogsPage() {
  const router = useRouter();
  const { token, user, ready } = useAuth();
  const [items, setItems] = useState<AuditLogRow[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function loadLogs() {
    if (!token) return;
    setLoading(true);
    setError(null);
    adminApi
      .listAuditLogs(token, {
        page: 1,
        limit: 50,
        action: actionFilter || undefined,
      })
      .then((res) => setItems(res.items))
      .catch(() => setError('Не удалось загрузить журнал аудита'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!ready) return;
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (!canViewAdminAuditLogs(user.role)) {
      router.replace('/dashboard');
    }
  }, [ready, token, user, router]);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, actionFilter]);

  if (!ready || !user) return null;

  const description =
    user.role === 'CITY_ADMIN'
      ? 'Записи только по вашему городу'
      : 'Все операционные изменения платформы';

  return (
    <>
      <BackofficePageHeader title="Журнал аудита" description={description} />

      <BackofficeTableToolbar
        start={
          <BackofficeFilterSelect
            label="Действие"
            value={actionFilter}
            onChange={setActionFilter}
            options={ACTION_FILTER_OPTIONS}
          />
        }
      />

      {error ? (
        <BackofficeErrorState
          title="Не удалось загрузить журнал аудита"
          message={error}
          onRetry={loadLogs}
          retrying={loading}
        />
      ) : null}

      {loading ? <BackofficeSkeleton variant="table-row" count={6} /> : null}

      {!loading && !error && items.length === 0 ? (
        <BackofficeTableEmpty
          filtered={Boolean(actionFilter)}
          emptyTitle="Записей пока нет"
          emptyDescription="Аудит ведётся с момента включения Stage 5M.3."
          filteredTitle="Нет записей по выбранному действию"
          resetLabel="Сбросить фильтр"
          onResetFilters={actionFilter ? () => setActionFilter('') : undefined}
          icon="audit"
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <BackofficeTableContainer>
          <BackofficeTable density="compact">
            <BackofficeTableHead>
              <tr>
                <BackofficeTableHeaderCell>Время</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Актор</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Действие</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Ресурс</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Заведение / город</BackofficeTableHeaderCell>
              </tr>
            </BackofficeTableHead>
            <BackofficeTableBody>
              {items.map((row) => (
                <BackofficeTableRow key={row.id}>
                  <BackofficeTableCell>{new Date(row.createdAt).toLocaleString('ru-RU')}</BackofficeTableCell>
                  <BackofficeTableCell>
                    {row.actor?.name ?? row.actor?.phone ?? '—'}
                    {row.actor?.role ? ` (${row.actor.role})` : ''}
                  </BackofficeTableCell>
                  <BackofficeTableCell>{auditActionLabel(row.action)}</BackofficeTableCell>
                  <BackofficeTableCell variant="mono">
                    {row.resourceType}
                    {row.resourceId ? ` · ${row.resourceId.slice(0, 8)}…` : ''}
                  </BackofficeTableCell>
                  <BackofficeTableCell>
                    {row.business?.title ?? '—'}
                    {row.city?.nameRu ? ` · ${row.city.nameRu}` : ''}
                  </BackofficeTableCell>
                </BackofficeTableRow>
              ))}
            </BackofficeTableBody>
          </BackofficeTable>
        </BackofficeTableContainer>
      ) : null}
    </>
  );
}
